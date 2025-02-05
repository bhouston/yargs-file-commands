import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import { scanDirectory } from '../lib/scanDirectory.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('scanDirectory', async () => {
  it('should find all command files in directory', async () => {
    const commandsDir = path.join(__dirname, 'fixtures', 'commands');
    const files = await scanDirectory(commandsDir, {
      extensions: ['.js'],
      ignorePatterns: []
    });

    assert.equal(files.length, 2, 'Should find two command files');
    assert(
      files.some((f) => f.includes('health.js')),
      'Should find health.js'
    );
    assert(
      files.some((f) => f.includes('command.js')),
      'Should find command.js'
    );
  });

  it('should respect ignore patterns', async () => {
    const commandsDir = path.join(__dirname, 'fixtures', 'commands');
    const files = await scanDirectory(commandsDir, {
      extensions: ['.js'],
      ignorePatterns: [/health/]
    });

    assert.equal(files.length, 1, 'Should find one command file');
    assert(
      files.some((f) => f.includes('command.js')),
      'Should find command.js'
    );
    assert(
      !files.some((f) => f.includes('health.js')),
      'Should not find health.js'
    );
  });

  it('should handle non-existent directories', async () => {
    const nonExistentDir = path.join(__dirname, 'fixtures', 'non-existent');
    try {
      await scanDirectory(nonExistentDir, {
        extensions: ['.js']
      });
      assert.fail('Should have thrown an error');
    } catch (error) {
      assert(error instanceof Error);
      assert(
        error.message.includes('ENOENT'),
        'Error should indicate directory not found'
      );
    }
  });
});
