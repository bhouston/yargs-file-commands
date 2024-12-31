# Yargs File Commands

[![NPM Package][npm]][npm-url]
[![Build Size][build-size]][build-size-url]
[![NPM Downloads][npm-downloads]][npmtrends-url]

This Yargs helper function lets you define all your commands as individual files and their file names and directory structure defines via implication your nested command structure.

Supports both JavaScript and TypeScript (on Node 22+.)

## Installation

_NOTE: This is an ESM-only package._

```sh
npm install yargs-file-commands
```

## Example

```ts
import { createRequire } from 'module';
import path from 'path';
import yargs from 'yargs';
import { fileCommands } from 'yargs-file-commands';

const require = createRequire(import.meta.url);

export const main = async () => {
  const rootCommandDir = path.join(
    import.meta.url.replace('file://', ''),
    '../commands'
  );

  return yargs(process.argv)
    .command(await fileCommands({ rootDirs: [rootCommandDir] }))
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
└── studio.start.ts    // the "studio start" command
```

Inside each route handler file, you make the default export the route handler. Here is a simple example:

```ts
// commands/studio.start.ts

import type { ArgumentsCamelCase, Argv } from 'yargs';
import type { BaseOptions } from '../options.js';

export interface Options extends BaseOptions {
  port?: number;
}

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

The above will result in these commands being registered:

```
db migration
db health
studio start
```

## Options

The "fileCommands" method takes the following options:

**routesDirs**

- An array of directories where the routes are located relative to the build root folder.
- Required

**extensions**

- An array of file extensions for the route files. Files without matching extensions are ignored
- Default: `[".js", ".ts"]`

** ignorePatterns?: RegExp[];
**

- An array of regexs which if matched against a filename or directory, lead it to being ignored/skipped over.
- Default: `[ /^[\.|_].*/, /\.(test|spec)\.[jt]s$/, /__(test|spec)__/, /\.d\.ts$/ ]`

**logLevel**

- The verbosity level for the plugin, either `debug` or `info`
- Default: `"info"`

## Plugin Development (for Contributors only)

If you want to contribute, just check out [this git project](https://github.com/bhouston/yargs-file-commands) and run the following commands to get going:

```sh
# install dependencies
npm install

# build everything
npm run build

# prettify
npm run format

# eslint
npm run lint

# build and run tests
npm run test

# clean everything, should be like doing a fresh git checkout of the repo.
npm run clean

# publish the npm package
npm run publish

# run example cli
npx example-cli
```
