import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { ArgumentsCamelCase, CommandBuilder, CommandModule } from 'yargs';

/**
 * Represents command alias configuration
 * @type {readonly string[] | string | undefined}
 */
export type CommandAlias = readonly string[] | string | undefined;

/**
 * Represents command name configuration
 * @type {readonly string[] | string | undefined}
 */
export type CommandName = readonly string[] | string | undefined;

/**
 * Represents command deprecation configuration
 * @type {boolean | string | undefined}
 */
export type CommandDeprecated = boolean | string | undefined;

/**
 * Represents command description configuration
 * @type {string | false | undefined}
 */
export type CommandDescribe = string | false | undefined;

/**
 * Command handler function type
 * @type {Function}
 */
export type CommandHandler = (args: ArgumentsCamelCase<any>) => undefined | Promise<any>;

/**
 * Parameters for file commands configuration
 * @interface FileCommandsParams
 */
export interface FileCommandsParams {
  /** Root directory for command files */
  rootDir: string;
}

/**
 * Structure of a command module import with individual exports
 * @interface CommandImportModule
 */
export interface CommandImportModule {
  /** Command aliases */
  aliases?: CommandAlias;
  /** Command builder function */
  builder?: CommandBuilder;
  /** Command name */
  command?: CommandName;
  /** Deprecation status */
  deprecated?: CommandDeprecated;
  /** Command description */
  describe?: CommandDescribe;
  /** Command handler function */
  handler?: CommandHandler;
}

export interface ImportCommandOptions {
  logLevel?: 'info' | 'debug';
}

/**
 * Imports a command module from a file
 * @async
 * @param {string} filePath - Path to the command file
 * @param {string} name - Command name
 * @param {ImportCommandOptions} options - Import options
 * @returns {Promise<CommandModule>} Imported command module
 *
 * @description
 * Dynamically imports a command file and constructs a Yargs command module.
 * Supports two styles of command declaration:
 * 1. Single export of CommandModule named 'command'
 * 2. Individual exports of command parts (command, describe, alias, etc.)
 * If no handler is provided, creates a null implementation.
 */
export const importCommandFromFile = async (
  filePath: string,
  name: string,
  options: ImportCommandOptions,
): Promise<CommandModule> => {
  // Resolve to absolute path first
  const resolvedPath = path.resolve(filePath);

  // Ensure file exists using fs node library
  if (!fs.existsSync(resolvedPath)) {
    const originalPath = filePath !== resolvedPath ? ` (original: ${filePath})` : '';
    throw new Error(
      `Cannot import command from non-existent file path: ${resolvedPath}${originalPath}. ` +
        `Ensure the file exists and the path is correct. If using a relative path, consider using an absolute path or path.resolve().`,
    );
  }

  // Get the real (canonical) path to handle symlinks consistently
  // This ensures the path matches what pathToFileURL will resolve to
  const realPath = fs.realpathSync.native(resolvedPath);

  // Construct file URL using Node.js's pathToFileURL which properly handles
  // path normalization, special characters, and cross-platform compatibility
  // Use the real path to avoid symlink resolution mismatches
  const url = pathToFileURL(realPath).href;
  const { logLevel = 'info' } = options;

  // Import the module
  let imported;
  try {
    imported = await import(url);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to import command module from ${realPath}: ${errorMessage}. ` +
        `Ensure the file is a valid JavaScript/TypeScript module and the path is correct.`,
    );
  }

  // Check if this is the default command
  const isDefault = name === '$default';

  // First try to use the CommandModule export if it exists
  if ('command' in imported && typeof imported.command === 'object' && imported.command !== null) {
    const commandModule = imported.command as CommandModule;

    // Ensure the command property exists or use the filename
    if (!commandModule.command && !isDefault) {
      commandModule.command = name;
    } else if (isDefault && !commandModule.command) {
      commandModule.command = '$0';
    }

    if (logLevel === 'debug') {
      console.debug('Importing CommandModule from', realPath, 'as', name, 'with description', commandModule.describe);
    }

    // Return the command module directly without wrapping
    return {
      command: commandModule.command,
      describe: commandModule.describe,
      builder: commandModule.builder,
      handler: commandModule.handler,
      deprecated: commandModule.deprecated,
      aliases: commandModule.aliases,
    } satisfies CommandModule;
  }

  // Fall back to individual exports
  const handlerModule = imported as CommandImportModule;

  const command = {
    command: handlerModule.command ?? (isDefault ? '$0' : name),
    describe: handlerModule.describe,
    aliases: handlerModule.aliases,
    builder: handlerModule.builder,
    deprecated: handlerModule.deprecated,
    handler:
      handlerModule.handler ??
      (async (_args: ArgumentsCamelCase<any>) => {
        // null implementation
      }),
  } as CommandModule;

  // Validate exports
  const supportedNames = ['command', 'describe', 'alias', 'builder', 'deprecated', 'handler'];

  const module = imported as Record<string, any>;
  const unsupportedExports = Object.keys(module).filter((key) => !supportedNames.includes(key));

  if (unsupportedExports.length > 0) {
    throw new Error(
      `Command module ${name} in ${realPath} has some unsupported exports, probably a misspelling: ${unsupportedExports.join(
        ', ',
      )}. Supported exports are: ${supportedNames.join(', ')}.`,
    );
  }

  if (logLevel === 'debug') {
    console.debug('Importing individual exports from', realPath, 'as', name, 'with description', command.describe);
  }

  return command;
};
