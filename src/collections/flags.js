//@ts-check

const { Collection } = require("../classes/collection");
const entities = require("./entities");
const Joi = require("@hapi/joi");

class Flags extends Collection {
  /**
   * Create a new collection.
   * @param {string} name The name of the collection.
   */
  constructor(name) {
    super(name);
    this._flags = new Map();
  }

  async onLoad() {
    this.schema({
      name: Joi.string().required(),
      restricted: Joi.string().default(""),
      level: Joi.number().default(0),
      code: Joi.string().default("")
    });

    // @ts-ignore
    await this.create(require("../../data/flags.json"));
  }

  /**
   * @typedef flagDef
   * @property {string} name The name of the flag.
   * @property {string} code The short code for the flag.
   * @property {string} restricted A space delimted list of flags
   * that are allowed to set this flag in-game.
   * @property {number} level The access level of the code, ranked
   * 1 to 100, 100 being the maximum level of access (normally saved
   * for immortal.).
   */

  /**
   * Enter new flags into the database.
   * @param {flagDef[]} flags An array of flag objects.
   */
  async create(flags = []) {
    // Create a validation object.

    for (const flag of flags) {
      // Query the database for the flag name and return an
      // array of matches.
      const query = await this.all(flg => flg.name === flag.name);

      // If the flag isn't represented in the db, save a copy.
      if (query.length <= 0) {
        await this.save(flag).catch(err => console.error(err));
      } else {
        // If it's present, validate the data and update the
        // _flags list.
        try {
          const data = this._schema.validate(flag);
          this._flags.set(flag.name.toLowerCase(), data.value);
        } catch (error) {
          console.error(error.stack);
        }
      }
    }
  }

  /**
   * Get a flag object.
   * @param {string} name The name of the flag to retrive.
   */
  get(name) {
    return this._flags.get(name.toLowerCase());
  }

  /**
   * Scrub through a space seperated list of flags removing
   * any entries that are not in the flag database.
   * @param {string} flags The function can take a single
   * flag or a list of space seperated flags.
   */
  cleanFlags(flags) {
    let returnFlags, not;
    // First we need to split the flag string into an array
    returnFlags = flags
      .split(" ")
      .filter(flag => {
        // check to see if there's a NOT before the flag
        if (flag[0] === "!") {
          not = "!";
          flag = flag.slice(1);
        }

        // If the flag exists add it to the list.
        if (this._flags.has(flag)) {
          return not + flag;
        }
      })
      .join(" ");

    return returnFlags;
  }

  /**
   * Set and remove flags from a database tracked object.
   * @param  {*} target The database object we're setting the flags on
   * @param {string} flags A space seperated string of flags.  To remove
   * a flag from an object, use the NOT (!) indicator in front of the flag.
   */
  async set(target, flags) {
    // First, let's make a Set object to hold our working data.  You can't
    // have repeating values - so it'll filter any repeats for us.
    const flagSet = new Set(target.data.base.flags);

    flags.split(" ").forEach(flag => {
      //Check for flag removals
      if (flag[0] === "!") {
        // Remove the bang '!' from the flag and delete the record from the
        // set if it exits.
        flag = flag.slice(1);
        flagSet.delete(flag);
      } else {
        // Else we're adding an item to the set.
        flagSet.add(flag);
      }
    });

    try {
      target.data.base.flags = [...flagSet];
      const updated = await entities.update(target._key, target);
      if (updated) {
        return updated;
      } else {
        return false;
      }
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Check to see if an object has all of the flags listed.
   * if one fails, the entire stack fails. Optional modfiers
   * are available.
   * '!flag' checks to see if the target does NOT have a flag.
   * @param {*} obj The database object representing the
   * the thing being checked for flags
   * @param {string} flags A string of space seperated flags
   * to check against.
   */
  hasFlags(obj, flags = " ") {
    // Split the flag param into an array of flags for
    // faster processing.  Check the target object for
    // the presence of the flags.
    const flagArray = flags.split(" ").filter(Boolean);
    const results = [];

    for (let flag of flagArray) {
      // If there's a not(!) in front of a flag, check
      // to make sure it's NOT on the object.
      if (flag[0] === "!") {
        flag = flag.slice(1);
        // If the flag is in the object's array,
        // fail.
        if (obj.data.base.flags.indexOf(flag) === -1) {
          results.push(true);
        } else {
          results.push(false);
        }
        // A normal search, Found it!
      } else if (obj.data.base.flags.indexOf(flag) !== -1) {
        results.push(true);
        // ... Or not.
      } else if (/^.+\|.+/g.exec(flag)) {
        results.push(this.orFlags(obj, flag.split("|").join(" ")));
      } else {
        results.push(false);
      }
    }

    // Now we test to see if there were any negative
    // results in the array means missing flags.
    if (results.indexOf(false) === -1) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Checks to see if enactor has at least one of the given flags.
   * @param {*} target
   * @param {string} flags
   */
  orFlags(target, flags = "") {
    let ret = false;
    const flagsArray = flags.toLowerCase().split(" ");

    for (const flag of flagsArray) {
      if (this.hasFlags(target, flag)) {
        ret = true;
      }
    }

    return ret;
  }

  /**
   * Can enactor edit target?
   * @param  {*} enactor The Entity object of the enactor,
   * @param  {*} target  The Entity object of the target.
   */
  async canEdit(enactor, target) {
    const enactorLvl = this.flagLvl(enactor);
    const targetLvl = this.flagLvl(target);
    if (
      enactor._key === target._key ||
      target.owner === enactor._key ||
      enactorLvl >= targetLvl
    ) {
      return true;
    } else {
      return false;
    }
  }

  /**
   *
   * @param {*} target The entity object to retrieve a flag
   * level for.
   */
  async flagLvl(target) {
    let lvl = 0;
    for (const flag of target.data.base.flags) {
      const flgLvl = this._flags.get(flag).level;
      // if it's lower than the previous result, replace it
      if (flgLvl > lvl) {
        lvl = flgLvl;
      }
    }

    return lvl;
  }

  /**
   * Retrieve a list of short-codes for flags set on an entity.
   * @param {*} target The entity object to retreive flag codes
   * for.
   */
  async flagCodes(target) {
    if (target) {
      let output = `%(#${target._key}${target.type[0].toUpperCase()}`;
      for (const flag of target.data.base.flags) {
        try {
          let flg;
          if (this._flags.has(flag)) {
            flg = this._flags.get(flag);
            output += flg.code;
          } else {
            break;
          }
        } catch (error) {
          console.error(error);
        }
      }
      return output + "%)";
    }
  }
}

module.exports = new Flags("flags");
