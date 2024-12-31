import { readdir, stat } from 'fs/promises';
import path, { join } from 'path';

export interface ScanDirectoryOptions {
  ignorePatterns?: RegExp[];
  extensions?: string[];
}

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
