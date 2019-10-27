const { readdirSync, Dirent } = require("fs");
const { resolve } = require("path");

/**
 * Higher order function to find files and folders in a directory. and perform
 * an action on them.  Async friendly.
 * @param {string} path The directory to search.
 * @param {(dirent: Dirent) => void} func a function to
 * perform on each file or folder within path.
 *
 * @example
 * getfiles("../api/", dirent => {
 *    let mod = require("../api/" + dirent.name);
 *    console.log(`API: '${file.split('.')[0]}' loaded.`);
 * });
 *
 */
module.exports.getFiles = async (path, func) => {
  const dir = readdirSync(resolve(__dirname, path), {
    encoding: "utf-8",
    withFileTypes: true
  });
  for (const dirent of dir) {
    await func(dirent);
  }
};
