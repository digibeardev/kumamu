module.exports = mu => {
  // Get target and enactor information.  Helper function.
  const getEntities = async (socket, data) => {
    const enactor = await mu.entities.get(socket._key);
    const currLoc = await mu.entities.get(enactor.data.base.location);
    const name = data.trim().toLowerCase();
    let target;
    if (name === "me") {
      target = enactor;
    } else if (name === "here") {
      target = currLoc;
    } else {
      target = await mu.entities.all(entity =>
        entity._key === name ||
        entity.name.toLowerCase() === name ||
        entity.data.player
          ? entity.data.player.alias.toLowerCase() === name
          : false
      );

      // If there are entities in the array, get the first instance.
      if (target.length > 0) {
        target = target[0];
      }
    }

    return { enactor, target };
  };

  mu.addCommand({
    name: "@set",
    pattern: /^@?set\s+?(.*)\s?=\s?(.*)/i,
    flags: "connected",
    run: async (socket, data) => {
      // Steps.  This needs to be broken down.
      // Get the enactor & target

      // TODO:  Add logic for handling setting/copying attributes.
      const flags = data[2].split(" ");
      let not = "";
      const { enactor, target } = await getEntities(socket, data);
      const edit = await mu.flags.canEdit(enactor, target);
      if (target && edit) {
        for (let flg of flags) {
          if (mu.flags.exists(flg)) {
            if (flg[0] === "!") {
              not == "!";
              flg = flg.slice(1);
            }

            // Set the flag, then let the enactor know that flag has been
            // added or removed on the target.
            const results = await mu.flags.set(target, not + flag);
            if (results && edit) {
              mu.msg.send(
                socket,
                `%chDone%cn. Flag '%ch${flag}%cn' has been ${
                  not ? "removed" : "set"
                } on ${target.name}.`
              );
            }
          } else if (!edit) {
            mu.msg.send(socket, "Permission denied.");
          } else {
            mu.msg.send(
              socket,
              `Flag '%ch${flg.tolowerCase()}%cn' doesn't exist.`
            );
          }
        }
      }
    }
  });
  // TODO:  Update attributes to handle locks, flags, and nesting
  mu.addCommand({
    name: "&",
    pattern: /^&(\w+)\s?(.*)\s?=\s?(.*)?/i,
    flags: "connected",
    run: async (socket, data) => {
      const name = data[1].trim();
      const value = data[3] ? data[3].trim() : null;
      const { enactor, target } = await getEntities(socket, data[2]);
      const edit = await mu.flags.canEdit(enactor, target);
      if (target && edit) {
        const results = await mu.attrs.set({
          target,
          value,
          setBy: enactor._key,
          name
        });
        if (results._key) {
          mu.msg.send(
            socket,
            `%chDone.%cn Attribute '%ch${name.toUpperCase()}%cn' ${
              value ? "set on" : "removed from"
            } %ch${target.name}%cn`
          );
        } else if (!edit) {
          mu.msg.send(socket, "Permission denied.");
        }
      } else {
        mu.msg.send(
          socket,
          `Error setting an attribute on %ch${target.name}%cn.`
        );
      }
    }
  });
};
