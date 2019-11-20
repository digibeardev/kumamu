const { readFileSync } = require("fs");
const { resolve } = require("path");
const toml = require("toml");

module.exports = mu => {
  const file = readFileSync(resolve(__dirname, "../../../data/config.toml"), {
    encoding: "utf-8"
  });

  return toml.parse(file);
};
