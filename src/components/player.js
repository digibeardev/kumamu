const Joi = require("@hapi/joi");

module.exports = mu => {
  mu.ecs.components.create("login", {
    data: {
      alias: Joi.string().default(""),
      password: Joi.string().default("")
    }
  });

  mu.ecs.components.create("contents", {
    data: {
      value: Joi.array().default([])
    }
  });
};
