import { readdirSync } from "fs";
import { resolve } from "path";
import { getModules, getFiles } from "../utils/utilities";
import { Socket } from "net";
import { ICommand } from "../middleware/cmds";
import config from "../api/config";
import db from "../api/db/DatabaseClass";
import objs, { IDbObj } from "../api/db/collections/objs";
import flags from "../api/db/collections/flags";
const moment = require("moment");

export interface IEngine {
  cmds: Map<string, ICommand>;
  use: (func: FuncUseType) => Promise<void>;
  exe: (socket: any, command: string, args: string[]) => Promise<string>;
  start: () => Promise<void>;
  handle: (socket: Socket, data: any, scope: object) => Promise<void>;
}

export interface IDataWrapper {
  input: any;
  socket: any;
  game: any;
  ran: Boolean;
}

export type FuncUseType = (data: any, next: FuncNextType) => Promise<any>;
export type FuncNextType = (error: Error | null, data?: any) => Promise<any>;

class Engine implements IEngine {
  private stack: any[];
  private api: Map<string, { mod: any; file: string }>;
  plugins: Map<string, any>;
  cmds: Map<string, ICommand>;
  [key: string]: any;

  constructor() {
    this.stack = [];
    this.api = new Map();
    this.cmds = new Map();
    this.plugins = new Map();
  }

  public async start() {
    await db.init();
    await flags.init();
    const all = await objs.all();
    // Starting Room Check.
    const rooms = all.filter((item: IDbObj) => item.type === "room");
    if (rooms.length === 0) {
      console.log("No Rooms found.  Digging Limbo.");
      const Limbo = await objs.create({ name: "Limbo", type: "room" });
      objs.startingRoom = Limbo._key;
      console.log(`Limbo(#${Limbo._key}) created.`);
    } else {
      const Limbo = await objs.id("Limbo");
      if (!objs.startingRoom) {
        objs.startingRoom = Limbo._key;
        console.log(`Starting Room set. Limbo(#${Limbo._key})`);
      }
    }

    // Clear connected flags for all characters.  This is just incase the game
    // didn't shut down clean.
    for (const char of all.filter((item: IDbObj) => item.type === "player")) {
      flags.set(char, "!connected");
    }

    this.use((await import("../middleware/cmds")).default);
    console.log("Loading Commands.");
    await this.loadCommands();
    console.log("Commands Loaded.");
    console.log("Loading Plugins.");
    await this.loadPlugins();
    console.log("Plugins Loaded.");
    console.log("Loading Systems.");
    await this.loadSystems();
    console.log("Systems Loaded.");
    console.log("Game running on port:", config.game.port || 4000);
  }

  private async loadCommands() {
    await getFiles("../commands/", async (path, file) => {
      const mod = await import(path + file.name);
      const name = file.name.split(".")[0].toLowerCase();
      this.cmds.set(name, mod.default);
    });
  }

  private async loadSystems() {
    await getModules("../systems/");
  }

  public async use(func: FuncUseType) {
    this.stack.push(func);
  }

  private async loadPlugin(folder: string) {
    const pkg = await import(`../plugins/${folder}/package.json`);
    if (pkg) {
      const file = pkg.main ? pkg.main : "index.js";
      const parts = folder.split("/");
      const plugin = await import(`../plugins/${folder}/${file}`).catch(error =>
        console.log(error)
      );
      this.plugins.set(parts.pop()!, plugin);
      console.log(`Plugin loaded: ${folder} (v${pkg.version}).`);
    } else {
      console.log(`Plugin Failed: ${folder}.  No package.json found.`);
    }
  }

  private async loadPlugins() {
    const getDirectories = (source: string) =>
      readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    const plugins = getDirectories(resolve(__dirname, "../plugins"));
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
      if (err !== null)
        return setImmediate(() => {
          return console.log(err);
        });
      if (dataWrapper.ran)
        return setImmediate(() => {
          return Promise.resolve(dataWrapper);
        });
      if (idx >= this.stack.length && !dataWrapper.ran) {
        return setImmediate(async () => {
          return console.log("Huh message!");
        });
      }

      const layer = this.stack[idx++];
      setImmediate(async () => {
        await layer(dataWrapper, next).catch((error: Error) =>
          next(error, null)
        );
      });
    };

    next(null, dataWrapper);
  }
}

export default new Engine();
