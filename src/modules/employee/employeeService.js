const boom = require('@hapi/boom');
const Op = require('sequelize/lib/operators');
const bcrypt = require('bcrypt');

const { Employee } = require('./employee');
const { TypeOfEmployee } = require('../typeOfEmployee/typeOfEmployee');
const { TypeOfEmployeeService } = require('../typeOfEmployee');
const { updateProfile, updateLogin } = require('./employeeDto');

const typeOfEmployeeService = new TypeOfEmployeeService();

class EmployeeService {
  constructor() {}

  async emailExist(email = '') {
    const ifExist = await Employee.findOne({
      where: {
        email,
      },
    });
    if (ifExist) {
      throw boom.conflict('employee email already exist');
    }
  }

  async findAll(limit = null, offset = null, filter = '') {
    if (limit === null || offset === null) {
      const employees = await Employee.findAll({
        attributes: [
          'id',
          'name',
          'lastName',
          'cellPhone',
          'email',
          'typeOfEmployeeId',
          'createdAt',
        ],
        order: [['id', 'ASC']],
        where: {
          deleted: false,
          [Op.or]: {
            name: {
              [Op.like]: '%' + filter + '%',
            },
            lastName: {
              [Op.like]: '%' + filter + '%',
            },
          },
        },
        limit: 25,
      });
      return employees;
    }
    const employees = await Employee.findAndCountAll({
      order: [['id', 'ASC']],
      where: {
        name: {
          [Op.like]: '%' + filter + '%',
        },
      },
      limit,
      offset,
      include: [
        {
          model: TypeOfEmployee,
          attributes: ['id', 'name'],
        },
      ],
    });
    return employees;
  }

  async findById(id, deleted = false) {
    const employee = await Employee.findOne({
      attributes: [
        'id',
        'name',
        'lastName',
        'cellPhone',
        'email',
        'recoveryToken',
        'createdAt',
      ],
      where: {
        id: id,
        deleted: deleted,
      },
      include: [
        {
          model: TypeOfEmployee,
          attributes: ['id', 'name'],
        },
      ],
    });
    if (!employee) {
      throw boom.notFound('employee not found');
    }
    return employee;
  }

  async findByEmail(email) {
    const employee = await Employee.findOne({
      attributes: ['id', 'name', 'lastName', 'cellPhone', 'email', 'password'],
      where: {
        email,
        deleted: false,
      },
      include: [
        {
          model: TypeOfEmployee,
          attributes: ['id', 'name'],
        },
      ],
    });
    return employee;
  }

  async create(data) {
    await this.emailExist(data.email);
    const typeOfEmployee = await typeOfEmployeeService.findById(
      data.typeOfEmployeeId
    );
    const salt = bcrypt.genSaltSync(10);
    data.password = bcrypt.hashSync(data.password, salt);
    const employee = await Employee.create(data);
    delete employee.dataValues.password;
    delete employee.dataValues.deleted;
    return employee;
  }

  async update(id, update, data) {
    const employee = await this.findById(id);
    switch (update) {
      case 'profile':
        const { error } = await updateProfile.validate(data, {
          abortEarly: false,
        });
        if (error) {
          throw boom.badRequest(error);
        }
        await employee.update(data);
        break;
      case 'acces':
        const { error: err } = await updateLogin.validate(data, {
          abortEarly: false,
        });
        if (err) {
          throw boom.badRequest(err);
        }
        if (employee.email != data.email) {
          await this.emailExist(data.email);
        }
        const salt = bcrypt.genSaltSync(10);
        data.password = bcrypt.hashSync(data.password, salt);
        await employee.update(data);
        break;
      case 'recovery':
        await employee.update(data);
        break;
      default:
        throw boom.badRequest('Bad Request');
    }
    delete employee.dataValues.password;
    delete employee.dataValues.typeOfEmployeeId;
    delete employee.dataValues.deleted;
    return employee;
  }

  async updatePassword(id, password) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    await this.update(id, 'recovery', {
      password: hash,
      recoveryToken: null,
    });
    return { message: 'password updated' };
  }

  async disableEmployee(id) {
    const employee = await this.findById(id);
    await employee.update({
      deleted: true,
    });
  }

  async enableEmployee(id) {
    const employee = await this.findById(id, true);
    await employee.update({
      deleted: false,
    });
  }
}

module.exports = EmployeeService;
