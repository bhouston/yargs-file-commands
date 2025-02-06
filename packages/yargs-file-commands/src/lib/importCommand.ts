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
 * Structure of a command module import
 * @interface CommandImportModule
 */
export interface CommandImportModule {
  /** Command aliases */
  alias?: CommandAlias;
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
 * @returns {Promise<CommandModule>} Imported command module
 *
 * @description
 * Dynamically imports a command file and constructs a Yargs command module.
 * If no handler is provided, creates a null implementation.
 */
export const importCommandFromFile = async (
  filePath: string,
  name: string,
  options: ImportCommandOptions
) => {
  // ensure file exists using fs node library
  if (fs.existsSync(filePath) === false) {
    throw new Error(
      `Can not import command from non-existence file path: ${filePath}`
    );
  }

  const handlerModule = (await import(filePath)) as CommandImportModule;
  const { logLevel = 'info' } = options;

  const command = {
    command: name,
    describe: handlerModule.describe,
    alias: handlerModule.alias,
    builder: handlerModule.builder,
    deprecated: handlerModule.deprecated,
    handler:
      handlerModule.handler ??
      (async (args: ArgumentsCamelCase<any>) => {
        // null implementation
      })
  } as CommandModule;

  const supportedNames = [
    'describe',
    'alias',
    'builder',
    'deprecated',
    'handler'
  ];
  const module = handlerModule as Record<string, any>;
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
      'Importing command from',
      filePath,
      'as',
      name,
      'with description',
      command.describe
    );
  }

  return command;
};
