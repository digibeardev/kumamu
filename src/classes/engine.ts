import { readdirSync } from "fs";
import { resolve } from "path";

export interface IEngine {
  use: (func: FuncUseType) => Promise<void>;
  exe: (socket: any, command: string, args: string[]) => Promise<string>;
  start: () => Promise<void>;
  [key: string]: any;
}

type FuncUseType = (
  socket: any,
  data: any,
  next: FuncNextType
) => Promise<FuncNextType>;

type FuncNextType = (error: Error, data: any) => void;

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
  }

  public async use(func: FuncUseType) {
    this.stack.push(func);
  }

  private async loadApi() {
    let dir = readdirSync(resolve(__dirname, "../api/"));
    for (const file of dir) {
      const parts: string[] = file.split(".");
      if (!this[parts[0]]) {
        const mod = await import(`../api/${file}`).catch(error =>
          console.log(error)
        );
        this[parts[0]] = mod.default;
        this.api.set(parts[0], { mod: mod.default, file });
        console.log(`API Loaded: ${parts[0]}`);
      }
    }
  }

  private async loadPlugin(folder: string) {
    const config = await import(`../../plugins/${folder}/package.json`);
    if (config) {
      const file = config.main ? config.main : "index.js";
      const parts = folder.split("/");
      const plugin = await import(`../../plugins/${folder}/${file}`).catch(
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

  private async handle(socket: any, data: any) {}
}

export default new Engine();
