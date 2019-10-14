import db from "./db";

export interface Attribute {
  key: string;
  name: string;
  value: string;
}

class Attributes {
  public async set(attr: Attribute) {
    let target = await db.cols.obj;
  }
}

export default new Attributes();
