import {
  type ArgumentsCamelCase,
  type CommandBuilder,
  type CommandModule
} from 'yargs';

// array of strings (or a single string) representing aliases of `exports.command`, positional args defined in an alias are ignored
// export aliases?:
export type CommandAlias = readonly string[] | string | undefined;

// object declaring the options the command accepts, or a function accepting and returning a yargs instance
// export builder?;
//CommandBuilder<T, U> | undefined;

// string (or array of strings) that executes this command when given on the command line, first string may contain positional args
// export name?:
export type CommandName = readonly string[] | string | undefined;

// boolean (or string) to show deprecation notice
// export deprecated?;
export type CommandDeprecated = boolean | string | undefined;

// string used as the description for the command in help text, use `false` for a hidden command
// export describe?
export type CommandDescribe = string | false | undefined;

// a function which will be passed the parsed argv.
// export handler
export type CommandHandler = (
  args: ArgumentsCamelCase<any>
) => void | Promise<any>;

export interface FileCommandsParams {
  rootDir: string;
}

export interface CommandImportModule {
  alias?: CommandAlias;
  builder?: CommandBuilder;
  command?: CommandName;
  deprecated?: CommandDeprecated;
  describe?: CommandDescribe;
  handler?: CommandHandler;
}

export const importCommandFromFile = async (filePath: string, name: string) => {
  const handlerModule = (await import(filePath)) as CommandImportModule;

  return {
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
};
