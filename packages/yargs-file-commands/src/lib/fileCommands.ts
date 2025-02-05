import { buildSegmentTree, createCommand } from './buildSegmentTree.js';
import type { Command } from './Command.js';
import { importCommandFromFile } from './importCommand.js';
import { scanDirectory } from './scanDirectory.js';
import { segmentPath } from './segmentPath.js';

/**
 * Configuration options for file-based command generation
 * @interface FileCommandsOptions
 */
export type FileCommandsOptions = {
  /** Array of directory paths to scan for command files */
  commandDirs: string[];
  /** File extensions to consider when scanning for command files */
  extensions?: string[];
  /** Regular expressions for patterns to ignore when scanning directories */
  ignorePatterns?: RegExp[];
  /** Logging verbosity level */
  logLevel?: 'info' | 'debug';
};

/**
 * Default configuration options for file-based commands
 * @constant
 * @type {Partial<FileCommandsOptions>}
 */
export const DefaultFileCommandsOptions: Partial<FileCommandsOptions> = {
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
  logLevel: 'info'
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
  const fullOptions = { ...DefaultFileCommandsOptions, ...options };

  const commands: Command[] = [];

  await Promise.all(
    options.commandDirs.map(async (commandDir) => {
      const filePaths = await scanDirectory(commandDir, fullOptions);

      const rootDirCommands = await Promise.all(
        filePaths.map(async (filePath) => {
          const segments = segmentPath(filePath, commandDir);

          return {
            fullPath: filePath,
            segments: segmentPath(filePath, commandDir),
            commandModule: await importCommandFromFile(
              filePath,
              segments[segments.length - 1]!
            )
          };
        })
      );
      commands.push(...rootDirCommands);
    })
  );

  const commandRootNodes = buildSegmentTree(commands);

  const rootCommands = commandRootNodes.map((node) => createCommand(node));

  return rootCommands;
};
