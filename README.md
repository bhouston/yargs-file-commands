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

```ts
export const main = async () => {
  const commandsDir = path.join(distDir, 'commands');

  return yargs(hideBin(process.argv))
    .scriptName(packageInfo.name!)
    .version(packageInfo.version!)
    .command(
      await fileCommands({ commandDirs: [commandsDir], logLevel: 'debug' })
    )
    .help().argv;
};
```

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

Inside each route handler file, you define your command configuration. The command name defaults to the filename, but you can explicitly specify it using the `command` export to support positional arguments. Here are some examples:

```ts
// commands/studio.start.ts - Basic command using filename as command name

import type { ArgumentsCamelCase, Argv } from 'yargs';
import type { BaseOptions } from '../options.js';

export interface Options extends BaseOptions {
  port?: number;
}

export const command = 'start'; // this is optional, it will use the filename if this isn't specified

export const describe = 'Studio web interface';

export const builder = (args: Argv): Argv<Options> => {
  const result = args.option('port', {
    alias: 'p',
    type: 'number',
    describe: 'Port to listen on'
  });
  return result;
};

export const handler = async (args: ArgumentsCamelCase<Options>) => {
  const config = await getConfig();
  // Implementation
};
```

```ts
// Command with positional arguments

export const command = 'create [name]';
export const describe = 'Create a new migration';

export const builder = (args: Argv): Argv<Options> => {
  return args.positional('name', {
    describe: 'Name of the migration',
    type: 'string',
    demandOption: true
  });
};

export const handler = async (args: ArgumentsCamelCase<Options>) => {
  // Implementation
};
```

```ts
// Must be named $default.ts - Default command (runs when no command is specified)

export const describe = 'Default command';

export const handler = async (args: ArgumentsCamelCase<Options>) => {
  console.log('Running default command');
};
```

The above will result in these commands being registered:

```
db migration
db health
studio start
```

### Alternative Type-Safe Command Definition

YOu can also use this type-safe way to define commands using the `CommandModule` type from yargs directly. This is the preferred method as it provides better TypeScript support and catches potential errors at compile time rather than runtime:

```ts
import type { ArgumentsCamelCase, CommandModule } from 'yargs';

type TriageArgs = {
  owner: string;
  repo: string;
  issue: number;
};

export const command: CommandModule<object, TriageArgs> = {
  command: 'triage <owner> <repo> <issue>',
  describe: 'Triage a GitHub issue',
  builder: {
    owner: {
      type: 'string',
      description: 'GitHub repository owner',
      demandOption: true
    },
    repo: {
      type: 'string',
      description: 'GitHub repository name',
      demandOption: true
    },
    issue: {
      type: 'number',
      description: 'Issue number',
      demandOption: true
    }
  },
  handler: async (argv: ArgumentsCamelCase<TriageArgs>) => {
    // Implementation
  }
};
```

This approach has several advantages:

- Full TypeScript support with proper type inference
- Compile-time checking of command structure
- No risk of misspelling exports
- Better IDE support with autocompletion

## Options

The "fileCommands" method takes the following options:

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
