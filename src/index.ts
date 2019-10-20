import app from "./classes/engine";
import parser from "./api/parser";
import txt from "./api/txt";

(async () => {
  await app.start();
  console.log(await parser.evaluate("2", parser.parse("[add(1,2)]"), {}));
  console.log(txt.get("connect"));
})();
