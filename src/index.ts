import app from "./classes/engine";

(async () => {
  await app.start();
  console.log(
    await app.parser.evaluate("2", app.parser.parse("[add(1,2)]"), {})
  );
})();
