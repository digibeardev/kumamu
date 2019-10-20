import { readFileSync } from "fs";
import { resolve } from "path";
const toml = require("toml");

const file = readFileSync(resolve(__dirname, "../data/config.toml"), {
  encoding: "utf-8"
});
const data = toml.parse(file);

export default data;
