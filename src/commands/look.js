const { getEntities } = require("../utils/utilities");

module.exports = mu => {
  const nameFormat = async ({ enactor, target, scope }) => {
    if (await mu.flags.canEdit(enactor, target)) {
      if (
        mu.attrs.has(target, `nameformat`) &&
        enactor.location === target._key
      ) {
        let text = await mu.attrs.get(target, `nameformat`);
        for (const param in scope) {
          text = text.replace(param, scope[param], "g");
        }
        return await mu.parser.run(enactor, text, scope);
      } else {
        return `${await mu.flags.name(enactor, target)}`;
      }
    } else {
      return `${await mu.flags.name(enactor, target)}`;
    }
  };

  const contents = async (enactor, target, scope) => {
    let text = "";
    const entities = await mu.entities.all(entity => {
      if (entity.location === target._key && entity.type !== "room") {
        if (entity.type === "player") {
          if (mu.flags.hasFlags(entity, "connected")) {
            return entity;
          }
        } else {
          return entity;
        }
      }
    });

    if (mu.attrs.has(target, "conformat")) {
      text = await mu.parser.string(
        enactor,
        mu.attrs.get(target, "conformat"),
        {
          ...scope,
          ...{ "%0": entities }
        }
      );
    } else {
      text = target.type === "room" ? "Contents:" : "Carrying";
      for (entity of entities) {
        text += "\n" + (await mu.flags.name(enactor, entity));
      }
    }

    return text;
  };

  /**
   *
   * @param {*} socket
   * @param {*} data
   */
  const getEntities = async (socket, data) => {
    const enactor = await mu.entities.get(socket._key);
    const currLoc = await mu.entities.get(enactor.location);
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
              ? entity.alias.toLowerCase() === name
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

      // Name format
      let desc =
        (await nameFormat({
          enactor,
          target,
          scope: { ...scope, ...{ "%0": await mu.flags.name(enactor, target) } }
        })) + "\n";

      // TODO: Add DescFormat
      desc += mu.attrs.has(target, "desc")
        ? (await mu.attrs.get(target, "description")) + "\n"
        : "You see nothing special.\n";

      desc += await contents(enactor, target, scope);

      mu.msg.send(socket, desc);
    }
  });
};
