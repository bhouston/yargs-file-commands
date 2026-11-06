import type { ArgumentsCamelCase, Argv, CommandModule, InferredOptionTypes, Options } from 'yargs';

/** Fields shared by every command definition passed to {@link defineCommand}. */
export interface DefineCommandBase {
  /** Command string, optionally with positionals such as `create <name>`. Defaults to the name derived from the file path. */
  command?: string | ReadonlyArray<string>;
  /** Alternative names for the command. */
  aliases?: string | ReadonlyArray<string>;
  /** Help text for the command. Use `false` to hide it from help output. */
  describe?: string | false;
  /** Marks the command as deprecated. A string is shown as the deprecation message. */
  deprecated?: boolean | string;
}

// biome-ignore lint/complexity/noBannedTypes: matches yargs' own default generics
/** A command definition whose `builder` is a function that adds options to the Yargs instance. */
export interface DefineCommandWithBuilder<T = {}, U = {}> extends DefineCommandBase {
  /**
   * Adds options and positionals to the Yargs instance; their types flow into `handler`.
   *
   * @param yargs - The Yargs instance for this command.
   * @returns The instance with options added, or a promise of it.
   */
  builder: (yargs: Argv<T>) => Argv<U> | PromiseLike<Argv<U>>;
  /**
   * Runs the command.
   *
   * @param args - The parsed arguments, typed from the options declared by `builder`.
   */
  handler: (args: ArgumentsCamelCase<U>) => void | Promise<void>;
}

/** A command definition whose `builder` is a Yargs options object keyed by option name. */
export interface DefineCommandWithOptions<O extends { [key: string]: Options }> extends DefineCommandBase {
  /** Yargs options keyed by option name; their types are inferred for `handler`. */
  builder: O;
  /**
   * Runs the command.
   *
   * @param args - The parsed arguments, typed from the options declared in `builder`.
   */
  handler: (args: ArgumentsCamelCase<InferredOptionTypes<O>>) => void | Promise<void>;
}

/** The Yargs `CommandModule` returned by {@link defineCommand}, with the builder's argument types preserved. */
export type DefineCommandResult<T = {}, U = {}> = CommandModule<T, U>;

/**
 * Defines a command whose handler arguments are inferred from a builder function.
 *
 * The module is returned unchanged; this helper only adds types. Export the result as `command`
 * (or as the default export) from a file in a command directory.
 *
 * @param module - The command definition. `builder` receives the Yargs instance and returns it with options added.
 * @returns The same module, typed as a `CommandModule` whose `handler` receives the arguments declared by `builder`.
 * @example
 * ```typescript
 * export const command = defineCommand({
 *   command: 'my-command',
 *   builder: (yargs) => yargs.option('name', { type: 'string', demandOption: true }),
 *   handler: (argv) => {
 *     // argv.name is correctly typed as string
 *     console.log(argv.name);
 *   },
 * });
 * ```
 */
// biome-ignore lint/complexity/noBannedTypes: required to return a CommandModule
export function defineCommand<T = {}, U = {}>(module: DefineCommandWithBuilder<T, U>): DefineCommandResult<T, U>;

/**
 * Defines a command whose handler arguments are inferred from an options object.
 *
 * @param module - The command definition. `builder` is a Yargs options object keyed by option name.
 * @returns The same module, typed as a `CommandModule` whose `handler` receives the arguments inferred from `builder`.
 * @example
 * ```typescript
 * export const command = defineCommand({
 *   describe: 'Start the studio',
 *   builder: { port: { type: 'number', default: 3000 } },
 *   handler: (argv) => {
 *     // argv.port is typed as number
 *     console.log(argv.port);
 *   },
 * });
 * ```
 */
// biome-ignore lint/complexity/noBannedTypes: required to return a CommandModule
export function defineCommand<O extends { [key: string]: Options }, T = {}>(
  module: DefineCommandWithOptions<O>,
): DefineCommandResult<T, InferredOptionTypes<O>>;

export function defineCommand(module: unknown): DefineCommandResult {
  return module as DefineCommandResult;
}
