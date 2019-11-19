const { getFiles } = require("../../utils/utilities");
const { resolve } = require("path");

module.exports = async mu => {
  mu["db"] = require("./db");
  await mu.db.init();
  mu["entities"] = require("./entities");
  await mu.entities.init();
  await getFiles(resolve(__dirname, "./lib"), async (dirent, path) => {
    const name = dirent.name.split(".")[0];
    mu[name] = require(path + dirent.name);
    await mu[name].init();
  });
};
