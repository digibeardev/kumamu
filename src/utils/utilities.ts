import { readdirSync, Dirent } from "fs";
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
 *    let mod = await import(path + file.name);
 *    mod.default();
 *    console.log(`API: '${file.split('.')[0]}' loaded.`);
 * });
 *
 */
export const getFiles = async (
  path: string,
  func: (path: string, file: Dirent) => void
) => {
  const dir = readdirSync(resolve(__dirname, path), {
    encoding: "utf-8",
    withFileTypes: true
  });
  for (const file of dir.filter(item => !item.name.match(/.*map$/))) {
    await func(path, file);
  }
};

/**
 * Load modules given a path.
 * @param path The path to the modules to load.
 */
export const getModules = async (
  path: string,
  fn?: (name: string, path: string, mod: any) => void
) => {
  await getFiles(path, async (modPath, file) => {
    let mod = await import(modPath + file.name);
    let modType = modPath.split("/").filter(Boolean);
    if (typeof mod.default === "function") {
      await mod.default();
    } else {
      await mod.default;
    }
    if (typeof fn === "function") await fn!(file.name, modPath, mod);

    console.log(
      `${modType.pop()!.toUpperCase()} >> Module: '${
        file.name.split(".")[0]
      }' loaded.`
    );
  });
};
