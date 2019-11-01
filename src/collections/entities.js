//@ts-check
const { Collection } = require("../classes/collection");
const Joi = require("@hapi/joi");
class Entities extends Collection {
  constructor(name) {
    super(name);
  }

  async onLoad() {
    this.schema({
      name: Joi.string().required(),
      type: Joi.string().default("thing"),
      data: Joi.object().default({})
    });
  }

  /**
   * Create a new entity.
   * @param {Object} options
   * @param {string} options.name The name of the entity to create.
   * @param {string} options.type The type of entity to make.
   */
  async create(options) {
    const { name, type } = options;
    return await this.save({ name, type });
  }

  /**
   * Get an entity document
   * @param {string} ref Either the name or key of an entity.
   */
  async find(ref) {
    let char = await this.get(ref);

    // char isn't an entity document.  query for name or alias
    if (!char) {
      return (await this._db.query(`
        FOR obj IN entities
          FILTER LOWER(obj.name) == "${ref.toLowerCase()}" ||
            LOWER(obj.data.player.alias) == "${ref.toLowerCase()}"
          RETURN obj
      `)).all();
    }

    // if Char is populated return it.
    return char;
  }
}

module.exports = new Entities("entities");
