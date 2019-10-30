const app = require("./src/mu");

(async () => {
  await app.init();
})().catch(err => {
  return console.error(err.stack);
});
