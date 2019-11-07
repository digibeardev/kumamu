const { getEntities } = require("../utils/utilities");

module.exports = mu => {
  let output = "";

  /**
   * Display an entity name, based on the permissions of the looker.
   * @param {*} enactor The entity triggering the command
   * @param {*} target The subject of the command.
   */
  const name = async (enactor, target) =>
    (await mu.flags.canEdit(enactor, target))
      ? mu.attrs.has(target, "nameformat")
        ? await target.attr.get(target, "nameformat")
        : `${target.name + (await mu.flags.flagCodes(target))}`
      : `${target.name}`;

  /**
   *
   * @param {*} socket
   * @param {*} data
   */
  const getEntities = async (socket, data) => {
    const enactor = await mu.entities.get(socket._key);
    const currLoc = await mu.entities.get(enactor.data.base.location);
    const name = data ? data.trim().toLowerCase() || "here" : "here";
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
    name: "look",
    pattern: /^(?:l|l[ook]+?)(\s+?.*)?/i,
    flags: "connected",
    run: async (socket, data) => {
      const { enactor, target } = await getEntities(socket, data[1]);
      const desc = `${await name(enactor, target)}`;

      mu.msg.send(socket, desc);
    }
  });
};
