//@ts-check

const { getFiles } = require("./utils/utilities");

class MU {
  async init() {
    // install api methods.
    await getFiles("../api/", async dirent => {
      const name = dirent.name.split(".")[0];
      this[name] = require("./api/" + dirent.name);
      if (typeof this[name].init === "function") {
        await this[name].init();
      }
      console.log(`API '${name}' loaded.`);
    });

    // Install Components
    await getFiles("../components/", dirent => {
      const name = dirent.name.split(".")[0];
      require("./components/" + dirent.name)(this);
      console.log(`Component '${name}' loaded`);
    });
  }
}

module.exports = new MU();
