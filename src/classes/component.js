const Joi = require("@hapi/joi");

module.exports = class Components {
  constructor() {
    this._components = new Map();
  }

  /**
   * @typedef {Object<string,any>} Component
   * @property {Object<string,any>} data shaping and validatation
   * data for component data.
   * @property {(entity: Entity) => void} install When this component
   * is instantiated on an entity.  This code fires after any component
   * data is added to the entity.
   */

  /**
   * @typedef {Object<string, any>} Entity
   * @property {string} _key
   * @property {Component[]} components
   */

  /**
   * Create a new component.
   * @param {string} name The name of the component.
   * @param {Component} options The settings for the component.
   *
   * @example
   * ecs.components.create("testComponent", {
   *    data: {
   *        foo: Joi.string().default("bar"),
   *        someCode: Joi.number().required()
   *    },
   *    install: entity => {
   *        console.log(`Component Set! on ${entity}.`)
   *    },
   *    update: entity => {
   *        console.log(`Component updated! on ${entity}.`)
   *    }
   * })
   */
  create(name, options) {
    this._components.set(name, options);
  }

  /**
   * Delete a Component
   * @param {string} name The name of the component to remove.
   */
  delete(name) {
    this._components.delete(name);
  }

  /**
   *
   * @param {Entity} entity
   * @param {Component[]} components
   */
  add(entity, components) {
    for (const component of components) {
      // Get the component
      const comp = this._components.get(component);
      if (comp.data) {
        const schema = Joi.object(comp.data);
        const data = schema.validate({});
      }
    }
  }
};
