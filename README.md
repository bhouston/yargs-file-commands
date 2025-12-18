# Yargs File Commands

[![NPM Package][npm]][npm-url]
[![NPM Downloads][npm-downloads]][npmtrends-url]
[![Tests][tests-badge]][tests-url]
[![Coverage][coverage-badge]][coverage-url]

This Yargs helper function lets you define all your commands as individual files and their file names and directory structure defines via implication your nested command structure.

Supports both JavaScript and TypeScript (on Node 22+.)

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
    .command(
      await fileCommands({ commandDirs: [commandsDir] })
    )
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
  builder: (yargs) => yargs.option('port', {
    alias: 'p',
    type: 'number',
    describe: 'Port to listen on',
    default: 3000
  }),
  handler: async (argv) => {
    // argv.port is correctly typed as number
    console.log(`Starting studio on port ${argv.port}`);
  }
});
```

**Positional Arguments (`commands/create.ts`)**

```ts
import { defineCommand } from 'yargs-file-commands';

export const command = defineCommand({
  command: 'create <name>', // Define positional args in the command string
  describe: 'Create a new resource',
  builder: (yargs) => yargs.positional('name', {
    describe: 'Name of the resource',
    type: 'string',
    demandOption: true
  }),
  handler: async (argv) => {
    // argv.name is correctly typed as string
    console.log(`Creating resource: ${argv.name}`);
  }
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
  }
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
      describe: 'Page number'
    })
    .option('limit', {
      type: 'number',
      default: 10,
      describe: 'Items per page'
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
  }
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
  } as const
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
  }
});
```

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
- Default: `true`

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

## Plugin Development (for Contributors only)

If you want to contribute, just check out [this git project](https://github.com/bhouston/yargs-file-commands) and run the following commands to get going:

```sh
# install dependencies
pnpm install

# build everything
pnpm run build

# biome
pnpm biome check --write

# tests
pnpm vitest

# clean everything, should be like doing a fresh git checkout of the repo.
pnpm clean

# run example cli
npx example-cli

# publish new release
pnpm make-release
```


[npm]: https://img.shields.io/npm/v/yargs-file-commands
[npm-url]: https://www.npmjs.com/package/yargs-file-commands
[npm-downloads]: https://img.shields.io/npm/dw/yargs-file-commands
[npmtrends-url]: https://www.npmtrends.com/yargs-file-commands
[tests-badge]: https://github.com/bhouston/yargs-file-commands/workflows/Tests/badge.svg
[tests-url]: https://github.com/bhouston/yargs-file-commands/actions/workflows/test.yml
[coverage-badge]: https://codecov.io/gh/bhouston/yargs-file-commands/branch/main/graph/badge.svg
[coverage-url]: https://codecov.io/gh/bhouston/yargs-file-commands
