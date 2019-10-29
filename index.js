const app = require("./src/mu");

(async () => {
  await app.init();
  const results = await app.ecs.entity.create("foobar", "player");
  await app.ecs.components.add(results._key, "base");
  await app.ecs.components.add(results._key, "player");
})().catch(err => {
  return console.error(err);
});
