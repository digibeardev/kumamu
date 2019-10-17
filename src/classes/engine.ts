import { readdirSync } from "fs";
import { resolve } from "path";
import { getFiles } from "../utils/utilities";
import { Socket } from "net";
const moment = require("moment");

export interface IEngine {
  use: (func: FuncUseType) => Promise<void>;
  exe: (socket: any, command: string, args: string[]) => Promise<string>;
  start: () => Promise<void>;
  handle: (socket: Socket, data: any) => Promise<void>;
  [key: string]: any;
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
type FuncNextType = (error: Error | null, data?: any) => Promise<void>;

class Engine implements IEngine {
  private stack: FuncUseType[];
  private api: Map<string, { mod: any; file: string }>;
  private plugins: Map<string, any>;
  [key: string]: any;

  constructor() {
    this.stack = [];
    this.api = new Map();
    this.plugins = new Map();
  }

  public async start() {
    console.log("Loading API.");
    await this.loadApi();
    console.log("API Loaded.");
    console.log("Loading Plugins.");
    await this.loadPlugins();
    console.log("Plugins Loaded.");
    console.log("Loading Systems.");
    await this.loadSystems();
    console.log("Systems Loaded.");
  }

  private async loadSystems() {
    getFiles("../systems/", async (path, file) => {
      let mod = await import(path + file);
      if (typeof mod.default === "function") {
        mod.default();
        console.log(`System: '${file.split(".")[0]}' loaded.`);
      }
    });
  }

  public async use(func: FuncUseType) {
    this.stack.push(func);
  }

  private async loadApi() {
    let dir = readdirSync(resolve(__dirname, "../api/"));
    for (const file of dir.filter(file => !file.match(/.*.map$/))) {
      const parts: string[] = file.split(".");
      if (!this[parts[0]]) {
        const mod = await import(`../api/${file}`).catch(error =>
          console.log(error)
        );
        this[parts[0]] = await mod.default;
        this.api.set(parts[0], { mod: mod.default, file });
        if (mod.default.start) {
          await this.api.get(parts[0])!.mod.start();
        }
        console.log(`API Loaded: ${parts[0]}`);
      }
    }
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
