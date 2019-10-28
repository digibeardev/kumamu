//@ts-check
const db = require("../api/db");

module.exports.Collection = class Collection {
  /**
   * new Collection()
   * @param {string} name The name of the collection to pull
   * from or create within the database.
   */
  constructor(name) {
    this._name = name;
    this._collection = db.collection(name);
  }

  /**
   * Initiate the collection
   */
  async init() {
    // Check to see if stats is in the collections list.
    // If not, create it.
    let collections = await db
      .listCollections()
      .catch(error => console.error(error));

    collections = collections.filter(entry =>
      entry.name === this._name ? true : false
    );

    if (collections.length <= 0) {
      await this._collection.create().catch(async () => {
        await this._collection.get().catch(error => console.error(error));
        await this.onLoad();
      });
    } else {
      if (typeof this.onLoad === "function") {
        await this.onLoad();
      }
    }
  }

  /**
   * A lifecycle hook for when a collection is loaded.
   */
  async onLoad() {}

  async save(obj) {
    return this._collection.save(obj);
  }

  /**
   * Retrieve a document by it's key.
   * @param {string} key The string key of the document to retrieve
   */
  async get(key) {
    return await this._collection.firstExample({ _key: key });
  }

  /**
   * Update a pre-existing document in the collection.
   * @param {string} key  The record to update
   * @param {Object<string,any>} update The object literal update to make to the record.
   */
  async update(key, update) {
    return this._collection.update(key, update);
  }

  /**
   * Remove a document from the collection.
   * @param {string} key The key of the document to remove.
   */
  async delete(key) {
    return this._collection.remove(key);
  }
};
