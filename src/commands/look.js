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

  // Get target and enactor information.  Helper function.
  const getEntities = async (socket, data) => {
    const enactor = await mu.entities.get(socket._key);
    const currLoc = await mu.entities.get(enactor.data.base.location);
    const name = data[1] ? data[1].trim().toLowerCase() || "here" : "here";
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
          : mu.msg.send(socket, "I can't find what you're looking for.")
      );

      // If there are entities in the array, get the first instance.
      if (target.length > 0) {
        target = target[0];
      }
    }

    return { enactor, target };
  };

  mu.addCommand({
    name: "look",
    pattern: /^(?:l|l[ook]+?)(\s+?.*)?/i,
    run: async (socket, data) => {
      const { enactor, target } = await getEntities(socket, data);
      const desc = `${await name(enactor, target)}`;

      mu.msg.send(socket, desc);
    }
  });
};
