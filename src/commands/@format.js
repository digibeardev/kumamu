module.exports = mu => {
  mu.addCommand({
    name: "@nameformat",
    flags: "connected",
    pattern: /^@?nameformat\s+?(.*)/i,
    run: async (en, match, scope) => {}
  });
};
