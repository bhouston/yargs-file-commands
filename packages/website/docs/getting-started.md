---
title: Getting started
---

# Getting started

Yargs File Commands maps a directory of command modules into a nested Yargs command tree. It is useful when a CLI has enough commands that maintaining a central registration file becomes tedious, or when generated commands need hand-written overrides.

## Install

This package is ESM-only. Use Node.js 22 or newer and Yargs 18. For TypeScript projects, install the Yargs types too.

```bash
npm install yargs-file-commands yargs
npm install --save-dev typescript @types/yargs
```

Set `"type": "module"` in your package.json. The examples below use compiled JavaScript: compile your entry point and commands together, preserving their directory structure. Node 24+ can also run supported erasable TypeScript directly; the library does not bundle a TypeScript loader.

## Register the tree

```ts
// src/cli.ts → dist/cli.js
import path from 'node:path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { fileCommands } from 'yargs-file-commands';

await yargs(hideBin(process.argv))
  .scriptName('my-cli')
  .command(
    await fileCommands({
      commandDirs: [path.join(import.meta.dirname, 'commands')],
      extensions: ['.js'],
    }),
  )
  .demandCommand(1)
  .help()
  .parseAsync();
```

`commandDirs` requires **absolute paths**. Resolving from the entry module makes the CLI independent of the user's working directory. Use `parseAsync()` because group builders load commands asynchronously.

## Define a typed command

```ts
// src/commands/studio.start.ts
import { defineCommand } from 'yargs-file-commands';

export const command = defineCommand({
  describe: 'Start the studio',
  builder: (yargs) =>
    yargs.option('port', {
      type: 'number',
      default: 3000,
      describe: 'Port to listen on',
    }),
  handler: async (argv) => {
    // argv.port is inferred as number
    console.log(`Starting studio on port ${argv.port}`);
  },
});
```

After compiling, run:

```bash
node dist/cli.js studio start --port 8080
node dist/cli.js studio --help
```

`defineCommand` supports a builder function or a Yargs options object, and infers the handler arguments. A default-exported command object is also supported.

## Positional arguments

Declare positionals in both the command string and builder:

```ts
// src/commands/create.ts
import { defineCommand } from 'yargs-file-commands';

export default defineCommand({
  command: 'create <name>',
  describe: 'Create a resource',
  builder: (yargs) =>
    yargs.positional('name', {
      type: 'string',
      demandOption: true,
    }),
  handler: async (argv) => {
    console.log(`Creating ${argv.name}`);
  },
});
```

Continue with [file conventions](file-conventions.md), [groups and overlays](groups-and-overlays.md), or the [generated API reference](api/index.md).
