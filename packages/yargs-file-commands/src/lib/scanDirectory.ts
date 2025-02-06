import { readdir, stat } from 'fs/promises';
import path, { join } from 'path';

/**
 * Options for directory scanning
 * @interface ScanDirectoryOptions
 */
export interface ScanDirectoryOptions {
  /** Regular expressions for patterns to ignore */
  ignorePatterns?: RegExp[];
  /** File extensions to include in the scan */
  extensions?: string[];
  logLevel?: 'info' | 'debug';
  logPrefix?: string;
}

/**
 * Recursively scans a directory for command files
 * @async
 * @param {string} dirPath - The directory path to scan
 * @param {ScanDirectoryOptions} options - Scanning configuration options
 * @returns {Promise<string[]>} Array of full paths to command files
 *
 * @description
 * Performs a recursive directory scan, filtering files based on:
 * - Ignore patterns (skips matching files/directories)
 * - File extensions (only includes matching files)
 * The scan is performed in parallel for better performance.
 */
export const scanDirectory = async (
  dirPath: string,
  commandDir: string,
  options: ScanDirectoryOptions = {}
): Promise<string[]> => {
  const {
    ignorePatterns = [],
    extensions = ['.js', '.ts'],
    logLevel = 'info',
    logPrefix = ''
  } = options;

  try {
    const entries = await readdir(dirPath);

    const commandPaths: string[] = [];
    for (const entry of entries) {
      const fullPath = join(dirPath, entry);

      const localPath = fullPath.replace(commandDir, '');

      // apply ignore pattern and early return if matched
      const shouldIgnore = ignorePatterns.some((pattern) =>
        pattern.test(localPath)
      );
      if (shouldIgnore) {
        if (logLevel === 'debug') {
          console.debug(
            `${logPrefix}${localPath} - ignoring because it matches ignorePattern: ${ignorePatterns
              .filter((pattern) => pattern.test(localPath))
              .join(', ')}`
          );
        }
        continue;
      }

      const stats = await stat(fullPath);

      if (stats.isDirectory()) {
        if (logLevel === 'debug') {
          console.debug(
            `${logPrefix}${localPath} - directory, scanning for commands:`
          );
        }
        commandPaths.push(
          ...(await scanDirectory(fullPath, commandDir, {
            ...options,
            logPrefix: `${logPrefix}  `
          }))
        );
        continue;
      }
      const extension = path.extname(fullPath);
      if (!extensions.includes(extension)) {
        if (logLevel === 'debug') {
          console.debug(
            `${logPrefix}${localPath} - ignoring as its extension, ${extension}, doesn't match required extension: ${extensions.join(
              ', '
            )}`
          );
        }
        continue;
      }

      if (logLevel === 'debug') {
        console.debug(`${logPrefix}${localPath} - possible command file`);
      }

      commandPaths.push(fullPath);
    }

    return commandPaths;
  } catch (error) {
    throw new Error(
      `${logPrefix}Failed to scan directory ${dirPath}: ${error}`
    );
  }
};
