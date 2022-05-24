const Joi = require('joi');

const id = Joi.number().integer().positive().max(32767);
const name = Joi.string().alphanum().min(2).max(50);
const description = Joi.string().max(255);

const limit = Joi.number().integer().min(2);
const offset = Joi.number().integer().min(0);
const filter = Joi.string().min(0).max(25);

const createSchema = Joi.object({
  name: name.required(),
  description: description.required(),
});

const updateSchema = Joi.object({
  name: name.required(),
  description: description.required(),
});

const getByIdSchema = Joi.object({
  id: id.required(),
});

const querySchema = Joi.object({
  limit,
  offset,
  filter,
});

module.exports = {
  createSchema,
  updateSchema,
  getByIdSchema,
  querySchema,
};
