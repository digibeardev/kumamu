import { Database } from "arangojs";
import config from "../config";

export class DatabaseClass {
  private db: Database;

  constructor() {
    this.db = new Database();
  }

  public async query(aql: string) {
    return await this.db.query(aql);
  }

  public collection(name: string) {
    return this.db.collection(name);
  }

  public listCollections() {
    return this.db.listCollections();
  }

  /**
   * Initialize the database.
   */
  async init() {
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
      console.log(`Database ${config.database.name} selected.`);
    }

    return this;
  }
}

export default new DatabaseClass();
