//@ts-check
const Joi = require("@hapi/joi");
const { Collection } = require("../classes/collection");
const entities = require("./entities");

class Components extends Collection {
  constructor(name) {
    super(name);
    this._components = new Map();
  }

  /**
   * Create a new component
   * @param {Object} options The name of the component.
   * @param {string} options.name The name of the component.
   * @param {string} options.description A description of the component.
   * @param {Object} options.schema Define the shape of the data to be checked
   * against when adding a component, or updating it's data.
   *
   * @example
   * mu.components.create({
   *    name: position,
   *    schema: {
   *      x: Joi.number().default(0),
   *      y: Joi.number().default(0)
   *    }
   * })
   *
   */
  async create(options) {
    const { name, schema, description = "" } = options;
    const comps = await this.all(comp => comp.name === name);

    // We only want to save the component if there isn't already one that uses
    // it's name.  Names are case sensitive.
    if (comps.length <= 0) {
      await this.save({ schema, name, description });
      this._components.set(name, { schema, name, description });
    } else {
      this._components.set(name, { schema, name, description });
    }
  }

  /**
   * Remove a component reference.
   * @param {string} name The name of the component to be removed. Case sensitive.
   */
  async delete(name) {
    const comps = await this.all(comp => comp.name === name);

    // If a component was found, remove it's referenes from the global scope.
    if (comps.length > 0) {
      this._components.delete(name);
      const compKey = comps[0]._key;
      await this.remove(compKey);
    }
  }

  /**
   * Set a component on a target entity.
   * @param {*} target The entity to set the components on
   * @param {string | string[]} components Either a single component, or a
   * list of components to set on the target entity.
   */
  async set(target, components) {
    // Helper function to set a single component on target.
    const add = async (target, component) => {
      const comp = this._components.get(component);
      if (comp) {
        const schema = Joi.object(comp.schema);
        const data = schema.validate({});
        target.data[component] = data.value;
        await entities.update(target._key, target);
      }
    };

    if (Array.isArray(components)) {
      for (const component of components) {
        await add(target, component);
      }
    } else {
      await add(target, components);
    }
    return target;
  }

  /**
   * Clear components from the target entity.
   * @param {*} target The entity to remove component data from.
   * @param {string | string []} components A single component, or an array
   * of components to be removed from the target entity.
   */
  async clear(target, components) {
    if (Array.isArray(components)) {
      for (const component of components) {
        delete target[component];
      }
    } else {
      delete target[components];
    }

    this.update(target._key, target);
  }
}

module.exports = new Components("components");
