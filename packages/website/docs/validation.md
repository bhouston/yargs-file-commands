---
title: Validation and troubleshooting
---

# Validation and troubleshooting

## Check every command in CI

Lazy loading means a broken command in an unvisited group might not surface during normal use. `validateCommands` imports every module, checks group definitions and validates positional declarations without executing handlers:

```ts
import path from 'node:path';
import { expect, it } from 'vitest';
import { validateCommands } from 'yargs-file-commands';

it('validates the complete command tree', async () => {
  await expect(
    validateCommands({
      commandDirs: [path.join(import.meta.dirname, 'commands')],
    }),
  ).resolves.toBeUndefined();
});
```

Use a test runtime that can import your command files, or validate compiled JavaScript. Module-level initialization and builder functions run during validation, so keep side effects in handlers or explicit services.

Runtime positional validation defaults to `false`. Set `validation: true` to run checks as commands load, or use `validateCommands` in tests to avoid paying that cost on each CLI launch.

## Common problems

| Symptom                              | What to check                                                                                   |
| ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Directory must be absolute           | Resolve command paths with `path.join(import.meta.dirname, 'commands')` or `path.resolve(...)`. |
| No commands found                    | Check the output directory and enabled extensions. Compile commands along with the entry point. |
| Positional argument is undefined     | Include it in the command string (`create <name>`) as well as `.positional('name', ...)`.       |
| Duplicate command                    | Choose one of `db.health.ts` and `db/health.ts` within a directory.                             |
| Command conflicts with group         | Remove the handler from the group definition or move the leaf command to a different path.      |
| Async group is not ready             | Await `.parseAsync()` rather than using synchronous parsing.                                    |
| Utility file is treated as a command | Move it outside the command tree or add an ignore pattern.                                      |

Set `logLevel: 'debug'` to log scanning and module imports. See [FileCommandsOptions](api/type-aliases/FileCommandsOptions.md) for the complete source-generated option list.
