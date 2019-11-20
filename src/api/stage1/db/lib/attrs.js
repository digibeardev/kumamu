// @ts-check
const entities = require("../entities");

class Attributes {
  init() {}

  /**
   * Set an attribute on an entity.
   * @param {Object} options The options to be set.
   * @param {Object} options.target The entity object to set the attribute on
   * @param {string} options.name Tha name of the attribute.
   * @param {string | Object<string,any>} options.value The string value of the attribute.
   * @param {string} options.setBy The _key of the enactor.
   */
  async set(options) {
    const { target, name, value, setBy } = options;
    // check to see if the attribute already exists!
    // If it does, update, remove the original and re-insert the
    // updated record.

    // try to find the attribute name in the object
    let found = false;
    if (target.data.base.attributes) {
      for (const attr of target.attributes) {
        if (attr.name === name.toLowerCase()) {
          found = attr;
        }
      }
    }

    const index = target.attributes.indexOf(found);

    // Attribute exists, and value given.
    if (found && value) {
      target.attributes[index]["value"] = value;
      entities.update(target._key, target);
      return await entities.get(target._key);

      // if the attribut eexists but there's no value, remove
      // the attribute.
    } else if (found && !value) {
      target.attributes.splice(index, 1);
      await entities.update(target._key, target);
      return await entities.get(target._key);
    } else if (!found && !value) {
      // No change nessisary, just send back the database object.
      return await entities.get(target._key);
    } else {
      // Else if the attribute doesn't exist, set it's initial
      // value.
      target.attributes.push({ name, value, setBy });
      await entities.update(target._key, target);
      return await entities.get(target._key);
    }
  }

  has(tar, name) {
    for (const attr of tar.attributes) {
      if (attr.name.toLowerCase() === name.toLowerCase()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get the current value for an attribute
   * @param {Object} target The object we want to read an attribute from
   * @param {String} attribute The attribute to be read.
   */
  get(target, attribute) {
    if (target.attributes) {
      for (const attr of target.attributes) {
        if (attr.name.toLowerCase() === attribute.toLowerCase()) {
          return attr.value;
        }
      }
    } else {
      return false;
    }
  }
}

module.exports = new Attributes();
