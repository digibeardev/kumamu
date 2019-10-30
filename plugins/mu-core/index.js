module.exports = async mu => {
  const { getFiles } = require(mu.basePath + "/utils/utilities");
  const { resolve } = require("path");

  //grab and run the files within the lib directory.
  await getFiles(resolve(__dirname, "lib"), async (dirent, path) => {
    // require the individual files from the `/lib/` directory.
    await require(path + dirent.name)(mu);
  });
};
