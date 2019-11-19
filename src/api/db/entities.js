//@ts-check
const { Collection } = require("../../classes/collection");
const moment = require("moment");
const config = require("../config");

class Entities extends Collection {
  constructor(name) {
    super(name);
    this.index = [];
  }

  async onLoad() {
    // init the Index
    this.index = (await this.all(entry => entry._key))
      .map(entity => parseInt(entity._key))
      .sort();

    // Define the schema for an entity
    const startRoom = config.game.startRoom || "0";
    this.schema({
      required: ["name"],
      _key: { type: "string" },
      name: { type: "string" },
      type: { type: "string", default: "thing" },
      location: { type: "string", default: startRoom },
      alias: { type: "string", default: "" },
      moniker: { type: "string", default: "" },
      password: { type: "string", default: "" },
      contents: { type: "array", default: [] },
      attributes: { type: "array", default: [] },
      exits: { type: "array", default: [] },
      flags: { type: "array", default: [] },
      owner: { type: "string", default: "0" },
      created: { type: "number", default: moment().unix() },
      modified: { type: "number", default: moment().unix() }
    });
  }

  newKey() {
    // First, check for any gaps in the database. If there's an open
    // number lower than the next increment use that instead.
    const index = this.index.sort();

    let mia = index.reduce(function(acc, cur, ind, arr) {
      let diff = cur - arr[ind - 1];
      if (diff > 1) {
        let i = 1;
        while (i < diff) {
          acc.push(arr[ind - 1] + i);
          i++;
        }
      }
      return acc;
    }, []);

    // If we get a return from missing numbers, add the first
    // to the index, and return it.
    if (mia.length > 0) {
      this.index.push(mia[0]);
      return mia[0];

      // Else we just find the next ID number and inc by one.
    } else {
      this.index.push(this.index.length);
      return (this.index.length - 1).toString();
    }
  }

  /**
   * Create a new entity.
   * @param {Object} options
   * @param {string} options.name The name of the entity to create.
   * @param {string} options.type The type of entity to make.
   * @param {string} options._key The optional key to be assigned to the entity.
   */
  async create(options) {
    let { name, type, _key } = options;
    _key = _key ? _key : this.newKey();
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
