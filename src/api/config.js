const { readFileSync } = require("fs");
const { resolve } = require("path");
const toml = require("toml");

const file = readFileSync(resolve(__dirname, "../../data/config.toml"), {
  encoding: "utf-8"
});

module.exports = toml.parse(file);
