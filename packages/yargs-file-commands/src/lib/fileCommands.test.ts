import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import type { CommandModule } from 'yargs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { fileCommands } from '../lib/fileCommands.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('fileCommands', async () => {
  await it('should load commands from directory structure', async () => {
    const commandsDir = path.join(__dirname, 'fixtures', 'commands');
    const commands = await fileCommands({
      commandDirs: [commandsDir],
      extensions: ['.js'],
      logLevel: 'debug'
    });

    assert.equal(commands.length, 1, 'Should have one root command');
    const rootCommand = commands[0] as CommandModule;
    assert(rootCommand, 'Root command should exist');
    assert.equal(rootCommand.command, 'db', 'Root command should be "db"');

    // Create a new yargs instance
    const yargsInstance = yargs(hideBin(process.argv));

    if (typeof rootCommand.builder === 'function') {
      rootCommand.builder(yargsInstance);
    }

    // Check that the command has subcommands by checking its description
    const description = rootCommand.describe;
    assert(
      typeof description === 'string' && description.includes('db'),
      'Command should have correct description'
    );
  });

  await it('should respect ignore patterns', async () => {
    const commandsDir = path.join(__dirname, 'fixtures', 'commands');
    const commands = await fileCommands({
      commandDirs: [commandsDir],
      extensions: ['.js'],
      ignorePatterns: [/health/],
      logLevel: 'debug'
    });

    assert.equal(commands.length, 1, 'Should have one root command');
    const rootCommand = commands[0] as CommandModule;
    assert(rootCommand, 'Root command should exist');
    assert.equal(rootCommand.command, 'db', 'Root command should be "db"');
  });
});
