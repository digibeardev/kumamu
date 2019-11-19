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
          entity.alias === data[1].toLowerCase()
            ? true
            : false
        );

        // If no matches were found, create a new player entity.
        if (matches.length <= 0) {
          const results = await mu.entities.create({
            name: data[1],
            type: "player"
          });

          if (results._key) {
            // No error from validating and saving the data.
            const entity = await mu.entities.get(results._key);

            socket._key = results._key;
            socket.last = moment().unix();
            entity.owner = results._key;
            entity.password = sha256(data[2]);
            if (chars.length <= 0) {
              await mu.flags.set(entity, "immortal connected");
            } else {
              await mu.flags.set(entity, "connected");
            }
            const entKey = (await mu.entities.update(entity._key, entity))._key;
            if (entKey) {
              mu.msg.connect(socket);
              mu.exe(socket, "look", []);
            } else {
              mu.msg.send(socket, "Unable to create character!");
            }
          }
        } else {
          mu.msg.send(socket, "That name is either illegal or already in use.");
        }
      }
    }
  });
};
