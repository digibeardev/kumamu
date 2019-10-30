// @ts-check
const { getFiles } = require("../utils/utilities");
const { resolve } = require("path");
const { readFileSync } = require("fs");

class TextFiles {
  constructor() {
    this.txt = new Map();
    this.init();
  }

  async init() {
    await getFiles(resolve(__dirname, "../../text/"), (dirent, path) => {
      const contents = readFileSync(path + dirent.name, "utf-8");
      const name = dirent.name.split(".")[0];
      this.txt.set(name.toLowerCase(), contents);
    });
  }

  get(name = "") {
    return this.txt.get(name.toLowerCase());
  }

  set(name, path) {
    const file = readFileSync(path, "utf-8");
    this.txt.set(name.toLowerCase(), file);
    return file;
  }
}

module.exports = new TextFiles();
