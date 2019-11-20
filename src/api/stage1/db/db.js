//@ts-check
const { Database, DocumentCollection } = require("arangojs");

/**
 * new DatabaseClass()
 */
module.exports = mu => {
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
      this.db.useBasicAuth(
        mu.config.database.user,
        mu.config.database.password
      );
      const dbs = await this.db.listDatabases();

      // Check to see if the database is created or not.
      if (dbs.indexOf(mu.config.database.name) !== -1) {
        this.db.useDatabase(mu.config.database.name);

        // Created, use the database
        await this.db.get().catch(error => console.error(error));
      } else {
        // New database, create it.
        await this.db
          .createDatabase(mu.config.database.name || "netdb")
          .catch(error => console.error(error));
        this.db.useDatabase(mu.config.database.name || "netdb");
        console.log(`Database ${mu.config.database.name} selected.`);
      }

      return this;
    }
  }

  return new DatabaseClass();
};
