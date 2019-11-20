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
        const enactor = await mu.entities.get(socket._key);
        const curRoom = await mu.entities.get(enactor.location);

        // Check to see if the player has permissions to dig new
        // rooms from this location.
        if (await mu.flags.canEdit(enactor, curRoom)) {
          // Create the new room
          let room = await mu.entities.create({
            name: name.trim(),
            type: "room",
            owner: socket._key
          });

          room = await mu.entities.get(room._key);

          mu.msg.send(
            socket,
            `%chDone.%cn Room %ch${room.name.trim()}(#${room._key})%cn dug.`
          );

          // If a 'to' exit is defined, create the db reference and link.
          if (toExit) {
            toexit = await mu.entities.create({
              name: toExit.trim(),
              type: "exit",
              owner: enactor._key,
              location: enactor.location,
              to: room._key,
              from: curRoom._key
            });

            toexit = await mu.entities.get(toexit._key);

            curRoom.exits = [...curRoom.exits, toexit._key];
            await mu.entities.update(curRoom._key, curRoom);
            mu.msg.send(
              socket,
              `%chDone.%cn Exit %ch${
                toexit.name.split(";")[0]
              }%cn opened to room %ch${room.name}%cn.`
            );
          }

          if (fromExit) {
            fromexit = await mu.entities.create({
              name: fromExit.trim(),
              type: "exit",
              owner: enactor._key,
              location: room._key,
              to: curRoom._key,
              from: room._key
            });

            fromexit = await mu.entities.get(fromexit._key);
            room.exits = [...room.exits, fromexit._key];
            mu.entities.update(room._key, room);
            mu.msg.send(
              socket,
              `%chDone.%cn Exit %ch${
                fromexit.name.split(";")[0]
              }%cn opened to room %ch${curRoom.name}%cn.`
            );
          }
        } else {
          mu.msg.send(socket, "Permission denied.");
        }
      } catch (error) {
        console.error(error);
      }
    }
  });
};
