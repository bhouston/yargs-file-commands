---
title: Groups and overlays
---

# Groups and overlays

## Configure a group

A directory containing commands becomes a group. Add `command.ts` inside that directory to customize the group itself:

```text
commands/
└── db/
    ├── command.ts
    ├── health.ts
    └── backup.ts
```

```ts
// commands/db/command.ts
import type { Argv } from 'yargs';

export const describe = 'Database tools';
export const aliases = ['database'];
export const builder = (yargs: Argv) => yargs.option('region', { type: 'string', default: 'us' });
```

Supported fields are `command`, `describe`, `aliases`, `deprecated` and `builder`. Export them individually, as a `command` object, or as a default object. Use `describe: false` to hide a group from help.

A group definition must not have a handler: groups require a subcommand. A leaf command with a handler at the same path as a group is a conflict. Without an explicit definition, the description is `<name> commands`.

Group builders can register shared options and middleware. To customize the missing-subcommand message for every group, pass `demandCommandMessage` to `fileCommands`.

## Share typed options

Builder helpers let multiple leaf commands share options while preserving inference:

```ts
// shared.ts (outside the scanned directory)
import type { Argv } from 'yargs';
export const withPagination = <T>(yargs: Argv<T>) =>
  yargs.option('page', { type: 'number', default: 1 }).option('limit', { type: 'number', default: 10 });

// commands/users.list.ts
import { defineCommand } from 'yargs-file-commands';
import { withPagination } from '../shared.js';
export const command = defineCommand({
  describe: 'List users',
  builder: (yargs) => withPagination(yargs),
  handler: async (argv) => {
    console.log(argv.page, argv.limit);
  },
});
```

## Overlay generated commands

Scan several absolute directories to combine their trees:

```ts
import path from 'node:path';
import { fileCommands } from 'yargs-file-commands';

const commands = await fileCommands({
  commandDirs: [path.join(import.meta.dirname, 'commands-generated'), path.join(import.meta.dirname, 'commands')],
});
```

Groups merge across directories. When both directories define the same command, **the later directory wins**. A later group definition also replaces an earlier definition. This lets you customize generated commands without editing generated files.

For example, generated `db/backup.ts` and `db/health.ts` plus hand-written `db/health.ts` and `db/restore.ts` produce `db backup`, the replacement `db health`, and `db restore`.

A command/group collision remains an error, as do duplicate command paths within one directory.
