//@ts-check
const db = require("../api/db/db");
const Ajv = require("ajv");

module.exports.Collection = class Collection {
  /**
   * new Collection()
   * @param {string} name The name of the collection to pull
   * from or create within the database.
   */
  constructor(name) {
    this._name = name;
    this._collection = db.collection(name);
    this._db = db;
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

    await this._collection.create().catch(async () => {
      await this._collection.get().catch(error => console.error(error));
      await this.onLoad();
    });
    await this._collection.get().catch(error => console.error(error));
    await this.onLoad();
  }

  /**
   * A lifecycle hook for when a collection is loaded.
   */
  async onLoad() {}

  /**
   * Select all or a filtered list of documents from the collection.
   * @param {(entity) => any} [filter] Apply a filter callback to the
   * documents called with the all query.
   * @example
   * const els = collName.all(doc => doc.key === value);
   */
  async all(filter = Boolean) {
    // query the database.
    const query = await db.query(`
      FOR obj IN ${this._name}
      RETURN obj 
    `);

    // Apply the filter
    let results = await query.all();
    return results.filter(filter);
  }

  /**
   * Define a schema data to be entered into the document.
   * @param {Object<string,any>} obj The JSON validation schema object to be
   * matched against
   * @example
   * schema({
   *    foo: {
   *      type: "string",
   *      required: true,
   *      default: "bar"
   *    }
   * })
   *
   */
  schema(obj) {
    const ajv = new Ajv({ useDefaults: true });
    const schema = { type: "object" };
    schema.required = obj.required ? obj.required : [];
    delete obj.required;
    schema.properties = obj;

    ajv.compile(schema);
    this._schema = schema;
    this._validator = ajv.compile(schema);
    return this;
  }

  /**
   * Save a document to a collection.  If there's a schema defined
   * then apply it against the document definition.
   * @param {Object<string,any>} obj The object to save as a document.
   */
  async save(obj) {
    return this._schema
      ? this._validator(obj)
        ? await this._collection.save(obj)
        : this._validator.errors[0]
      : await this._collection.save(obj);
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
    return await this._collection.update(key, update);
  }

  /**
   * Remove a document from the collection.
   * @param {string} key The key of the document to remove.
   */
  async remove(key) {
    return this._collection.remove(key);
  }
};
