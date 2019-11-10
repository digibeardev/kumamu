const { getEntities } = require("../utils/utilities");

module.exports = mu => {
  const nameFormat = async ({ enactor, target, scope }) => {
    if (await mu.flags.canEdit(enactor, target)) {
      if (
        mu.attrs.has(target, `nameformat`) &&
        enactor.data.base.location === target._key
      ) {
        let text = await mu.attrs.get(target, `nameformat`);
        for (const param in scope) {
          text = text.replace(param, scope[param], "g");
        }
        return await mu.parser.run(enactor, text, scope);
      } else {
        return `${mu.flags.name(enactor, target) +
          (await mu.flags.flagCodes(target))}`;
      }
    } else {
      return `${mu.flags.name(enactor, target)}`;
    }
  };

  const descFormat = async ({ enactor, target, scope }) => {
    if (await mu.flags.canEdit(enactor, target)) {
      if (
        mu.attrs.has(target, `descformat`) &&
        enactor.data.base.location === target._key
      ) {
        let text = await mu.attrs.get(target, `descformat`);
        for (const param in scope) {
          text = text.replace(param, scope[param], "g");
        }
        return await mu.parser.run(enactor, text, scope);
      } else {
        return `${mu.flags.name(enactor, target) +
          (await mu.flags.flagCodes(target))}`;
      }
    } else {
      return `${mu.flags.name(enactor, target)}`;
    }
  };

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
    run: async (socket, data, scope = {}) => {
      const { enactor, target } = await getEntities(socket, data[1]);
      const desc = await nameFormat({
        enactor,
        target,
        scope: { ...scope, ...{ "%0": await mu.flags.name(enactor, target) } }
      });

      mu.msg.send(socket, desc);
    }
  });
};
