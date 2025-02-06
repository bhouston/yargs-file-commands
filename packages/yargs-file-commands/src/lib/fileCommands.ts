import path from 'path';

import {
  buildSegmentTree,
  createCommand,
  logCommandTree
} from './buildSegmentTree.js';
import type { Command } from './Command.js';
import { importCommandFromFile } from './importCommand.js';
import { scanDirectory, type ScanDirectoryOptions } from './scanDirectory.js';
import { segmentPath } from './segmentPath.js';

/**
 * Configuration options for file-based command generation
 * @interface FileCommandsOptions
 */
export type FileCommandsOptions = ScanDirectoryOptions & {
  /** Array of directory paths to scan for command files */
  commandDirs: string[];
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

  /** Default patterns to ignore when scanning directories */
  ignorePatterns: [
    /^[.|_].*/, // Hidden files and underscore files
    /\.(?:test|spec)\.[jt]s$/, // Test files
    /__(?:test|spec)__/, // Test directories
    /\.d\.ts$/ // TypeScript declaration files
  ],

  /** Default logging level */
  logLevel: 'info',

  /** Default log prefix */
  logPrefix: '  '
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
export const fileCommands = async (options: FileCommandsOptions) => {
  const fullOptions: Required<FileCommandsOptions> = {
    ...DefaultFileCommandsOptions,
    ...options
  };

  // validate extensions have dots in them
  if (fullOptions.extensions.some((ext) => !ext.startsWith('.'))) {
    throw new Error(
      `Invalid extensions provided, must start with a dot: ${fullOptions.extensions.join(
        ', '
      )}`
    );
  }
  // check for empty list of directories to scan
  if (fullOptions.commandDirs.length === 0) {
    throw new Error('No command directories provided');
  }

  const commands: Command[] = [];

  for (const commandDir of fullOptions.commandDirs) {
    const fullPath = path.resolve(commandDir);
    console.debug(`Scanning directory for commands: ${fullPath}`);

    const filePaths = await scanDirectory(commandDir, commandDir, fullOptions);

    for (const filePath of filePaths) {
      const segments = segmentPath(filePath, commandDir);
      segments.pop(); // remove extension.

      commands.push({
        fullPath: filePath,
        segments,
        commandModule: await importCommandFromFile(
          filePath,
          segments[segments.length - 1]!,
          fullOptions
        )
      });
    }
  }

  // check if no commands were found
  if (commands.length === 0) {
    throw new Error(
      `No commands found in specified directories: ${fullOptions.commandDirs.join(
        ', '
      )}`
    );
  }

  const commandRootNodes = buildSegmentTree(commands);

  if (fullOptions.logLevel === 'debug') {
    console.debug('Command tree structure:');
    logCommandTree(commandRootNodes, 1);
  }

  const rootCommands = commandRootNodes.map((node) => createCommand(node));

  return rootCommands;
};
