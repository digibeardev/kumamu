const sha256 = require("sha256");
const moment = require("moment");

module.exports = mu => {
  mu.addCommand({
    name: "connect",
    pattern: /^connect\s+?(.*)\s+?(.*)/i,
    run: async (socket, data) => {
      if (!socket._key) {
        const char = (await mu.entities.all(
          entity => entity.name.toLowerCase() === data[1].toLowerCase()
        ))[0];

        if (char) {
          if (char.data.player.password.match(sha256(data[2]))) {
            socket._key = char._key;
            socket.last = moment().unix();
            mu.msg.connect(socket);
          } else {
            mu.msg.end(socket, "Invalid password.");
          }
        } else {
          mu.msg.send(socket, "I can't find that character.");
        }
      }
    }
  });
};
