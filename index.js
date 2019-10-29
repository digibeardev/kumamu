const app = require("./src/mu");

(async () => {
  await app.init();
  const results = await app.ecs.entity.create("foobar", "player");
  await app.ecs.components.add(results._key, "login");
  await app.ecs.components.add(results._key, "contents");
})().catch(err => {
  return console.error(err);
});
