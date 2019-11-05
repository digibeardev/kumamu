//@ts-check
const { getFiles } = require("./utils/utilities");
const msg = require("./api/msg");
const { Socket } = require("net");
const { resolve } = require("path");
const moment = require("moment");

class MU {
  constructor() {
    this._stack = [];
    this.cmds = new Map();
    this.basePath = __dirname;
    this.scope = {};
  }

  /**
   * Code launched when this api module is loaded.
   */
  async init() {
    // install api.
    await getFiles(resolve(__dirname, "./api/"), async (dirent, path) => {
      const name = dirent.name.split(".")[0];
      this[name] = require(path + dirent.name);
      if (typeof this[name].init === "function") {
        await this[name].init();
      }
      console.log(`API '${name}' loaded.`);
    });

    // install collections.
    await getFiles(
      resolve(__dirname, "./collections/"),
      async (dirent, path) => {
        const name = dirent.name.split(".")[0];
        this[name] = require(path + dirent.name);
        if (typeof this[name].init === "function") {
          await this[name].init();
        }
        console.log(`Collection '${name}' loaded.`);
      }
    );

    // Load Middleware
    getFiles(resolve(__dirname, "./middleware"), (dirent, path) => {
      require(path + dirent.name)(this);
      console.log(`Middleware '${dirent.name.split(".")[0]}' installed.`);
    });

    // Install Components
    await getFiles(resolve(__dirname, "./components"), async (dirent, path) => {
      const name = dirent.name.split(".")[0];
      await require(path + dirent.name)(this);
      console.log(`Component '${name}' loaded`);
    });

    // Check to see if there's a starting room set.  If not, dig rppm 0.  By
    // default, if the starting room isn't defined in the config file, it's
    // going to be 0. Several @ts-ignores whiile I finialize the starting
    // api.  Everything is a dynamic import at the moment. The linter doesn't
    // like those. :)
    // @ts-ignore
    const rooms = await this.entities.all(entity => entity.type === "room");
    if (rooms.length <= 0) {
      console.log("No Rooms found, digging Limbo.");
      // @ts-ignore
      const entity = (await this.entities.create({
        _key: "0000",
        name: "Limbo",
        type: "room"
      })).value;
      // @ts-ignore
      const results = await this.components.set(
        // @ts-ignore
        await this.entities.get(entity._key),
        ["base"]
      );
      if (results._key) {
        console.log("Done.  Room Limbo Created.");
      }
    }

    // Install commands
    await getFiles(resolve(__dirname, "./commands"), (dirent, path) => {
      const name = dirent.name.split(".")[0];
      require(path + dirent.name)(this);
      console.log(`Command '${name}' installed.`);
    });

    // Install Plugins
    await getFiles(resolve(__dirname, "../plugins"), async (dirent, path) => {
      try {
        const pkg = require(path + dirent.name + "/package.json");
        // check for dependencies
        if (pkg.dependencies) {
          console.log(`Installing dependancies for '${dirent.name}':`);
          const process = require("child_process").spawnSync(
            "npm.cmd",
            ["install"],
            { cwd: path + dirent.name }
          );

          // return output.
          console.log(
            `${process.output
              .toString()
              .split(",")
              .filter(Boolean)
              .filter(line => line.trim())
              .join("\n")}`
          );
        }
        await require(path + dirent.name + "/" + pkg.main)(this);
      } catch (error) {
        console.error(`Unable to load plugin '${dirent.name}'.\n${error}`);
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

  /**
   * Add a middleware system to handle input from the sockets.
   * @param {(dataWrapper, next)=> void} middleware A middleware function
   * used to handle input from the connected sockets.
   */
  use(middleware) {
    this._stack.push(middleware);
  }

  /**
   * Add a new global command.
   * @param {Object} options The various options to be set when adding a new
   * command to the global system.
   * @param {string}  options.name The name of the command.
   * @param {RegExp} options.pattern The pattern to match the socket
   * input against.
   * @param {string} [options.restricted] A space seperated list of flags that
   * must be met before a player can use the command
   * @param {(dataWrapper, next) => void} options.run The function to run
   * when the pattern and restrictions have been met.
   */

  addCommand(options) {
    this.cmds.set(options.name.toLowerCase(), options);
  }
  /**
   * @typedef  tSocket A decorated net.socket.
   * @property {Socket} _socket The original net.socket.
   * @property {string} _key The _key of the connected entity.
   * @property {number} timestamp The last time the socket
   * entered a command.
   */

  /**
   * Handle input from a socket.
   * @param {tSocket} socket The socket passed to the handler from the queue.
   * @param {string} data The string passed from the queue.
   */
  async handle(socket, data) {
    let idx = 0;

    const dataWrapper = {
      input: data,
      socket,
      ran: false
    };

    /**
     * @typedef dataWrapper
     * @property {string} input The input string given from the queue.
     * @property {tSocket} socket The socket passed from the queue.
     * @property {Boolean} ran Was the input handled in the middleware?
     */

    socket.timestamp = moment().unix();

    /**
     * Handle the next step of resolving the socket input.
     * @param {Error} err Possible error state returned from an
     * individual middleware.
     * @param {dataWrapper} dataWrapper A wrapper around the socket input string.
     */
    const next = async (err, dataWrapper) => {
      if (err !== null)
        return setImmediate(() => {
          return console.error(err);
        });
      if (dataWrapper.ran)
        return setImmediate(() => {
          return Promise.resolve(dataWrapper);
        });
      if (idx >= this._stack.length && !dataWrapper.ran) {
        return setImmediate(async () => {
          return msg.huh(socket);
        });
      }

      const layer = this._stack[idx++];
      setImmediate(async () => {
        await layer(dataWrapper, next).catch(error => next(error, null));
      });
    };

    next(null, dataWrapper);
  }
}

module.exports = new MU();
