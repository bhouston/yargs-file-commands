import path from 'node:path';

import type { CommandModule } from 'yargs';

import { buildSegmentTree, createCommand, logCommandTree } from './buildSegmentTree.js';
import type { Command } from './Command.js';
import { importCommandFromFile } from './importCommand.js';
import { type ScanDirectoryOptions, scanDirectory } from './scanDirectory.js';
import { segmentPath } from './segmentPath.js';
import { validatePositionals } from './validatePositionals.js';

export type { ScanDirectoryOptions } from './scanDirectory.js';

/**
 * Configuration options for file-based command generation.
 */
export type FileCommandsOptions = ScanDirectoryOptions & {
  /** Absolute directory paths to scan. Later directories override matching commands in earlier ones. */
  commandDirs: string[];
  /** Validate builder positionals against the command string as modules load. Defaults to false; use validateCommands in tests for a full-tree check. */
  validation?: boolean;
  /** Message used by every group when run without a subcommand. Defaults to `You must specify a <group> subcommand` with the group's name. */
  demandCommandMessage?: string;
};

/**
 * The defaults {@link fileCommands} and {@link validateCommands} apply to options you leave out.
 * Spread it to build on the defaults, for example to keep the default `ignorePatterns` when adding one.
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

  const commands = directoryResults.flatMap(({ commandDir, filePaths }) => {
    // Two files in one directory mapping to the same command is ambiguous; across
    // directories it is an overlay, resolved by buildSegmentTree (later wins).
    const seen = new Map<string, string>();
    return filePaths.map((filePath): Command => {
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

      const key = segments.join(' ');
      const other = seen.get(key);
      if (other !== undefined) {
        throw new Error(`Duplicate command "${key}": ${other} and ${filePath} map to the same command`);
      }
      seen.set(key, filePath);

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
    });
  });

  // check if no commands were found
  if (commands.length === 0) {
    throw new Error(`No commands found in specified directories: ${fullOptions.commandDirs.join(', ')}`);
  }

  return commands;
};

/**
 * Builds a Yargs command tree from the files under `commandDirs`.
 *
 * Directories and dotted file names define nested commands, and a `command` file names its
 * directory's group. Only root-level command modules are imported up front; each group
 * imports its own commands when Yargs enters it, so an invocation only loads the modules
 * along the command path it uses. Later directories override matching commands in earlier ones.
 *
 * @param options - Directories to scan and how to scan them.
 * @returns The root-level commands, each with its nested subcommands, ready to pass to `yargs.command()`.
 * @throws If `commandDirs` is empty or contains a relative path, an extension lacks its leading dot,
 * no commands are found, or two files in one directory map to the same command.
 * @example
 * ```typescript
 * await yargs(hideBin(process.argv))
 *   .command(await fileCommands({ commandDirs: [path.join(import.meta.dirname, 'commands')] }))
 *   .demandCommand(1)
 *   .help()
 *   .parseAsync();
 * ```
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
 * Imports every command module under `commandDirs` and validates its positional arguments and
 * group definitions without running any handler. Intended for a CLI's unit tests, so the check
 * costs nothing at runtime. Module-level code and builder functions do run.
 *
 * @param options - The same options you pass to {@link fileCommands}; `validation` is always enabled.
 * @returns A promise that resolves when every command is valid.
 * @throws On the first problem found, including a module that fails to import.
 * @example
 * ```typescript
 * it('validates the command tree', async () => {
 *   await validateCommands({ commandDirs: [path.join(import.meta.dirname, 'commands')] });
 * });
 * ```
 */
export const validateCommands = async (options: FileCommandsOptions): Promise<void> => {
  const commands = await scanCommands({ ...options, validation: true });
  // createCommand imports each command (and checks each group definition) one level at a time
  const loadAll = async (nodes: ReturnType<typeof buildSegmentTree>): Promise<void> => {
    await Promise.all(
      nodes.map(async (node) => {
        await createCommand(node, options);
        if (node.type === 'internal') {
          await loadAll(node.children);
        }
      }),
    );
  };
  await loadAll(buildSegmentTree(commands));
};
