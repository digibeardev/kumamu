const Joi = require("@hapi/joi");
const moment = require("moment");

module.exports = mu => {
  // Base component.  All entities have access to this data.
  mu.ecs.components.create("base", {
    data: {
      contents: Joi.array().default([]),
      attributes: Joi.array().default([]),
      owner: Joi.string().default(""),
      created: Joi.number().default(moment().unix()),
      modified: Joi.number().default(moment().unix()),
      flags: Joi.array().default([])
    }
  });

  // The entity is a player chatacter.
  mu.ecs.components.create("player", {
    data: {
      alias: Joi.string().default(""),
      moniker: Joi.string().default(""),
      password: Joi.string().default(""),
      last: Joi.number().default(moment().unix())
    }
  });

  // The entity is a 'room'.
  mu.ecs.components.create("room", {
    data: {
      exits: Joi.array().default([])
    }
  });
};
