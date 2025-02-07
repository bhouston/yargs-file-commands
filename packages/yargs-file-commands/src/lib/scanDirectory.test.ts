import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import { scanDirectory } from '../lib/scanDirectory.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('scanDirectory', async () => {
  await it('should find all command files in directory', async () => {
    const commandsDir = path.join(__dirname, 'fixtures', 'commands');
    console.log('Scan Directory: ', commandsDir);
    const files = await scanDirectory(commandsDir, commandsDir, {
      extensions: ['.js'],
      logLevel: 'debug'
    });

    assert.equal(
      files.length,
      4,
      `Should find two command files, instead found: ${files.join(', ')}`
    );
    assert(
      files.some((f) => f.includes('health.js')),
      `Should find health.js, instead found: ${files.join(', ')}`
    );
    assert(
      files.some((f) => f.includes('command.js')),
      `Should find command.js, instead found: ${files.join(', ')}`
    );
  });

  await it('should respect ignore patterns', async () => {
    const commandsDir = path.join(__dirname, 'fixtures', 'commands');
    console.log('Scan Directory: ', commandsDir);
    const files = await scanDirectory(commandsDir, commandsDir, {
      extensions: ['.js'],
      ignorePatterns: [/health/, /.d.ts/],
      logLevel: 'debug'
    });

    assert.equal(
      files.length,
      3,
      `Should find one command file, instead found: ${files.join(', ')}`
    );
    assert(
      files.some((f) => f.includes('command.js')),
      `Should find command.js, instead found: ${files.join(', ')}`
    );
    assert(
      !files.some((f) => f.includes('health.js')),
      `Should not find health.js, instead found: ${files.join(', ')}`
    );
  });

  await it('should handle non-existent directories', async () => {
    const nonExistentDir = path.join(__dirname, 'fixtures', 'non-existent');
    try {
      console.log('Scan Directory: ', nonExistentDir);
      await scanDirectory(nonExistentDir, nonExistentDir, {
        extensions: ['.js'],
        logLevel: 'debug'
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
