import { readdir, stat } from 'node:fs/promises';
import path, { join } from 'node:path';

/**
 * Options for directory scanning
 * @interface ScanDirectoryOptions
 */
export interface ScanDirectoryOptions {
  /** File extensions to consider when scanning for command files */
  extensions?: string[];
  /** Regular expressions for patterns to ignore when scanning directories */
  ignorePatterns?: RegExp[];
  /** Logging verbosity level */
  logLevel?: 'info' | 'debug';
  /** Prefix for log messages */
  logPrefix?: string;
}

/**
 * System-level ignore patterns that ALWAYS apply regardless of user configuration.
 * These patterns match system files and hidden files that should never be treated as command files.
 * This ensures compatibility across macOS (.DS_Store), Linux, and Windows.
 */
const SYSTEM_IGNORE_PATTERNS: readonly RegExp[] = [
  /^[.].*/, // Any file or directory starting with a dot (hidden files)
] as const;

/**
 * Default ignore patterns for directory scanning (optional, can be overridden).
 * These patterns match common files that should not be treated as command files.
 * System ignore patterns are always applied in addition to these defaults.
 */
const DEFAULT_IGNORE_PATTERNS: RegExp[] = [
  /\.(?:test|spec)\.[jt]s$/, // Test files
  /__(?:test|spec)__/, // Test directories
  /\.d\.ts$/, // TypeScript declaration files
];

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
  options: ScanDirectoryOptions = {},
): Promise<string[]> => {
  const {
    ignorePatterns = DEFAULT_IGNORE_PATTERNS,
    extensions = ['.js', '.ts'],
    logLevel = 'info',
    logPrefix = '',
  } = options;

  // Always merge system ignore patterns with user-provided patterns
  // System patterns are checked first to ensure system files are never included
  const allIgnorePatterns = [...SYSTEM_IGNORE_PATTERNS, ...ignorePatterns];

  try {
    const entries = await readdir(dirPath);

    const commandPaths: string[] = [];
    for (const entry of entries) {
      const fullPath = join(dirPath, entry);

      const localPath = fullPath.replace(commandDir, '');

      // Apply ignore patterns - system patterns are always checked first
      const matchingPatterns = allIgnorePatterns.filter((pattern) => pattern.test(localPath));
      const shouldIgnore = matchingPatterns.length > 0;
      if (shouldIgnore) {
        if (logLevel === 'debug') {
          // Check if any matching pattern is a system pattern
          const matchingSystemPatterns = SYSTEM_IGNORE_PATTERNS.filter((pattern) => pattern.test(localPath));
          const isSystemPattern = matchingSystemPatterns.length > 0;
          const patternType = isSystemPattern ? 'system ignore pattern' : 'ignorePattern';
          console.debug(
            `${logPrefix}${localPath} - ignoring because it matches ${patternType}: ${matchingPatterns.map((p) => p.toString()).join(', ')}`,
          );
        }
        continue;
      }

      const stats = await stat(fullPath);

      if (stats.isDirectory()) {
        if (logLevel === 'debug') {
          console.debug(`${logPrefix}${localPath} - directory, scanning for commands:`);
        }
        commandPaths.push(
          ...(await scanDirectory(fullPath, commandDir, {
            ...options,
            logPrefix: `${logPrefix}  `,
          })),
        );
        continue;
      }
      const extension = path.extname(fullPath);
      if (!extensions.includes(extension)) {
        if (logLevel === 'debug') {
          console.debug(
            `${logPrefix}${localPath} - ignoring as its extension, ${extension}, doesn't match required extension: ${extensions.join(
              ', ',
            )}`,
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(
      `${logPrefix}Failed to scan directory ${dirPath}: ${errorMessage}. Ensure the directory exists and is accessible.`,
    );
  }
};
