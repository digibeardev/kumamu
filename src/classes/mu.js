//@ts-check

const { getFiles } = require("../utils/utilities");

module.exports = class MU {
  constructor() {
    this.init();
  }

  async init() {
    // install api methods.
    await getFiles("./api/", dirent => {
      const name = dirent.name.split(".")[0];
      this[name] = require("./api/" + dirent.name);
      console.log(`API '${name}' loaded.`);
    });
  }
};
