module.exports = mu => {
  mu.addCommand({
    name: "think",
    pattern: /^think\s+?(.*)/i,
    flags: "connected",
    run: async (socket, match, scope) => {
      const en = await mu.entities.get(socket._key);
      mu.msg.send(socket, await mu.parser.string(en, match[1], scope));
    }
  });
};
