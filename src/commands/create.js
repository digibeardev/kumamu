//@ts-check
const moment = require("moment");
const sha256 = require("sha256");

module.exports = mu => {
  mu.addCommand({
    name: "create",
    pattern: /^create\s+(.*)\s+?(.*)/i,
    run: async (socket, data) => {
      // Make sure they don't already have an entity key associated with the
      // socket. If a key is not present, continue.
      if (!socket._key) {
        const chars = await mu.entities.all(entity => entity.type === "player");
        // Find any entities that match the requested name, or has an alias
        // matching the requested name.
        const matches = chars.filter(entity =>
          entity.name.toLowerCase() === data[1].toLowerCase() ||
          entity.data.player.alias === data[1].toLowerCase()
            ? true
            : false
        );

        // If no matches were found, create a new player entity.
        if (matches.length <= 0) {
          const results = await mu.entities.create({
            name: data[1],
            type: "player"
          });
          const { value, error } = results;
          if (value._key && !error) {
            // No error from validating and saving the data.
            const entity = await mu.entities.get(value._key);
            const target = await mu.components.set(entity, ["base", "player"]);

            socket._key = value._key;
            socket.last = moment().unix();
            target.data.base.owner = value._key;
            target.data.player.password = sha256(data[2]);
            if (chars.length <= 0) {
              await mu.flags.set(target, "immortal connected");
            } else {
              await mu.flags.set(target, "connected");
            }
            const entKey = (await mu.entities.update(value._key, target))._key;
            if (entKey) {
              mu.msg.connect(socket);
              mu.exe(socket, "look", []);
            } else if (error) {
              mu.msg.send(socket, error);
            } else {
              mu.msg.send(socket, results.error);
            }
          }
        } else {
          mu.msg.send(socket, "That name is either illegal or already in use.");
        }
      }
    }
  });
};
