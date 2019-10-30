const { readdirSync, Dirent } = require("fs");
const { join } = require("path");
/**
 * Higher order function to find files and folders in a directory. and perform
 * an action on them.  Async friendly.
 * @param {string} path The directory to search.
 * @param {(dirent: Dirent) => void} func a function to
 * perform on each file or folder within path.
 *
 * @example
 * getfiles(resolve(__dirname, "./api"), (dirent, path) => {
 *    let mod = require(path + dirent.name);
 *    console.log(`API: '${file.split('.')[0]}' loaded.`);
 * });
 *
 */
module.exports.getFiles = async (path, func) => {
  const dir = readdirSync(path, {
    encoding: "utf-8",
    withFileTypes: true
  });
  for (const dirent of dir) {
    await func(dirent, join(path, "/"));
  }
};
