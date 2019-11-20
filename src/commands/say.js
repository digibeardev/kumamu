module.exports = mu => {
  mu.addCommand({
    name: "say",
    pattern: /^(?:"|say\s+)(.*)/i,
    restricted: "connected",
    run: async (socket, match, scope) => {
      if (socket._key) {
        // Get enactor information from socket,
        const enactor = await mu.entities.get(socket._key);
        let curRoom = await mu.entities.get(enactor.location);
        try {
          mu.msg.send(
            socket,
            `You say, "` +
              (await mu.parser.string(socket._key, match[1], scope)) +
              `"`
          );
          mu.msg.sendListOmit(
            socket,
            `${
              enactor.moniker ? enactor.moniker : enactor.name
            } says "${await mu.parser.string(socket._key, match[1], scope)}"`,
            "connected"
          );
        } catch {
          mu.msg.send(socket, mu.parser.subs(`You say, "` + match[1] + `"`));
          mu.broadcast.sendListOmit(
            socket,
            curRoom.contents,
            `${enactor.moniker ? enactor.moniker : enactor.name} says "${
              match[1]
            }"`,
            "connected"
          );
        }
      }
    }
  });
};
