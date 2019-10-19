import { Collection } from "../../../classes/collection";
import { DocumentData } from "arangojs/lib/cjs/util/types";
import { Attribute } from "../../attrs";
import { Component } from "../../../classes/components";
import db from "../DatabaseClass";

export interface IDbObj extends DocumentData {
  name: string;
  alias?: string;
  type: string;
  attributes?: Attribute[];
  components?: Component[];
  owner: string;
  moniker?: string;
  created: Number;
  modified: Number;
  last?: Number;
  flags: string[];
  contents: string[];
  channels: string[];
  exits?: string[];
  locks: string[];
  location?: string[];
  to?: string[];
  from?: string[];
}

export class ObjectsClass extends Collection {
  constructor(name: string) {
    super(name);
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
      let query = await db.query(`
          FOR obj IN objects
            FILTER LOWER(obj.name == ${ref}) ||
                LOWER(obj.alias == ${ref})
              RETURN obj
        `);

      return await query.next();
    }
  }
}

export default new ObjectsClass("obj");
