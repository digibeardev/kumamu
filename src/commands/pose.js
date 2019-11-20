module.exports = mu => {
  mu.cmds.set("pose", {
    pattern: /^(?::|pose\s+)(.*)/i,
    restricted: "connected",
    run: async (socket, match, scope) => {
      const enactor = await mu.entities.get(socket._key);
      try {
        // send a message to the socket
        mu.msg.send(
          socket,
          `${
            enactor.moniker ? enactor.moniker : enactor.name
          } ${await mu.parser.string(socket._key, match[1], scope)}`
        );

        // send a message to the rest of the room's 'connected' contents.
        mu.msg.sendListOmit(
          socket,
          `${
            enactor.moniker ? enactor.moniker : enactor.name
          } ${await mu.parser.string(socket._key, match[1], scope)}`,
          "connected"
        );
      } catch (error) {
        console.error(error);
      }
    }
  });

  mu.cmds.set("pose2", {
    pattern: /^;(.*)/i,
    restricted: "connected",
    run: async (socket, match, scope) => {
      const enactor = await mu.entities.get(socket._key);
      try {
        mu.msg.send(
          socket,
          `${
            enactor.moniker ? enactor.moniker : enactor.name
          }${await mu.parser.string(socket._key, match[1], scope)}`
        );

        mu.msg.sendListOmit(
          socket,
          `${
            enactor.moniker ? enactor.moniker : enactor.name
          }${await mu.parser.string(socket._key, match[1], scope)}`,
          "connected"
        );
      } catch (error) {
        console.error(error);
      }
    }
  });
};
