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
  options: ScanDirectoryOptions = {}
): Promise<string[]> => {
  const { ignorePatterns = [], extensions = [] } = options;

  // Check if path should be ignored
  const shouldIgnore = ignorePatterns.some((pattern) => pattern.test(dirPath));
  if (shouldIgnore) {
    return [];
  }

  try {
    const entries = await readdir(dirPath);

    const nestedFilesPromises = entries.map(async (entry) => {
      // apply ignore pattern and early return if matched
      const shouldIgnore = ignorePatterns.some((pattern) =>
        pattern.test(entry)
      );
      if (shouldIgnore) {
        return [];
      }

      const fullPath = join(dirPath, entry);
      const stats = await stat(fullPath);

      if (stats.isDirectory()) {
        return scanDirectory(fullPath, options);
      }
      const extension = path.extname(fullPath);
      if (!extensions.includes(extension)) {
        return [];
      }

      return [fullPath];
    });

    const nestedFiles = await Promise.all(nestedFilesPromises);
    return nestedFiles.flat();
  } catch (error) {
    throw new Error(`Failed to scan directory ${dirPath}: ${error}`);
  }
};
