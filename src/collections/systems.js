//@ts-check
const Joi = require("@hapi/joi");

const { Collection } = require("../classes/collection");
const entities = require("./entities");

class Systems extends Collection {
  constructor(name) {
    super(name);
    this._systems = new Map();
  }

  async onLoad() {
    this.schema({
      name: Joi.string().required(),
      system: Joi.string().required()
    });
  }

  /**
   * Create a new system
   * @param {Object} options The initial settings for the system to be globally
   * added.
   * @param {string} options.name The name of the system.
   * @param {(entities) => void} options.system A callback function invoked when
   * the system is triggered. It's passed a param,  `entities` that holds an array
   * of the defined game entities.
   */
  create(options) {
    const { name, system } = options;
    // Save a representation of the system to the db for reference outside of the
    // game server use case as well as store a working copy in the `_systems` Map().
    this._systems.set(name, system);
    this.save({ name, system: system.toString() });
  }

  /**
   * Remove a system reference.
   * @param {string} name The name of the system to be removed. Case sensitive.
   */
  async delete(name) {
    const sys = await this.all(sys => sys.name === name);

    // If a system was found, remove it's referenes from the global scope.
    if (sys.length > 0) {
      this._systems.delete(name);
      const sysKey = sys[0]._key;
      await this.remove(sysKey);
    }
  }

  /**
   * Trigger a system.
   * @param {string} name The name of the component to
   * trigger.
   */
  async trigger(name) {
    await this._systems.get(name.toLowerCase())(await entities.all());
  }
}

module.exports = new Systems("systems");
