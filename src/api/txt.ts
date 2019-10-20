import { getFiles } from "../utils/utilities";
import { readFileSync } from "fs";
import { resolve } from "path";

export class TextFiles {
  private txt: Map<string, string>;

  constructor() {
    this.txt = new Map();
    this.init();
  }

  private async init() {
    await getFiles("../text/", (path, file) => {
      const contents = readFileSync(
        resolve(__dirname, path, file.name),
        "utf-8"
      );
      const name = file.name.split(".")[0];
      this.txt.set(name.toLowerCase(), contents);
    });
  }

  get(name: string = "") {
    return this.txt.get(name.toLowerCase());
  }

  set(name: string, path: string) {
    const file = readFileSync(path, "utf-8");
    this.txt.set(name.toLowerCase(), file);
    return file;
  }
}

export default new TextFiles();
