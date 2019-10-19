import { Collection } from "../classes/collection";
import { IDbObj } from "./db/lib/objs";
import mu from "../classes/engine";
import db from "../classes/engine";
import * as fs from "fs";
import { flags } from "../classes/defaults";

export interface IFlag {
  name: string;
  restricted?: string;
  code?: string;
  lvl?: number;
}

export class Flags extends Collection {
  private flagList: IFlag[];

  constructor(name: string) {
    super(name);
    this.flagList = flags;
  }

  /**
   * This blob of code basically tries to pull the config file,
   * but if it comes up empty create a new Map object.
   */
  async onLoad() {
    (async () => {
      try {
        let countCursor = await db.query(`RETURN LENGTH(flags)`);
        let count = await countCursor.next();

        if (count) {
          console.log("Game flags loaded.");

          // Load extra flags defined in the json file
          const dirent = fs.existsSync("../../Data/flags.json");
          if (dirent) {
            const extras = require("../../Data/flags.json");
            this.dbCheck(extras);
          }
        } else {
          console.log("No Flags database found.  Creating new instance.");
          this.dbCheck(this.flagList);

          const extras = JSON.parse(
            fs.readFileSync("../data/flags.json", "uft-8")
          );
          if (extras) {
            this.dbCheck(extras);
          }
        }
      } catch (error) {
        console.log(error);
      }
    })().catch(error => {
      // default flags list:
      console.log("No Flags database found.  Creating new instance.");
      this.dbCheck(this.flagList);

      const dirent = fs.existsSync("../../Data/flags.json");
      if (dirent) {
        const extras = require("../../Data/flags.json");
        this.dbCheck(extras);
      }
    });
  }

  async dbCheck(flags: IFlag[]) {
    try {
      // Lop through the list of flag objects
      for (const flag of flags) {
        let flagCursor = await db.query(`
          FOR flag IN flags
            FILTER flag.name == "${flag.name.toLowerCase()}"
            RETURN flag
        `);

        const data = flagCursor.hasNext();
        if (!data) {
          flag.lvl = flag.lvl || 0;
          flag.code = flag.code || "";
          flag.restricted = flag.restricted || "";
          let flg = await this.save(flag);
          if (flg) {
            console.log(`Flag added to the database: ${flag.name}`);
          }
        }
      }
    } catch (error) {
      console.log("No user defined flags found.");
    }
  }

  /**
   * cleanFlags()
   * Scrub through a space seperated list of flags removing
   * any entries that are not in the flag database.
   * @param flags The function can take a single
   * flag or a list of space seperated flags.
   */
  cleanFlags(flags: string) {
    let returnFlags: string, not: string;
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
        if (this.exists(flag)) {
          return not + flag;
        }
      })
      .join(" ");

    return returnFlags;
  }

  /**
   * Checks if a flag exists or not.
   * @param flag A single flag.
   */
  async exists(flag: string) {
    if (flag[0] === "!") {
      flag = flag.slice(1);
    }
    const flagCursor = await db.query(`
      FOR f IN flags
        FILTER LOWER(f.name) == "${flag.toLowerCase()}"
        RETURN f
    `);

    if (flagCursor.hasNext()) {
      try {
        let data = await flagCursor.next();
        if (data) {
          return data;
        } else {
          return false;
        }
      } catch (error) {
        console.log(error);
      }
    }
  }

  /**
   * Check to see if an object has all of the flags listed.
   * if one fails, the entire stack fails. Optional modfiers
   * are available.
   * '!flag' checks to see if the target does NOT have a flag.
   * @param {DBO} obj The database object representing the
   * the thing being checked for flags
   * @param {string} flags A string of space seperated flags
   * to check against.
   * @return {boolean} A truthy or falsey response is given
   * depending on if the conditions are met or not.
   */
  hasFlags(obj: IDbObj, flags: string = " ") {
    // We need to iterate through the flag collection
    // without hitting the call stack limit.  Right now
    // has flags is a couple layers deep in recursion.

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
        if (obj.flags.indexOf(flag) === -1) {
          results.push(true);
        } else {
          results.push(false);
        }
        // A normal search, Found it!
      } else if (obj.flags.indexOf(flag) !== -1) {
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

  async set(obj: any, flags: string) {
    // First, let's make a Set object to hold our working data.  You can't
    // have repeating values - so it'll filter any repeats for us.
    const flagSet = new Set(obj.flags);

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
      obj.flags = [...flagSet];
      const updated = await mu.db.objs.update(obj._key, {
        flags: obj.flags
      });
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
   * Checks to see if enactor has at least one of the given flags.
   * @param {DBO} enactor
   * @param {string} flags
   */
  orFlags(enactor: IDbObj, flags = "") {
    let ret = false;
    const flagsArray = flags.toLowerCase().split(" ");

    for (const flag of flagsArray) {
      if (this.hasFlags(enactor, flag)) {
        ret = true;
      }
    }

    return ret;
  }

  async get(flag: string) {
    return db.query(`
      FOR flag IN flags
        FILTER flag.name == "${flag.toLowerCase()}"
        RETURN flag
    `);
  }

  /**
   * Can enactor edit target?
   * @param  enactor The DBO of the enactor,
   * @param  target  The DBO of the target.
   */
  async canEdit(enactor: IDbObj, target: IDbObj) {
    try {
      const enactorLvl = await this.flagLvl(enactor);
      const targetLvl = await this.flagLvl(target);
      if (
        enactor._key === target._key ||
        target.owner === enactor._key ||
        enactorLvl >= targetLvl
      ) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error(error);
    }
  }

  async flagLvl(target: IDbObj) {
    let lvl = 0;
    for (const flag of target.flags) {
      try {
        let flagCursor = await this.get(flag);
        let flg = await flagCursor.next();
        // if it's lower than the previous result, replace it
        if (flg.lvl > lvl) {
          lvl = flg.lvl;
        }
      } catch (error) {}
    }

    return lvl;
  }

  async flagCodes(target: IDbObj) {
    try {
      if (target) {
        let output = `%(#${target._key}${target.type[0].toUpperCase()}`;
        for (const flag of target.flags) {
          try {
            const flgCursor = await this.get(flag);

            let flg;
            if (flgCursor.hasNext()) {
              flg = await flgCursor.next();
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
    } catch (error) {
      console.error(error);
    }
  }
}

export default new Flags("flags");
