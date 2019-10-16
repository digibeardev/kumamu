import { readdirSync } from "fs";
import { resolve } from "path";

/**
 * Pull all directories in a file listing
 * @param source The source of the directory to navigate.
 */
export const getDirectories = (source: string) =>
  readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

/**
 * Higher order function to find files in a directory and perform
 * an action on them.  Async friendly.
 * @param path The directory to search.
 * @param func what to complete on each item of the resulting list
 *
 * @example
 * getfiles("../api/", async (path, file) => {
 *    let mod = await import(path + file);
 *    mod.default();
 *    console.log(`API: '${file.split('.')[0]}' loaded.`);
 * });
 *
 */
export const getFiles = async (
  path: string,
  func: (path: string, item: string) => void
) => {
  const dir = readdirSync(resolve(__dirname, path), "utf-8");
  for (const file of dir.filter(item => !item.match(/.*map$/))) {
    await func(path, file);
  }
};
