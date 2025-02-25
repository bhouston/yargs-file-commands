import path from 'path';
import { test } from 'node:test';
import assert from 'node:assert';

import { importCommandFromFile } from './importCommand.js';

// get __dirname in ESM style
const __dirname = path.dirname(new URL(import.meta.url).pathname);

test('should import command module correctly', async () => {
  const filePath = path.join(
    __dirname,
    'fixtures',
    'commands',
    'db',
    'health.js'
  );
  const command = await importCommandFromFile(filePath, 'health', {
    logLevel: 'info'
  });

  assert.equal(command.describe, 'Database health check');
});

test('should handle non-existent files', async () => {
  const filePath = path.join(
    __dirname,
    'fixtures',
    'commands',
    'non-existent.js'
  );
  try {
    await importCommandFromFile(filePath, 'non-existent', {
      logLevel: 'info'
    });
    assert.fail('Should have thrown an error');
  } catch (error) {
    assert.ok(error instanceof Error);
  }
});

test('should handle explicit command names', async () => {
  const filePath = path.join(__dirname, 'fixtures', 'commands', 'create.js');
  const command = await importCommandFromFile(filePath, 'create', {
    logLevel: 'info'
  });

  assert.equal(command.command, 'create [name]');
  assert.equal(command.describe, 'Create something with a name');
});

test('should handle default commands', async () => {
  const filePath = path.join(__dirname, 'fixtures', 'commands', '$default.js');
  const command = await importCommandFromFile(filePath, '$default', {
    logLevel: 'info'
  });

  assert.equal(command.command, '$0');
  assert.equal(command.describe, 'Default command');
});
