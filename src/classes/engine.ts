import { readdirSync } from "fs";
import { resolve } from "path";
import { getModules } from "../utils/utilities";
import { Socket } from "net";
import { ICommand } from "../middleware/cmds";
import attrs, { Attributes } from "api/attrs";
import flags, { Flags } from "api/flags";
import msg, { Message } from "api/msg";
import db, { DatabaseClass } from "api/db/DatabaseClass";
import parser, { Parser } from "api/parser";
import queues, { Queue } from "api/queues";
import txt, { TextFiles } from "api/txt";
const moment = require("moment");

export interface IEngine {
  db: DatabaseClass;
  attrs: Attributes;
  config: any;
  flags: Flags;
  msg: Message;
  parser: Parser;
  queues: Queue;
  txt: TextFiles;
  use: (func: FuncUseType) => Promise<void>;
  exe: (socket: any, command: string, args: string[]) => Promise<string>;
  start: () => Promise<void>;
  handle: (socket: Socket, data: any, scope: object) => Promise<void>;
}

export interface APIModule {
  start: () => Promise<void>;
  restart: () => Promise<void>;
}

export interface apiEntry {
  mod: APIModule;
  file: string;
}

export interface IDataWrapper {
  input: any;
  socket: any;
  game: any;
  ran: Boolean;
}

type FuncUseType = (data: any, next: any) => Promise<FuncNextType>;
export type FuncNextType = (error: Error | null, data?: any) => Promise<void>;

class Engine implements IEngine {
  db: DatabaseClass;
  attrs: Attributes;
  config: any;
  flags: Flags;
  msg: Message;
  parser: Parser;
  queues: Queue;
  txt: TextFiles;
  private stack: FuncUseType[];
  private api: Map<string, { mod: any; file: string }>;
  plugins: Map<string, any>;
  cmds: Map<string, ICommand>;
  [key: string]: any;

  constructor() {
    this.db = db;
    this.attrs = attrs;
    this.flags = flags;
    this.msg = msg;
    this.parser = parser;
    this.queues = queues;
    this.txt = txt;
    this.stack = [];
    this.api = new Map();
    this.cmds = new Map();
    this.plugins = new Map();
  }

  public async start() {
    console.log("Loading Plugins.");
    await this.loadPlugins();
    console.log("Plugins Loaded.");
    console.log("Loading Systems.");
    await this.loadSystems();
    console.log("Systems Loaded.");
  }

  private async loadSystems() {
    await getModules("../systems/");
  }

  public async use(func: FuncUseType) {
    this.stack.push(func);
  }

  private async loadPlugin(folder: string) {
    const config = await import(`../../../plugins/${folder}/package.json`);
    if (config) {
      const file = config.main ? config.main : "index.js";
      const parts = folder.split("/");
      const plugin = await import(`../../../plugins/${folder}/${file}`).catch(
        error => console.log(error)
      );
      this.plugins.set(parts.pop()!, plugin);
      console.log(`Plugin loaded: ${folder} (v${config.version}).`);
    } else {
      console.log(`Plugin Failed: ${folder}.  No package.json found.`);
    }
  }

  private async loadPlugins() {
    const getDirectories = (source: string) =>
      readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    const plugins = getDirectories(resolve(__dirname, "../../plugins"));
    for (const plugin of plugins) {
      this.loadPlugin(plugin).catch(error => console.log(error));
    }
  }

  public async exe(socket: any, command: string, args: string[]) {
    return "Not implemented yet!";
  }

  public async handle(socket: any, data: any) {
    let idx = 0;
    const dataWrapper: IDataWrapper = {
      input: data,
      socket,
      game: this,
      ran: false
    };

    socket.timestamp = moment().unix();

    const next = async (err: Error | null, dataWrapper: any) => {
      if (err !== null) setImmediate(() => console.log(err));
      if (dataWrapper.ran) setImmediate(() => Promise.resolve(dataWrapper));
      if (idx >= this.stack.length && !dataWrapper.ran) {
        return setImmediate(async () => {
          console.log("Huh message!");
        });
      }

      const layer = this.stack[idx++];
      setImmediate(async () => {
        await layer(dataWrapper, next).catch(error => next(error, null));
      });
    };

    next(null, dataWrapper);
  }
}

export default new Engine();
