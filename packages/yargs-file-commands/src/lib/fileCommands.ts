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
  /** Message used by every group when run without a subcommand */
  demandCommandMessage?: string;
};

/**
 * Default configuration options for file-based commands
 * @constant
 * @type {Partial<FileCommandsOptions>}
 */
export const DefaultFileCommandsOptions: Required<Omit<FileCommandsOptions, 'demandCommandMessage'>> = {
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

  /** Positional validation is off at runtime; call validateCommands() from a test instead */
  validation: false,
};

/**
 * Scans `commandDirs` and returns every command file with a loader for its module.
 * Nothing is imported here.
 */
const scanCommands = async (options: FileCommandsOptions): Promise<Command[]> => {
  const fullOptions: Required<Omit<FileCommandsOptions, 'demandCommandMessage'>> = {
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

  const commands = directoryResults.flatMap(({ commandDir, filePaths }) =>
    filePaths.map((filePath): Command => {
      const localPath = path.relative(commandDir, filePath);
      const segments = segmentPath(filePath, commandDir);

      // Remove extension (last segment) if there are multiple segments
      // If there's only one segment, it means the file has no name (e.g., .js)
      if (segments.length > 1) {
        segments.pop(); // remove extension.
      } else if (segments.length === 0) {
        throw new Error(`No segments found for file: ${filePath}`);
      }

      const lastSegment = segments[segments.length - 1];
      if (lastSegment === undefined) {
        throw new Error(`No segments found for file: ${filePath}`);
      }

      return {
        fullPath: filePath,
        segments,
        load: async () => {
          if (fullOptions.logLevel === 'debug') {
            console.debug(`  ${localPath} - importing command module`);
          }

          const commandModule = await importCommandFromFile(filePath, lastSegment, fullOptions);

          // Validate positional arguments if validation is enabled
          if (fullOptions.validation) {
            await validatePositionals(commandModule, filePath);
          }

          return commandModule;
        },
      };
    }),
  );

  // check if no commands were found
  if (commands.length === 0) {
    throw new Error(`No commands found in specified directories: ${fullOptions.commandDirs.join(', ')}`);
  }

  return commands;
};

/**
 * Generates a command tree structure from files in specified directories
 * @async
 * @param {FileCommandsOptions} options - Configuration options for command generation
 * @returns {Promise<CommandModule[]>} Root-level commands with their nested subcommands
 *
 * @description
 * Scans the specified directories and builds a hierarchical command structure from the
 * file system layout. Only root-level command modules are imported up front; each group
 * imports its own commands when yargs enters it, so an invocation only loads the modules
 * along the command path it uses.
 */
export const fileCommands = async (options: FileCommandsOptions): Promise<CommandModule[]> => {
  const commands = await scanCommands(options);
  const commandRootNodes = buildSegmentTree(commands);

  if (options.logLevel === 'debug') {
    console.debug('Command tree structure:');
    logCommandTree(commandRootNodes, 1);
  }

  return Promise.all(commandRootNodes.map((node) => createCommand(node, options)));
};

/**
 * Imports every command module under `commandDirs` and validates its positional arguments,
 * throwing on the first problem, including a module that fails to import. Intended for a
 * CLI's unit tests, so the check doesn't cost anything at runtime.
 */
export const validateCommands = async (options: FileCommandsOptions): Promise<void> => {
  const commands = await scanCommands({ ...options, validation: true });
  await Promise.all(commands.map((command) => command.load()));
};
