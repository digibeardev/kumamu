import db from "../api/db/DatabaseClass";
import {
  ArangoCollection,
  DocumentCollection
} from "arangojs/lib/cjs/collection";
import { DocumentData } from "arangojs/lib/cjs/util/types";

export interface ICollection {
  init: () => Promise<void>;
  id: (ref: string) => Promise<any> | Promise<void>;
  delete: (key: string, record: DocumentData) => Promise<any>;
  save: (record: DocumentData) => Promise<any>;
  update: (key: string, update: DocumentData) => Promise<any>;
  onLoad: () => void;
  all: () => Promise<any[]>;
}

export class Collection implements ICollection {
  private name: string;
  collection: DocumentCollection<any>;

  constructor(name: string) {
    this.name = name;
    this.collection = db.collection(name);
  }

  /**
   * Get a document from the collection by ID.
   * @param ref Get an object record based on it's _key.
   */
  public async id(ref: string) {
    return this.collection.firstExample({ _key: ref });
  }

  public async all() {
    let collCursor = await db.query(`
    FOR obj of ${this.name}
    RETURN obj
    `);
    return await collCursor.all();
  }

  /**
   * Initiate the collection
   */
  async init() {
    // Check to see if stats is in the collections list.
    // If not, create it.
    let collections = await db
      .listCollections()
      .catch((error: Error) => console.error(error));

    collections = collections.filter((entry: ArangoCollection) =>
      entry.name === this.name ? true : false
    );

    if (collections.length <= 0) {
      await this.collection.create().catch(async () => {
        await this.collection
          .get()
          .catch((error: Error) => console.error(error));
        if (this.hasOwnProperty("onLoad")) {
          this.onLoad();
        }
      });
    }
  }

  /**
   * Run aditional functionality on class instantiation.
   */
  async onLoad() {
    throw new Error("Method not implemented.");
  }

  /**
   * Save a document in the collection
   * @param obj the database object to save.
   */
  async save(obj: DocumentData) {
    return this.collection.save(obj);
  }

  /**
   * Update a pre-existing document in the collection.
   * @param key The record to update
   * @param update The object literal update to make to the record.
   */
  async update(key: string, update: DocumentData) {
    return this.collection.update(key, update);
  }

  /**
   * Remove a document from the collection.
   * @param key The key of the document to remove.
   */
  async delete(key: string) {
    return this.collection.remove(key);
  }
}

export default Collection;
