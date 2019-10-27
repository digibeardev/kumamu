//@ts-check

const { getFiles } = require("./utils/utilities");

class MU {
  constructor() {}

  async init() {
    // install api methods.
    await getFiles("./api/", dirent => {
      const name = dirent.name.split(".")[0];
      this[name] = require("./api/" + dirent.name);
      console.log(`API '${name}' loaded.`);
    });
  }
}

module.exports = new MU();
