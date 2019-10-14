import { Collection } from "../../../classes/collection";
import { DocumentData } from "arangojs/lib/cjs/util/types";
import { Attribute } from "../../attrs";
import { Component } from "../../../classes/components";

export interface IDbObj extends DocumentData {
  name: string;
  alias?: string;
  type: String;
  attributes?: Attribute[];
  components?: Component[];
  owner: string;
  moniker?: string;
  created: Number;
  modified: Number;
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

class Objects extends Collection {
  constructor(name: string) {
    super(name);
  }

  public async insert(obj: IDbObj) {
    return await this.save(obj);
  }
}

export default new Objects("obj");
