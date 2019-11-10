module.exports = mu => {
  /**
   * Helper function to get the entities of the command
   * @param {*} socket The socket that invoked the command.
   * @param {*} ref The reference to the object that is the target
   * of the action.
   */
  const getEntities = async (socket, ref) => {
    const enactor = await mu.entities.get(socket._key);
    const currLoc = await mu.entities.get(enactor.data.base.location);
    const name = ref ? ref.trim().toLowerCase() || "here" : "here";
    const target =
      name === "me"
        ? enactor
        : name === "here"
        ? currLoc
        : await mu.entities.all(entity =>
            entity._key === name ||
            entity.name.toLowerCase() === name ||
            entity.data.player
              ? entity.data.player.alias.toLowerCase() === name
              : mu.msg.send(socket, "I can't find what you're looking for.")
          );

    return { enactor, target };
  };

  mu.addCommand({
    name: "@nameformat",
    flags: "connected",
    pattern: /^@?nameformat\s+?(.*)\s?=\s?(.*)?/i,
    run: async (socket, match, scope) => {
      const { enactor, target } = await getEntities(socket, match[1]);
      if (await mu.flags.canEdit(enactor, target)) {
        try {
          await mu.attrs.set({
            name: "nameformat",
            value: match[2],
            target: target,
            setBy: enactor._key
          });
          mu.msg.send(
            socket,
            `%ch>>%cn Done. %ch@descformat%cn ${
              match[2] ? "set on" : "removed from"
            } '%ch${target.name}%cn'.`
          );
        } catch (error) {
          console.log(error);
        }
      } else {
        mu.msg.send(socket, "Permission denied.");
      }
    }
  });
};
