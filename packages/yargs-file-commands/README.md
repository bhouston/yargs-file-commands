# Yargs File Commands

[![NPM Package][npm]][npm-url]
[![NPM Downloads][npm-downloads]][npmtrends-url]
[![Tests][tests-badge]][tests-url]
[![Coverage][coverage-badge]][coverage-url]
[![Discord](https://img.shields.io/badge/Discord-Join%20Chat-5865F2?logo=discord&logoColor=white)][discord-url]

This Yargs helper function lets you define all your commands as individual files and their file names and directory structure defines via implication your nested command structure.

Supports both JavaScript and TypeScript (on Node 24+.)

## Installation

_NOTE: This is an ESM-only package._

```sh
npm install yargs-file-commands
```

## Example

### 1. Setup

First, configure your entry point to scan your commands directory:

```ts
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { fileCommands } from 'yargs-file-commands';

export const main = async () => {
  const commandsDir = path.join(process.cwd(), 'dist/commands');

  return yargs(hideBin(process.argv))
    .scriptName('my-cli')
    .command(await fileCommands({ commandDirs: [commandsDir] }))
    .help().argv;
};
```

### 2. File Structure

You can use any combination of file names and directories. We support either [NextJS](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes) or [Remix](https://remix.run/docs/en/main/file-conventions/routes) conventions for interpreting filenames and directories.

```
/commands
├── db
│   ├── migration
│   │   └── command.ts // the "db migration" command
│   └── health.ts      // the "db health" command
├── $default.ts        // the default command
└── studio.start.ts    // the "studio start" command
```

The above will result in these commands being registered:

```
db migration
db health
studio start
```

### 3. Define Commands

Use the `defineCommand` helper to define your commands. This ensures full type safety for your arguments based on the options you define in the `builder`.

**Basic Command (`commands/studio.start.ts`)**

```ts
import { defineCommand } from 'yargs-file-commands';

export const command = defineCommand({
  command: 'start', // Optional: defaults to filename if omitted
  describe: 'Studio web interface',
  builder: (yargs) =>
    yargs.option('port', {
      alias: 'p',
      type: 'number',
      describe: 'Port to listen on',
      default: 3000,
    }),
  handler: async (argv) => {
    // argv.port is correctly typed as number
    console.log(`Starting studio on port ${argv.port}`);
  },
});
```

**Positional Arguments (`commands/create.ts`)**

```ts
import { defineCommand } from 'yargs-file-commands';

export const command = defineCommand({
  command: 'create <name>', // Define positional args in the command string
  describe: 'Create a new resource',
  builder: (yargs) =>
    yargs.positional('name', {
      describe: 'Name of the resource',
      type: 'string',
      demandOption: true,
    }),
  handler: async (argv) => {
    // argv.name is correctly typed as string
    console.log(`Creating resource: ${argv.name}`);
  },
});
```

**Default Export**

The command module can also be the file's default export. It is treated exactly like `export const command`, including the filename fallback for the command name:

```ts
import { defineCommand } from 'yargs-file-commands';

export default defineCommand({
  command: 'get <id>',
  describe: 'Get a thing',
  handler: async (argv) => {
    console.log(`Getting ${argv.id}`);
  },
});
```

**Default Command (`commands/$default.ts`)**

This command runs when no other command is specified.

```ts
import { defineCommand } from 'yargs-file-commands';

export const command = defineCommand({
  describe: 'Default command',
  handler: async (argv) => {
    console.log('Running default command');
  },
});
```

### 4. Shared Options

To share options between commands while maintaining type safety, you can use either helper functions (recommended for correct type inference) or shared option objects.

**Approach 1: Helper Functions (Recommended)**

This approach uses function composition to chain option definitions, allowing TypeScript to correctly infer the resulting types.

```ts
// shared.ts
import type { Argv } from 'yargs';

export const withPagination = <T>(yargs: Argv<T>) => {
  return yargs
    .option('page', {
      type: 'number',
      default: 1,
      describe: 'Page number',
    })
    .option('limit', {
      type: 'number',
      default: 10,
      describe: 'Items per page',
    });
};

// commands/users.ts
import { defineCommand } from 'yargs-file-commands';
import { withPagination } from '../shared.js';

export const command = defineCommand({
  command: 'list',
  builder: (yargs) => withPagination(yargs),
  handler: async (argv) => {
    // argv.page and argv.limit are correctly typed as number
    console.log(`Page: ${argv.page}, Limit: ${argv.limit}`);
  },
});
```

**Approach 2: Shared Objects**

You can also define a common options object and spread it into your command definitions.

```ts
// shared.ts
export const commonOptions = {
  verbose: {
    alias: 'v',
    type: 'boolean',
    describe: 'Run with verbose logging',
    default: false,
  } as const,
};

// commands/users.ts
import { defineCommand } from 'yargs-file-commands';
import { commonOptions } from '../shared.js';

export const command = defineCommand({
  command: 'list',
  builder: (yargs) => yargs.options(commonOptions),
  handler: async (argv) => {
    // argv.verbose is correctly typed
    if (argv.verbose) console.log('Verbose mode');
  },
});
```

## Lazy Loading

Command modules are loaded lazily, one group at a time. `fileCommands` scans the whole directory tree up front, which is cheap, but imports only the root-level command files. A group imports its own command files when yargs enters it, so `my-cli --help` loads only root-level commands, and `my-cli db migration` loads only the files in `commands/` and `commands/db/` (sibling commands are needed for help output). Large CLIs with thousands of commands stay fast to start.

Because group builders are async, parse with `await yargs(...).parseAsync()` (or `await ....argv`) rather than relying on a synchronous `.parse()` result.

A command file with a mistake in it is only imported when a user goes into its group, so call `validateCommands` from a test to import and check every command (see [Validating commands in tests](#validating-commands-in-tests)).

## Options

The `fileCommands` method takes the following options:

**commandDirs**

- An array of directories where the routes are located relative to the build root folder.
- Required

**extensions**

- An array of file extensions for the route files. Files without matching extensions are ignored
- Default: `[".js", ".ts"]`

**ignorePatterns**

- An array of regexs which if matched against a filename or directory, lead it to being ignored/skipped over.
- Default: `[ /^[.|_].*/, /\.(?:test|spec)\.[jt]s$/, /__(?:test|spec)__/, /\.d\.ts$/ ]`

**logLevel**

- The verbosity level for the plugin, either `debug` or `info`
- Default: `"info"`

**validation**

- Whether to validate that positional arguments registered in the builder function match those declared in the command string
- When enabled, throws an error if positional arguments are registered via `.positional()` but not declared in the command string (e.g., `command: 'create'` should be `command: 'create <arg1> <arg2>'` if positionals are used)
- This helps catch a common mistake where positional arguments are defined in the builder but missing from the command string, which causes them to be `undefined` at runtime
- Default: `false`. The check runs each command's builder, which adds noticeable startup time to large CLIs, so run it in your tests with `validateCommands` instead (see below)

**Example:**

```ts
// ❌ This will fail validation if validation: true
export const command = defineCommand({
  command: 'create', // Missing positional arguments!
  builder: (yargs) => yargs.positional('name', { ... }),
});

// ✅ This passes validation
export const command = defineCommand({
  command: 'create <name>', // Positional arguments declared
  builder: (yargs) => yargs.positional('name', { ... }),
});
```

### Validating commands in tests

`validateCommands` takes the same options as `fileCommands`. It imports every command module and runs positional validation, and throws on the first problem, including a command file that fails to import. Call it from a unit test so mistakes are caught in CI without slowing down every CLI launch:

```ts
import path from 'node:path';
import { validateCommands } from 'yargs-file-commands';
import { expect, it } from 'vitest';

it('all commands are valid', async () => {
  await expect(
    validateCommands({ commandDirs: [path.join(import.meta.dirname, 'commands')] }),
  ).resolves.toBeUndefined();
});
```

## Development

See the [repository README](../../README.md) and [CONTRIBUTING.md](../../CONTRIBUTING.md) for the
issue, PR, and release workflow, and [SECURITY.md](../../SECURITY.md) for private vulnerability
reporting.

## Author

[Ben Houston](https://ben3d.ca), Sponsored by [Land of Assets](https://landofassets.com)

[npm]: https://img.shields.io/npm/v/yargs-file-commands
[npm-url]: https://www.npmjs.com/package/yargs-file-commands
[npm-downloads]: https://img.shields.io/npm/dw/yargs-file-commands
[npmtrends-url]: https://www.npmtrends.com/yargs-file-commands
[tests-badge]: https://github.com/bhouston/yargs-file-commands/actions/workflows/ci.yml/badge.svg?branch=main
[tests-url]: https://github.com/bhouston/yargs-file-commands/actions/workflows/ci.yml
[coverage-badge]: https://codecov.io/gh/bhouston/yargs-file-commands/branch/main/graph/badge.svg
[coverage-url]: https://codecov.io/gh/bhouston/yargs-file-commands
[discord-url]: https://discord.gg/fwupDN493R
