//@ts-check
const Joi = require("@hapi/joi");
const db = require("./db");

class Component {
  /**
   * Create a new component
   * @param {string} name The name of the component.
   * @param {{data?: Object<string,any>, install?: (entity: Entity) => void, update?: (entity: Entity) => void}} options
   * Additional parameters that can be passed on object instantation.
   */
  constructor(name, options = {}) {
    this._name = name;
    const { data, install, update } = options;
    this._data = data;
    this._install = install;
    this._update = update;
  }

  /**
   * Set the update function.
   * @param {(entity:Entity) => any} update Callback function to be fired
   * on an entity when it's connected component data is updated.
   */
  update(update) {
    this._update = update;
    return this;
  }

  /**
   *
   * @param {(entity:Entity) => any} install
   */
  install(install) {
    this._install = install;
  }
}

class Components {
  constructor() {
    this._components = new Map();
  }

  /**
   * @typedef OptionType
   * @property {(enitity: Entity) => any} install function to call
   * on an entity when it installs this component.
   * @property {(enitity: Entity) => any} update Function to call
   * when an entities component data is updated.
   *
   */
  /**
   * Create a new component.
   * @param {string} name The name of the component.
   * @param {OptionType} options The settings for the component.
   *
   * @example
   * ecs.components.create("testComponent", {
   *    data: {
   *        foo: Joi.string().default("bar"),
   *        someCode: Joi.number().default("baz")
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
    const component = new Component(name, options);
    this._components.set(name, component);
    return component;
  }

  /**
   * Delete a Component
   * @param {string} name The name of the component to remove.
   */
  delete(name) {
    this._components.delete(name);
  }

  /**
   * Add a component to an entity.
   * @param {string} key The text key of the entity.
   * @param {string} component Name of the component to add
   */
  async add(key, component) {
    // Get the component
    const entity = await db.colls.entities
      .get(key)
      .catch(err => console.error(err));
    const comp = this._components.get(component);
    if (comp) {
      if (comp._data) {
        const schema = Joi.object(comp._data);
        const data = schema.validate({});
        entity.data[comp._name] = data.value;
        return await db.colls.entities.update(entity._key, entity);
      }
    }
  }

  /**
   * Remove a component from an entity.
   * @param {string} key The key for the entity to remove the
   * component from.
   * @param {string} component The name of the component to remove.
   */
  async remove(key, component) {
    const entity = await db.colls.entities
      .get(key)
      .catch(err => console.error(err));

    delete entity.data[component];
    return await db.colls.entities.update(entity._key, entity);
  }

  /**
   * Retrive a component.
   * @param {string} component The name of the component to retrieve.
   */
  get(component) {
    return this._components.get(component);
  }
}

class Entity {
  /**
   * Create a new entity.
   * @param {string} name The name of the entity to create.
   * @param {string} type The type of entity to make.
   */
  async create(name, type = "thing") {
    return await db.colls.entities.save({ name, type, data: {} });
  }

  /**
   * Get an entity document
   * @param {string} ref Either the name or key of an entity.
   */
  async get(ref) {
    let char = await db.colls.entities.get(ref);

    // char isn't an entity document.  query for name or alias
    if (!char) {
      return (await db.query(`
        FOR obj IN entities
          FILTER LOWER(obj.name) == "${ref.toLowerCase()}" ||
            LOWER(obj.data.alias) == "${ref.toLowerCase()}"
          RETURN obj
      `)).all();
    }

    // if Char is populated return it.
    return char;
  }
}

class Systems {
  /**
   * Instantiate component systems.
   * @param {Components} components An array of defined components.
   */
  constructor(components) {
    this._components = components;
    this._systems = new Map();
    this._filters = new Map();
  }

  /**
   * Create a new system
   * @param {string} component The name of the component the
   * system is designed for.  A component can only have one system.
   * @param {(entity: Entity) => void} system A callback function invoked when the system
   * is triggered.
   */
  create(component, system) {
    if (components._components[component]) {
      this._systems.set(component, system);
    } else {
      throw new Error("Component not found.");
    }
  }

  /**
   * Create a filter for a system.
   * @param {string} component The name of the component the filter
   * is written for.  There can only be one filter per component.
   * @param {(entities: Entity[]) => any} filter Callback function
   * tested against each document from the database.
   * @example
   * ecs.systems.filter(
   *  "testSyatem", entry => entry.type === "player"
   * );
   */
  filter(component, filter) {
    this._filters.set(component, filter);
  }

  /**
   * Trigger a system.
   * @param {string} component The name of the component to
   * trigger.
   */
  async trigger(component) {
    const entities = (await db.colls.entities).all();
    const filter = this._filters.get(component);

    entities
      .filter(filter || Boolean)
      .forEach(
        /** @param {Entity} entity */ entity =>
          this._systems.get(component)(entity)
      );
  }
}

const components = new Components();
const entity = new Entity();
const systems = new Systems(components);

module.exports = {
  components,
  entity,
  systems
};
