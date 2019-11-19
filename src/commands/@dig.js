module.exports = mu => {
  mu.addCommand({
    name: "@dig",
    pattern: /^@dig(\/tel[eport]+)?\s+(.*)/i,
    flags: "connected immortal|wizard|royalty",
    run: async (socket, match) => {
      // Deconstruct a whole mess of arguments!
      const [_, teleport, args] = match;
      const [name, exits] = args.split("=");
      let toexit, fromexit, toExit, fromExit;
      if (exits) {
        [toExit, fromExit] = exits.split(",");
      }

      try {
        const enactor = await mu.entities.key(socket._key);
        const curRoom = await mu.entities.key(enactor.location);

        // Check to see if the player has permissions to dig new
        // rooms from this location.
        if (await mu.flags.canEdit(enactor, curRoom)) {
          // Create the new room
          let room = await mu.entities.insert({
            name: name.trim(),
            type: "room",
            owner: socket._key,
            exits: []
          });

          room = await mu.entities.key(room._key);

          mu.broadcast.send(
            socket,
            `%chDone.%cn Room %ch${room.name.trim()}(#${room._key})%cn dug.`
          );

          // If a 'to' exit is defined, create the db reference and link.
          if (toExit) {
            toexit = await mu.db.insert({
              name: toExit.trim(),
              type: "exit",
              owner: enactor._key,
              location: enactor.location,
              to: room._key,
              from: curRoom._key
            });

            toexit = await mu.db.key(toexit._key);

            await mu.db.update(curRoom._key, {
              exits: [...curRoom.exits, toexit._key]
            });
            mu.broadcast.send(
              socket,
              `%chDone.%cn Exit %ch${
                toexit.name.split(";")[0]
              }%cn opened to room %ch${room.name}%cn.`
            );
          }

          if (fromExit) {
            fromexit = await mu.db.insert({
              name: fromExit.trim(),
              type: "exit",
              owner: enactor._key,
              location: room._key,
              to: curRoom._key,
              from: room._key
            });

            fromexit = await mu.db.key(fromexit._key);

            mu.db.update(room._key, {
              exits: [...room.exits, fromexit._key]
            });
            mu.broadcast.send(
              socket,
              `%chDone.%cn Exit %ch${
                fromexit.name.split(";")[0]
              }%cn opened to room %ch${curRoom.name}%cn.`
            );
          }
        } else {
          mu.broadcast.send(socket, "Permission denied.");
        }
      } catch (error) {
        mu.log.error(error);
      }
    }
  });
};
