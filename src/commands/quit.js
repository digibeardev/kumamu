module.exports = mu => {
  mu.addCommand({
    name: "quit",
    pattern: /^quit/i,
    run: async (socket, data) => {
      if (socket._key) {
        const en = await mu.entities.get(socket._key);
        mu.flags.set(en, "!connected");
        mu.emitter.emit("disconnect", en);
      }
      socket.end(`*** DISCONNECTED ***\r\n`);
    }
  });
};
