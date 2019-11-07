const Joi = require("@hapi/joi");
const moment = require("moment");
const config = require("../api/config");

module.exports = async mu => {
  // Base component.  All entities have access to this data.
  await mu.components.create({
    name: "base",
    description: "The base component for all objects.",
    schema: {
      contents: Joi.array().default([]),
      exits: Joi.array().default([]),
      attributes: Joi.array().default([]),
      owner: Joi.string().default("0"),
      created: Joi.number().default(moment().unix()),
      modified: Joi.number().default(moment().unix()),
      flags: Joi.array().default([]),
      location: Joi.array().default(config.game.startRoom || "0")
    }
  });

  // The entity is a player chatacter.
  await mu.components.create({
    name: "player",
    description: "The component that deals with player specific data.",
    schema: {
      alias: Joi.string().default(""),
      moniker: Joi.string().default(""),
      password: Joi.string().default("")
    }
  });
};
