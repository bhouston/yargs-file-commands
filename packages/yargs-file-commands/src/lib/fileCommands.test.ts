import path from 'path';
import { test } from 'node:test';
import assert from 'node:assert';
import type { Command } from './Command.js';

import { fileCommands } from './fileCommands.js';

// get __dirname in ESM style
const __dirname = path.dirname(new URL(import.meta.url).pathname);

test('should load commands from directory structure', async () => {
  const commands = await fileCommands({
    commandDirs: [path.join(__dirname, 'fixtures', 'commands')],
    logLevel: 'debug'
  });

  assert.ok(commands.length > 0);
});

test('should respect ignore patterns', async () => {
  const commands = await fileCommands({
    commandDirs: [path.join(__dirname, 'fixtures', 'commands')],
    ignorePatterns: [/health/, /.d.ts/],
    logLevel: 'debug'
  });

  assert.ok(commands.length > 0);
});

test('should handle explicit commands and default command', async () => {
  const commands = await fileCommands({
    commandDirs: [path.join(__dirname, 'fixtures', 'commands')],
    logLevel: 'debug'
  });

  console.log(
    'commands',
    JSON.stringify(
      commands.map((c) => c.command),
      null,
      2
    )
  );
  // Find the explicit command
  const explicitCommand = commands.find((cmd) =>
    cmd.command?.toString().includes('create [name]')
  );
  assert.ok(explicitCommand, 'Should find explicit command');
  assert.equal(explicitCommand?.describe, 'Create something with a name');

  // Find the default command
  const defaultCommand = commands.find((cmd) => cmd.command === '$0');
  assert.ok(defaultCommand, 'Should find default command');
  assert.equal(defaultCommand?.describe, 'Default command');
});
