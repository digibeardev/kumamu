//@ts-check
const { Collection } = require("../classes/collection");
const Joi = require("@hapi/joi");
class Entities extends Collection {
  constructor(name) {
    super(name);
  }

  async onLoad() {
    this.schema({
      _key: Joi.string(),
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
   * @param {string} options._key The optional key to be assigned to the entity.
   */
  async create(options) {
    const { name, type, _key } = options;
    return await this.save({ name, type, _key });
  }

  /**
   * Get an entity document
   * @param {string} ref Either the name or key of an entity.
   */
  async find(ref) {
    let char = await this.get(ref).catch(() => {
      // char isn't an entity document.  query for name or alias
      return this.all(entity => {
        if (entity.name.toLowerCase() === ref.toLowerCase()) {
          return entity;
        } else if (entity.data.player) {
          if (entity.data.player.alias.toLowerCase() === ref.toLowerCase()) {
            return entity;
          }
        }
      });
    });

    // if Char is populated return it.
    return char;
  }
}

module.exports = new Entities("entities");