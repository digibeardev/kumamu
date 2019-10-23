import { DocumentData } from "arangojs/lib/cjs/util/types";
import { Attribute } from "../../attrs";
import { Component } from "../../../classes/components";
import Collection from "../../../classes/collection";
import moment = require("moment");
import config from "../../config";

export interface IDbObj extends DocumentData {
  _key?: string;
  name: string;
  password?: string;
  alias?: string;
  type?: string;
  attributes?: Attribute[];
  components?: Component[];
  owner?: string;
  moniker?: string;
  created?: Number;
  modified?: Number;
  last?: Number;
  flags?: string[];
  contents?: string[];
  channels?: string[];
  exits?: string[];
  locks?: string[];
  location?: string[];
  to?: string[];
  from?: string[];
}

export class ObjectsClass extends Collection {
  index: number[];
  constructor(name: string) {
    super(name);
    this.index = [];
  }

  set startingRoom(room: string) {
    try {
      config.game.startingRoom = room;
    } catch (error) {
      console.error(error);
    }
  }

  get startingRoom() {
    return config.game.startingRoom;
  }

  public key(key: string) {}

  /**
   * Add a new object to the database.
   * @param obj The object to be added to the database.
   */
  public async insert(obj: IDbObj) {
    return await this.save(obj);
  }

  public async id(ref: string) {
    if (ref[0] === "#") {
      ref = ref.slice(1);
    }

    if (Number.isInteger(parseInt(ref))) {
      return this.collection.firstExample({ _key: ref });
    } else {
      const records = await this.all();
      for (const record of records) {
        if (record.name.toLowerCase() === ref.toLowerCase()) {
          return record;
        }
      }

      return false;
    }
  }

  /**
   * Create a new DbObj.
   * @param obj The IDbObj reference passed to the command.
   */
  async create(obj: IDbObj) {
    const timeStamp = moment().unix();
    const record: IDbObj = {
      contents: obj.contents || [],
      attributes: obj.attributes || [],
      name: obj.name,
      password: obj.password || "",
      type: obj.type || "thing",
      flags: obj.flags || [],
      channels: obj.channels || [],
      modified: timeStamp,
      created: timeStamp
    };

    const results = await this.insert(record).catch(error =>
      console.error(error)
    );
    if (!record.owner) {
      this.update(results._key, { owner: results._key });
    }
    return await this.id(results._key);
  }

  async initIndex() {
    this.index = [0];
    // Search through the db collection and collect all of the
    // current dbrefs.
    try {
      const docs = await this.all();
      if (docs.count > 0) {
        for (const doc of docs) {
          this.index.push(parseInt(doc._key));
        }
      }
      return this.index.sort();
    } catch (error) {
      console.error(error);
    }
  }

  /** Generate a new ID */
  newKey() {
    // First, check for any gaps in the database. If there's an open
    // number lower than the next increment use that instead.
    const index = this.index.sort();

    let mia = index.reduce(function(acc, cur, ind, arr) {
      let diff = cur - arr[ind - 1];
      if (diff > 1) {
        let i = 1;
        while (i < diff) {
          // @ts-ignore
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
      this.index.push(this.index.length - 1);
      return this.index.length - 1;
    }
  }
}

export default new ObjectsClass("objs");
