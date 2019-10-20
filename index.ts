import app from "./src/classes/engine";
import parser from "./src/api/parser";

(async () => {
  await app.start();
  console.log(await parser.evaluate("2", parser.parse("[add(1,2)]"), {}));
})();
