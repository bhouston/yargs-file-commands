import type { ArgumentsCamelCase, Argv, CommandModule, InferredOptionTypes, Options } from 'yargs';

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
export function defineCommand<T = {}, U = {}>(module: {
  command?: string | ReadonlyArray<string>;
  aliases?: string | ReadonlyArray<string>;
  describe?: string | false;
  deprecated?: boolean | string;
  builder: (yargs: Argv<T>) => Argv<U> | PromiseLike<Argv<U>>;
  handler: (args: ArgumentsCamelCase<U>) => void | Promise<void>;
}): DefineCommandResult<T, U>;

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
export function defineCommand<O extends { [key: string]: Options }, T = {}>(module: {
  command?: string | ReadonlyArray<string>;
  aliases?: string | ReadonlyArray<string>;
  describe?: string | false;
  deprecated?: boolean | string;
  builder: O;
  handler: (args: ArgumentsCamelCase<InferredOptionTypes<O>>) => void | Promise<void>;
}): DefineCommandResult<T, InferredOptionTypes<O>>;

export function defineCommand(module: unknown): DefineCommandResult {
  return module as DefineCommandResult;
}
