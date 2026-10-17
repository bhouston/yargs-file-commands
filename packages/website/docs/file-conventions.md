---
title: File conventions
---

# File conventions

Directories and dots separate command segments. A `command` segment is omitted, so `db/migration/command.ts` defines `db migration`.

| File                      | Command         |
| ------------------------- | --------------- |
| `status.ts`               | `status`        |
| `db/health.ts`            | `db health`     |
| `db.health.ts`            | `db health`     |
| `db/migration/command.ts` | `db migration`  |
| `studio.start.ts`         | `studio start`  |
| `$default.ts`             | Default command |

Use either directory or dot notation for a given command. Two files in the same command directory mapping to the same path are an error. These are command naming conventions, not dynamic URL routing: declare positional arguments using Yargs command strings and `.positional()`.

## Default command

Use `$default.ts` for the command to run when no other command is selected:

```ts
import { defineCommand } from 'yargs-file-commands';

export const command = defineCommand({
  describe: 'Show the welcome message',
  builder: (yargs) => yargs,
  handler: async () => {
    console.log('Welcome!');
  },
});
```

## Exports and scanning

Command files may export a `command` object, a default object, or individual Yargs command fields. An explicit command string can include positional arguments; when omitted, the name comes from the file.

The default extensions are `.js` and `.ts`. When running compiled code, set `extensions: ['.js']` and point at the output directory. Other extensions, such as `.mjs`, must be enabled explicitly.

The default ignore patterns skip `.test.js`, `.test.ts`, `.spec.js`, `.spec.ts`, test/spec directories and `.d.ts` files. Supplying `ignorePatterns` replaces the defaults; include any defaults you still need. Keep shared utility modules outside the scanned commands directory, or ignore them explicitly.

## Lazy loading

The complete tree is scanned up front, but only root command files are imported initially. Entering a group imports that group's files, including its sibling commands for help output. Unvisited groups remain unloaded. This reduces startup imports for large CLIs; it does not defer each individual sibling file.

Use async parsing, and [validate the complete tree in tests](validation.md) so a broken module in an unvisited group is still caught in CI.
