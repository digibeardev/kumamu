//@ts-check
const { getFiles } = require("./utils/utilities");
const { resolve } = require("path");
const ezSpawn = require("ez-spawn");

class MU {
  /**
   * Code launched when this api module is loaded.
   */
  async init() {
    // set base path
    this.basePath = __dirname;

    // install api methods.
    await getFiles(resolve(__dirname, "./api/"), async (dirent, path) => {
      const name = dirent.name.split(".")[0];
      this[name] = require(path + dirent.name);
      if (typeof this[name].init === "function") {
        await this[name].init();
      }
      console.log(`API '${name}' loaded.`);
    });

    // Install Components
    await getFiles(resolve(__dirname, "./components/"), (dirent, path) => {
      const name = dirent.name.split(".")[0];
      require(path + dirent.name)(this);
      console.log(`Component '${name}' loaded`);
    });

    // Install Plugins
    await getFiles(resolve(__dirname, "../plugins"), async (dirent, path) => {
      try {
        const pkg = require(path + dirent.name + "/package.json");
        // check for dependencies
        if (pkg.dependencies) {
          const process = ezSpawn.sync(`npm install`, {
            cwd: `../${dirent.name}/`
          });
          console.log("Installing dependancies: ", process.stdout);
        }
        await require(path + dirent.name + "/" + pkg.main)(this);
      } catch (error) {
        console.error(
          `Unable to load package.json for '${dirent.name}'.\r${error}`
        );
      }
    });

    // Start systems
    await getFiles(resolve(__dirname, "./systems"), (dirent, path) => {
      require(path + dirent.name)(this);
      const name = dirent.name.split(".")[0];
      console.log(`System '${name}' loaded.`);
    });
  }

  /**
   * Register a new api object.
   * @param {string} name The name used to call the api module.
   * @param {*} api The instantiated object that holds the code
   * to expose to the api.
   *
   */
  register(name, api) {
    this[name.toLowerCase()] = api;
    return this;
  }
}

module.exports = new MU();
