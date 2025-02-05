import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import { importCommandFromFile } from '../lib/importCommand.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('importCommandFromFile', async () => {
  it('should import command module correctly', async () => {
    const commandPath = path.join(
      __dirname,
      'fixtures',
      'commands',
      'db',
      'health.js'
    );
    const command = await importCommandFromFile(commandPath, 'health');

    assert(command.describe, 'Should have describe property');
    assert(
      typeof command.builder === 'function',
      'Should have builder function'
    );
    assert(
      typeof command.handler === 'function',
      'Should have handler function'
    );
  });

  it('should handle non-existent files', async () => {
    const nonExistentPath = path.join(
      __dirname,
      'fixtures',
      'commands',
      'non-existent.ts'
    );

    await assert.rejects(
      async () => {
        await importCommandFromFile(nonExistentPath, 'non-existent');
      },
      Error,
      'Should throw error for non-existent file'
    );
  });
});
