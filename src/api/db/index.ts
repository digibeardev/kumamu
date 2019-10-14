import { readdirSync } from "fs";
import { resolve } from "path";
import { Database } from "arangojs";
import config from "../config";

class DatabaseClass {
  private db: Database;
  cols: { [key: string]: any };

  constructor() {
    this.db = new Database();
    this.cols = {};
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

    // Check for collection files.
    const dir = readdirSync(resolve(__dirname, "./lib/"));
    for (const file of dir) {
      const name = file.split(".")[0].toLowerCase();
      this.cols[name] = await import(`./lib/${file}`);
      console.log(`Collection loaded: ${name}.`);
    }
  }
}

export default new DatabaseClass();
