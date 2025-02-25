import fs from 'fs';
import {
  type ArgumentsCamelCase,
  type CommandBuilder,
  type CommandModule
} from 'yargs';

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
export type CommandHandler = (
  args: ArgumentsCamelCase<any>
) => void | Promise<any>;

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
  options: ImportCommandOptions
): Promise<CommandModule> => {
  // ensure file exists using fs node library
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Can not import command from non-existent file path: ${filePath}`
    );
  }

  const url = 'file://' + filePath;
  const { logLevel = 'info' } = options;

  // Import the module
  const imported = await import(url);

  // Check if this is the default command
  const isDefault = name === '$default';

  // First try to use the CommandModule export if it exists
  if (
    'command' in imported &&
    typeof imported.command === 'object' &&
    imported.command !== null
  ) {
    const commandModule = imported.command as CommandModule;

    // Ensure the command property exists or use the filename
    if (!commandModule.command && !isDefault) {
      commandModule.command = name;
    } else if (isDefault && !commandModule.command) {
      commandModule.command = '$0';
    }

    if (logLevel === 'debug') {
      console.debug(
        'Importing CommandModule from',
        filePath,
        'as',
        name,
        'with description',
        commandModule.describe
      );
    }

    // Return the command module directly without wrapping
    return {
      command: commandModule.command,
      describe: commandModule.describe,
      builder: commandModule.builder,
      handler: commandModule.handler,
      deprecated: commandModule.deprecated,
      aliases: commandModule.aliases
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
      (async (args: ArgumentsCamelCase<any>) => {
        // null implementation
      })
  } as CommandModule;

  // Validate exports
  const supportedNames = [
    'command',
    'describe',
    'alias',
    'builder',
    'deprecated',
    'handler'
  ];

  const module = imported as Record<string, any>;
  const unsupportedExports = Object.keys(module).filter(
    (key) => !supportedNames.includes(key)
  );

  if (unsupportedExports.length > 0) {
    throw new Error(
      `Command module ${name} in ${filePath} has some unsupported exports, probably a misspelling: ${unsupportedExports.join(
        ', '
      )}`
    );
  }

  if (logLevel === 'debug') {
    console.debug(
      'Importing individual exports from',
      filePath,
      'as',
      name,
      'with description',
      command.describe
    );
  }

  return command;
};
