import path from 'node:path';

import type { CommandModule } from 'yargs';

import { buildSegmentTree, createCommand, logCommandTree } from './buildSegmentTree.js';
import type { Command } from './Command.js';
import { importCommandFromFile } from './importCommand.js';
import { type ScanDirectoryOptions, scanDirectory } from './scanDirectory.js';
import { segmentPath } from './segmentPath.js';
import { validatePositionals } from './validatePositionals.js';

/**
 * Configuration options for file-based command generation
 * @interface FileCommandsOptions
 */
export type FileCommandsOptions = ScanDirectoryOptions & {
  /** Array of directory paths to scan for command files */
  commandDirs: string[];
  /** Whether to validate that positional arguments in builder match command string */
  validation?: boolean;
};

/**
 * Default configuration options for file-based commands
 * @constant
 * @type {Partial<FileCommandsOptions>}
 */
export const DefaultFileCommandsOptions: Required<FileCommandsOptions> = {
  /** Default directories to scan for command files */
  commandDirs: [],

  /** Default file extensions to process */
  extensions: ['.js', '.ts'],

  /** Default patterns to ignore when scanning directories.
   * Note: System files (files starting with '.') are ALWAYS ignored regardless of these patterns.
   * These defaults can be overridden by providing your own ignorePatterns.
   */
  ignorePatterns: [
    /\.(?:test|spec)\.[jt]s$/, // Test files
    /__(?:test|spec)__/, // Test directories
    /\.d\.ts$/, // TypeScript declaration files
  ],

  /** Default logging level */
  logLevel: 'info',

  /** Default log prefix */
  logPrefix: '  ',

  /** Default validation setting - enabled by default */
  validation: true,
};

/**
 * Generates a command tree structure from files in specified directories
 * @async
 * @param {FileCommandsOptions} options - Configuration options for command generation
 * @returns {Promise<Command[]>} Array of root-level commands with their nested subcommands
 *
 * @description
 * This function scans the specified directories for command files and builds a hierarchical
 * command structure based on the file system layout. It processes files in parallel for better
 * performance and supports nested commands through directory structure.
 *
 * The function will:
 * 1. Scan all specified command directories
 * 2. Process found files to extract command information
 * 3. Build a tree structure based on file paths
 * 4. Convert the tree into a command hierarchy
 */
export const fileCommands = async (options: FileCommandsOptions): Promise<CommandModule[]> => {
  const fullOptions: Required<FileCommandsOptions> = {
    ...DefaultFileCommandsOptions,
    ...options,
  };

  // validate extensions have dots in them
  if (fullOptions.extensions.some((ext) => !ext.startsWith('.'))) {
    throw new Error(`Invalid extensions provided, must start with a dot: ${fullOptions.extensions.join(', ')}`);
  }
  // check for empty list of directories to scan
  if (fullOptions.commandDirs.length === 0) {
    throw new Error('No command directories provided');
  }

  // throw if some command directories are not absolute, first filter to find non-absolute an then throw, listing those that are not absolute
  const nonAbsoluteDirs = fullOptions.commandDirs.filter((dir) => !path.isAbsolute(dir));
  if (nonAbsoluteDirs.length > 0) {
    throw new Error(`Command directories must be absolute paths: ${nonAbsoluteDirs.join(', ')}`);
  }

  const commands: Command[] = [];

  // Process all command directories in parallel
  const directoryResults = await Promise.all(
    fullOptions.commandDirs.map(async (commandDir) => {
      const fullPath = path.resolve(commandDir);
      if (fullOptions.logLevel === 'debug') {
        console.debug(`Scanning directory for commands: ${fullPath}`);
      }

      const filePaths = await scanDirectory(commandDir, commandDir, fullOptions);
      return { commandDir, filePaths };
    }),
  );

  if (fullOptions.logLevel === 'debug') {
    console.debug(`Importing found commands:`);
  }

  // Process all files in parallel
  const fileResults = await Promise.all(
    directoryResults.flatMap(({ commandDir, filePaths }) =>
      filePaths.map(async (filePath) => {
        const localPath = path.relative(commandDir, filePath);
        const segments = segmentPath(filePath, commandDir);

        // Remove extension (last segment) if there are multiple segments
        // If there's only one segment, it means the file has no name (e.g., .js)
        if (segments.length > 1) {
          segments.pop(); // remove extension.
        } else if (segments.length === 0) {
          throw new Error(`No segments found for file: ${filePath}`);
        }

        if (fullOptions.logLevel === 'debug') {
          console.debug(`  ${localPath} - importing command module`);
        }

        const lastSegment = segments[segments.length - 1];
        if (lastSegment === undefined) {
          throw new Error(`No segments found for file: ${filePath}`);
        }

        const commandModule = await importCommandFromFile(filePath, lastSegment, fullOptions);

        // Validate positional arguments if validation is enabled
        if (fullOptions.validation) {
          await validatePositionals(commandModule, filePath);
        }

        return {
          fullPath: filePath,
          segments,
          commandModule,
        };
      }),
    ),
  );

  commands.push(...fileResults);

  // check if no commands were found
  if (commands.length === 0) {
    throw new Error(`No commands found in specified directories: ${fullOptions.commandDirs.join(', ')}`);
  }

  const commandRootNodes = buildSegmentTree(commands);

  if (fullOptions.logLevel === 'debug') {
    console.debug('Command tree structure:');
    logCommandTree(commandRootNodes, 1);
  }

  const rootCommands = commandRootNodes.map((node) => createCommand(node));

  return rootCommands;
};
