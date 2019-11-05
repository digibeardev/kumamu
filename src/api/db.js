//@ts-check
const { Database, DocumentCollection } = require("arangojs");
const config = require("./config");
/**
 * new DatabaseClass()
 */
class DatabaseClass {
  /**
   * Perform a raw database query using Arango's AQL language.
   * @param {string} aql The AQL query to perform
   */
  query(aql) {
    return this.db.query(aql);
  }

  /** @type {(name: string) => DocumentCollection } */
  /**
   *
   * @param { string } name The name of the colleciton to retrieve.
   */
  collection(name) {
    return this.db.collection(name);
  }

  /**
   * Wrapper for Arango listCollections.
   */
  listCollections() {
    return this.db.listCollections();
  }

  /**
   * Initialize the database.
   */
  async init() {
    this.db = new Database();
    this.db.useBasicAuth(config.database.user, config.database.password);
    const dbs = await this.db.listDatabases();

    // Check to see if the database is created or not.
    if (dbs.indexOf(config.database.name) !== -1) {
      this.db.useDatabase(config.database.name);

      // Created, use the database
      await this.db.get().catch(error => console.error(error));
      console.log(`Database ${config.database.name} initialized.`);
    } else {
      // New database, create it.
      await this.db
        .createDatabase(config.database.name)
        .catch(error => console.error(error));
      this.db.useDatabase(config.database.name);
      console.log(`Database ${config.database.name} selected.`);
    }

    return this;
  }
}

module.exports = new DatabaseClass();
