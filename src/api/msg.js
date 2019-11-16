//@ts-check
const parser = require("./parser");
const config = require("./config");

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
      parser
        .subs(message)
        .replace(new RegExp("\u250D", "g"), "(")
        .replace(new RegExp("\u2511", "g"), ")") + "\r\n",
      "utf-8"
    );
  }

  end(socket, message) {
    socket.end(message);
  }

  connect(socket) {
    this.send(
      socket,
      `Login successful, Welcome to %ch${config.game.name || "KumaMU"}%cn!`
    );
  }

  error(socket, error) {
    this.send(socket, `Uh oh! You've ran into a bug! ${error}\n${error.stack}`);
  }

  huh(socket) {
    this.send(socket, "Huh? Type 'help' for help.");
  }
}

module.exports = new Message();
