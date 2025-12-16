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

## Plugin Development (for Contributors only)

If you want to contribute, just check out [this git project](https://github.com/bhouston/yargs-file-commands) and run the following commands to get going:

```sh
# install dependencies
pnpm install

# build everything
pnpm run build

# biome
pnpm run chec

# tests
pnpm vitest

# clean everything, should be like doing a fresh git checkout of the repo.
pnpm clean

# run example cli
npx example-cli
```

Underneath the hood, we are using [NX](https://nx.dev) to manage the monorepo and shared scripts.

[npm]: https://img.shields.io/npm/v/yargs-file-commands
[npm-url]: https://www.npmjs.com/package/yargs-file-commands
[npm-downloads]: https://img.shields.io/npm/dw/yargs-file-commands
[npmtrends-url]: https://www.npmtrends.com/yargs-file-commands
[tests-badge]: https://github.com/bhouston/yargs-file-commands/workflows/Tests/badge.svg
[tests-url]: https://github.com/bhouston/yargs-file-commands/actions/workflows/test.yml
[coverage-badge]: https://codecov.io/gh/bhouston/yargs-file-commands/branch/main/graph/badge.svg
[coverage-url]: https://codecov.io/gh/bhouston/yargs-file-commands
