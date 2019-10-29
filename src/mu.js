//@ts-check

const { getFiles } = require("./utils/utilities");

class MU {
  async init() {
    // install api methods.
    await getFiles("../api/", async (dirent, path) => {
      const name = dirent.name.split(".")[0];
      this[name] = require(path + dirent.name);
      if (typeof this[name].init === "function") {
        await this[name].init();
      }
      console.log(`API '${name}' loaded.`);
    });

    // Install Components
    await getFiles("../components/", (dirent, path) => {
      const name = dirent.name.split(".")[0];
      require(path + dirent.name)(this);
      console.log(`Component '${name}' loaded`);
    });
  }
}

module.exports = new MU();
