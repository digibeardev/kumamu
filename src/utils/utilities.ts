import { readdirSync } from "fs";

/**
 * Pull all directories in a file listing
 * @param source The source of the directory to navigate.
 */
export const getDirectories = (source: string) =>
  readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

/**
 * Get all files from a given directory.
 * @param source The source directory to browse for files.
 */
export const getFiles = (source: string) =>
  readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isFile())
    .map(dirent => dirent.name);
