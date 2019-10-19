import db from "./db/DatabaseClass";

export interface Attribute {
  key: string;
  name: string;
  value: string;
}

export class Attributes {}

export default new Attributes();
