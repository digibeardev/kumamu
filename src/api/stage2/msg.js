//@ts-check
const { difference } = require("lodash");

module.exports = mu => {
  class Message {
    /**
     * Send a message to a soocket.
     * @param {*} socket The network socket to send the message to.
     * @param {string} message The message to send.
     * @param {Object<string,any>} options Any options passed along
     * with with the send statement.
     */
    send(socket, message = "", options = {}) {
      socket.write(
        mu.parser
          .subs(message)
          .replace(new RegExp("\u250D", "g"), "(")
          .replace(new RegExp("\u2511", "g"), ")") + "\r\n",
        "utf-8"
      );
    }

    /**
     * Send a message to a list of sockets, minus the socket passed as
     * the enactor of the command.
     * @param {*} socket
     * @param {string} message
     * @param {string} flgs
     */
    async sendListOmit(socket, message, flgs = "connected") {
      const en = await mu.entities.get(socket._key);

      const entities = await mu.entities.all(async entity => {
        if (
          entity.location === en.location &&
          entity.type === "player" &&
          (await mu.flags.hasFlags(entity, flgs)) &&
          entity._key !== en._key
        ) {
          return entity;
        }
      });

      entities.forEach(async item => {
        // @ts-ignore
        if (await mu.flags.hasFlags(item, flgs)) {
          this.send(mu.queues.keyToSocket(item._key), message);
        }
      });
    }

    /**
     *
     * @param {Object<string,any>} options Options to pass to the command
     * @param {String[]} options.dbrefs A list of database reference numbers.
     * @param {Object} options.enactor
     * @param {string} options.message
     * @param {string} options.flags
     * @param {Object[]} options.targets
     * @param {String} options.message The message to send to each dbref.
     * @param {String} [options.flags=""] The list of flags the dbref must have in order
     * to get the message.
     * @param {String[]} [options.ignore] A list of dbrefs that shouldn't recieve the
     * the message
     */
    async sendGroup({
      enactor,
      targets,
      message,
      flags = "connected",
      ignore = []
    }) {
      const list = Array.from(targets);
      const sockets = [];
      const enSocket = await mu.queues.keyToSocket(enactor._key);

      for (const target of list) {
        const socket = mu.queues.keyToSocket(target._key);

        if (socket && (await mu.flags.hasFlags(target, flags))) {
          sockets.push(socket);
          // If no socket, take it off the send list.
        } else {
          list.splice(list.indexOf(target), 1);
        }
      }

      sockets.push(enSocket);

      // One recipient
      if (sockets.length === 1) {
        const target = await mu.entities.get(sockets[0]._key);

        for (const socket of sockets) {
          if (socket === enSocket) {
            this.send(
              enSocket,
              `Long distance to ${
                target.moniker ? target.moniker : target.name
              }${target.alias ? "(" + target.alias + ")" : ""}, ${message}`
            );
          } else {
            await this.send(socket, `From afar, ${message}`);
          }
        }

        // Multiple recipients
      } else if (sockets.length > 1) {
        const socketsSet = new Set(sockets);
        for (const socket of socketsSet) {
          const sendList = list
            .map(el => {
              if (el._key !== enSocket._key) {
                if (el.moniker) {
                  return `${el.moniker}${el.alias ? "(" + el.alias + ")" : ""}`;
                } else {
                  return `${el.name}${el.alias ? "(" + el.alias + ")" : ""}`;
                }
              }
            })
            .join(" ");
          if (sendList && sendList.split(" ").filter(Boolean).length > 1) {
            await this.send(
              socket,
              await mu.parser.string(
                enactor,
                `${socket === enSocket ? "To" : "From afar,"} %(${
                  socket === enSocket ? "" : "To: "
                }[itemize(${sendList})]%) ${message}`,
                mu.scope
              )
            );
          } else if (sendList) {
            await this.send(
              socket,
              await mu.parser.string(
                enactor,
                `${
                  socket === enSocket
                    ? "To " + sendList.trim() + ","
                    : "From afar,"
                } ${message}`,
                mu.scope
              )
            );
          } else {
            await this.send(enSocket, "No one to page.");
          }
        }
      } else {
        await this.send(enSocket, "No one to page.");
      }
    }

    end(socket, message) {
      socket.end(message);
    }

    connect(socket) {
      this.send(
        socket,
        `Login successful, Welcome to %ch${mu.config.game.name || "KumaMU"}%cn!`
      );
    }

    error(socket, error) {
      this.send(
        socket,
        `Uh oh! You've ran into a bug! ${error}\n${error.stack}`
      );
    }

    huh(socket) {
      this.send(socket, "Huh? Type 'help' for help.");
    }
  }

  return new Message();
};
