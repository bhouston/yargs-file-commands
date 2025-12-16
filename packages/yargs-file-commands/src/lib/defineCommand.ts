import type { ArgumentsCamelCase, Argv, CommandModule, InferredOptionTypes, Options } from 'yargs';

/**
 * Helper to define a command with type inference for arguments.
 *
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
}): CommandModule<T, U>;

/**
 * Helper to define a command with type inference for arguments using an options object builder.
 */

// biome-ignore lint/complexity/noBannedTypes: required to return a CommandModule
export function defineCommand<O extends { [key: string]: Options }, T = {}>(module: {
  command?: string | ReadonlyArray<string>;
  aliases?: string | ReadonlyArray<string>;
  describe?: string | false;
  deprecated?: boolean | string;
  builder: O;
  handler: (args: ArgumentsCamelCase<InferredOptionTypes<O>>) => void | Promise<void>;
}): CommandModule<T, InferredOptionTypes<O>>;

// biome-ignore lint/suspicious/noExplicitAny: required to return a CommandModule
export function defineCommand(module: any): any {
  return module;
}
