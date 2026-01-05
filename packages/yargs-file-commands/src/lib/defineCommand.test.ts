import { describe, expect, it } from 'vitest';
import type { CommandModule } from 'yargs';
import yargs from 'yargs';

import { defineCommand } from './defineCommand.js';

describe('defineCommand', () => {
  it('should return a command module with builder function', () => {
    const command = defineCommand({
      command: 'test',
      describe: 'Test command',
      builder: (yargs) => yargs.option('name', { type: 'string' }),
      handler: async (argv) => {
        expect(argv.name).toBeDefined();
      },
    });

    expect(command.command).toBe('test');
    expect(command.describe).toBe('Test command');
    expect(command.builder).toBeDefined();
    expect(command.handler).toBeDefined();
  });

  it('should return a command module with options object builder', () => {
    const command = defineCommand({
      command: 'test',
      describe: 'Test command',
      builder: {
        name: { type: 'string' },
        count: { type: 'number', default: 0 },
      },
      handler: async (argv) => {
        expect(argv.name).toBeDefined();
        expect(argv.count).toBeDefined();
      },
    });

    expect(command.command).toBe('test');
    expect(command.describe).toBe('Test command');
    expect(command.builder).toBeDefined();
    expect(command.handler).toBeDefined();
  });

  it('should handle commands with positional arguments', () => {
    const command = defineCommand({
      command: 'create <name>',
      describe: 'Create command',
      builder: (yargs) =>
        yargs.positional('name', {
          type: 'string',
          describe: 'Name of the resource',
          demandOption: true,
        }),
      handler: async (argv) => {
        expect(argv.name).toBeDefined();
      },
    });

    expect(command.command).toBe('create <name>');
    expect(command.describe).toBe('Create command');
  });

  it('should handle commands with aliases', () => {
    const command = defineCommand({
      command: 'test',
      aliases: ['t', 'test-cmd'],
      describe: 'Test command',
      builder: (yargs) => yargs,
      handler: async () => {},
    });

    expect(command.command).toBe('test');
    expect(command.aliases).toEqual(['t', 'test-cmd']);
  });

  it('should handle commands with string alias', () => {
    const command = defineCommand({
      command: 'test',
      aliases: 't',
      describe: 'Test command',
      builder: (yargs) => yargs,
      handler: async () => {},
    });

    expect(command.command).toBe('test');
    expect(command.aliases).toBe('t');
  });

  it('should handle deprecated commands', () => {
    const command = defineCommand({
      command: 'old',
      describe: 'Old command',
      deprecated: true,
      builder: (yargs) => yargs,
      handler: async () => {},
    });

    expect(command.deprecated).toBe(true);
  });

  it('should handle deprecated commands with message', () => {
    const command = defineCommand({
      command: 'old',
      describe: 'Old command',
      deprecated: 'Use new command instead',
      builder: (yargs) => yargs,
      handler: async () => {},
    });

    expect(command.deprecated).toBe('Use new command instead');
  });

  it('should handle commands with describe set to false', () => {
    const command = defineCommand({
      command: 'hidden',
      describe: false,
      builder: (yargs) => yargs,
      handler: async () => {},
    });

    expect(command.describe).toBe(false);
  });

  it('should handle commands without command name', () => {
    const command = defineCommand({
      describe: 'Command without explicit name',
      builder: (yargs) => yargs,
      handler: async () => {},
    });

    expect(command.describe).toBe('Command without explicit name');
    expect(command.builder).toBeDefined();
    expect(command.handler).toBeDefined();
  });

  it('should handle async builder function', async () => {
    const command = defineCommand({
      command: 'test',
      describe: 'Test command',
      builder: async (yargs) => {
        await Promise.resolve();
        return yargs.option('name', { type: 'string' });
      },
      handler: async () => {},
    });

    expect(command.builder).toBeDefined();
    if (command.builder && typeof command.builder === 'function') {
      const result = command.builder(yargs([]));
      expect(result).toBeDefined();
    }
  });

  it('should return a valid CommandModule that can be used with yargs', () => {
    const command = defineCommand({
      command: 'test',
      describe: 'Test command',
      builder: (yargs) => yargs.option('verbose', { type: 'boolean', alias: 'v' }),
      handler: async (argv) => {
        expect(argv.verbose).toBeDefined();
      },
    });

    // Verify it's a valid CommandModule
    expect(command).toHaveProperty('command');
    expect(command).toHaveProperty('describe');
    expect(command).toHaveProperty('builder');
    expect(command).toHaveProperty('handler');

    // Verify types are correct
    const cmdModule: CommandModule = command;
    expect(cmdModule.command).toBe('test');
  });

  it('should handle commands with array of command strings', () => {
    const command = defineCommand({
      command: ['test', 't'],
      describe: 'Test command',
      builder: (yargs) => yargs,
      handler: async () => {},
    });

    expect(command.command).toEqual(['test', 't']);
  });

  it('should handle commands with complex builder options', () => {
    const command = defineCommand({
      command: 'complex',
      describe: 'Complex command',
      builder: (yargs) =>
        yargs
          .option('name', { type: 'string', demandOption: true })
          .option('count', { type: 'number', default: 1 })
          .option('verbose', { type: 'boolean', alias: 'v' })
          .positional('id', { type: 'string', describe: 'Resource ID' }),
      handler: async (argv) => {
        expect(argv.name).toBeDefined();
        expect(argv.count).toBeDefined();
        expect(argv.verbose).toBeDefined();
      },
    });

    expect(command.command).toBe('complex');
    expect(command.builder).toBeDefined();
  });
});
