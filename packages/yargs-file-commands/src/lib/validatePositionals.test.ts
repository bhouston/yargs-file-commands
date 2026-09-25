import { describe, expect, it } from 'vitest';
import type { Argv, CommandBuilder, CommandModule } from 'yargs';

import {
  extractPositionalsFromBuilder,
  extractPositionalsFromCommandString,
  validatePositionals,
} from './validatePositionals.js';

describe('extractPositionalsFromCommandString', () => {
  it('should return empty array for undefined input', () => {
    expect(extractPositionalsFromCommandString(undefined)).toEqual([]);
  });

  it('should return empty array for empty string', () => {
    expect(extractPositionalsFromCommandString('')).toEqual([]);
  });

  it('should return empty array for command with no positionals', () => {
    expect(extractPositionalsFromCommandString('create')).toEqual([]);
    expect(extractPositionalsFromCommandString('list users')).toEqual([]);
  });

  it('should extract single positional argument', () => {
    expect(extractPositionalsFromCommandString('create <name>')).toEqual(['name']);
  });

  it('should extract multiple positional arguments', () => {
    expect(extractPositionalsFromCommandString('create <serviceAccount> <token>')).toEqual(['serviceAccount', 'token']);
  });

  it('should extract optional positional arguments in brackets', () => {
    expect(extractPositionalsFromCommandString('create <name> [optional]')).toEqual(['name', 'optional']);
  });

  it('should handle mixed required and optional positionals', () => {
    expect(extractPositionalsFromCommandString('update <id> [name] [description]')).toEqual([
      'id',
      'name',
      'description',
    ]);
  });

  it('should handle array of command strings (take first)', () => {
    expect(extractPositionalsFromCommandString(['create <name>', 'create <other>'])).toEqual(['name']);
  });

  it('should handle command with options and positionals', () => {
    expect(extractPositionalsFromCommandString('create <name> --type <type>')).toEqual(['name', 'type']);
  });

  it('should handle complex command strings', () => {
    expect(extractPositionalsFromCommandString('db migration <direction> <name> [description]')).toEqual([
      'direction',
      'name',
      'description',
    ]);
  });
});

const builderWithNoPositionals = (yargs: Argv) => yargs.option('name', { type: 'string' });
const builderWithSinglePositional = (yargs: Argv) =>
  yargs.positional('name', {
    type: 'string',
    describe: 'Name',
  });
const builderWithMultiplePositionals = (yargs: Argv) =>
  yargs
    .positional('serviceAccount', {
      type: 'string',
      describe: 'Service account',
    })
    .positional('token', {
      type: 'string',
      describe: 'Token',
    });
const asyncBuilder = async (yargs: Argv) =>
  yargs.positional('name', {
    type: 'string',
    describe: 'Name',
  });
const builderThatThrows = (yargs: Argv) => {
  yargs.positional('name', { type: 'string' });
  throw new Error('Builder error');
};
const builderWithPositionalsAndOptions = (yargs: Argv) =>
  yargs.positional('name', { type: 'string' }).option('verbose', { type: 'boolean' });

describe('extractPositionalsFromBuilder', () => {
  it('should return empty array for undefined builder', async () => {
    expect(await extractPositionalsFromBuilder(undefined)).toEqual([]);
  });

  it('should return empty array for object builder', async () => {
    const objectBuilder = {
      name: { type: 'string' },
    };
    expect(await extractPositionalsFromBuilder(objectBuilder as unknown as CommandBuilder)).toEqual([]);
  });

  it('should return empty array for builder with no positionals', async () => {
    expect(await extractPositionalsFromBuilder(builderWithNoPositionals)).toEqual([]);
  });

  it('should extract single positional from builder', async () => {
    expect(await extractPositionalsFromBuilder(builderWithSinglePositional)).toEqual(['name']);
  });

  it('should extract multiple positionals from builder', async () => {
    expect(await extractPositionalsFromBuilder(builderWithMultiplePositionals)).toEqual(['serviceAccount', 'token']);
  });

  it('should handle async builder', async () => {
    expect(await extractPositionalsFromBuilder(asyncBuilder)).toEqual(['name']);
  });

  it('should handle builder that throws (return collected positionals)', async () => {
    // Should not throw, should return what was collected before the error
    expect(await extractPositionalsFromBuilder(builderThatThrows)).toEqual(['name']);
  });

  it('should handle builder with positionals and options', async () => {
    expect(await extractPositionalsFromBuilder(builderWithPositionalsAndOptions)).toEqual(['name']);
  });
});

describe('validatePositionals', () => {
  it('should pass validation when positionals match', async () => {
    const commandModule: CommandModule = {
      command: 'create <name>',
      builder: (yargs: Argv) => yargs.positional('name', { type: 'string' }),
      handler: () => {},
    };

    await expect(validatePositionals(commandModule, '/test/path.js')).resolves.not.toThrow();
  });

  it('should pass validation when multiple positionals match', async () => {
    const commandModule: CommandModule = {
      command: 'create <serviceAccount> <token>',
      builder: (yargs: Argv) =>
        yargs.positional('serviceAccount', { type: 'string' }).positional('token', { type: 'string' }),
      handler: () => {},
    };

    await expect(validatePositionals(commandModule, '/test/path.js')).resolves.not.toThrow();
  });

  it('should pass validation when command string has extra positionals', async () => {
    // Command string can have positionals not in builder - this is allowed
    const commandModule: CommandModule = {
      command: 'create <name> <optional>',
      builder: (yargs: Argv) => yargs.positional('name', { type: 'string' }),
      handler: () => {},
    };

    await expect(validatePositionals(commandModule, '/test/path.js')).resolves.not.toThrow();
  });

  it('should pass validation when no positionals exist', async () => {
    const commandModule: CommandModule = {
      command: 'create',
      builder: (yargs: Argv) => yargs.option('name', { type: 'string' }),
      handler: () => {},
    };

    await expect(validatePositionals(commandModule, '/test/path.js')).resolves.not.toThrow();
  });

  it('should throw error when builder has positionals but command string does not', async () => {
    const commandModule: CommandModule = {
      command: 'create',
      builder: (yargs: Argv) =>
        yargs.positional('serviceAccount', { type: 'string' }).positional('token', { type: 'string' }),
      handler: () => {},
    };

    await expect(validatePositionals(commandModule, '/test/path.js')).rejects.toThrow(
      'has 2 positional argument(s) registered in builder (serviceAccount, token) but none declared in command string',
    );
  });

  it('should throw error when builder has positionals not in command string', async () => {
    const commandModule: CommandModule = {
      command: 'create <name>',
      builder: (yargs: Argv) => yargs.positional('name', { type: 'string' }).positional('token', { type: 'string' }),
      handler: () => {},
    };

    await expect(validatePositionals(commandModule, '/test/path.js')).rejects.toThrow(
      'has positional argument(s) registered in builder (token) that are not declared in command string',
    );
  });

  it('should include file path in error message', async () => {
    const commandModule: CommandModule = {
      command: 'create',
      builder: (yargs: Argv) => yargs.positional('name', { type: 'string' }),
      handler: () => {},
    };

    await expect(validatePositionals(commandModule, '/custom/path/to/file.js')).rejects.toThrow(
      '/custom/path/to/file.js',
    );
  });

  it('should handle object builder (no validation needed)', async () => {
    const commandModule: CommandModule = {
      command: 'create',
      builder: {
        name: { type: 'string' },
      } as unknown as CommandModule['builder'],
      handler: () => {},
    };

    // Object builders don't use .positional(), so validation should pass
    await expect(validatePositionals(commandModule, '/test/path.js')).resolves.not.toThrow();
  });

  it('should handle undefined builder', async () => {
    const commandModule: CommandModule = {
      command: 'create',
      handler: () => {},
    };

    await expect(validatePositionals(commandModule, '/test/path.js')).resolves.not.toThrow();
  });

  it('should handle command string as array', async () => {
    const commandModule: CommandModule = {
      command: ['create <name>', 'c <name>'],
      builder: (yargs: Argv) => yargs.positional('name', { type: 'string' }),
      handler: () => {},
    };

    await expect(validatePositionals(commandModule, '/test/path.js')).resolves.not.toThrow();
  });

  it('should handle non-string command values in array', () => {
    // Test the edge case where cmd is not a string after array extraction
    expect(extractPositionalsFromCommandString([null as unknown as string, 'create <name>'])).toEqual([]);
    expect(extractPositionalsFromCommandString([undefined as unknown as string, 'create <name>'])).toEqual([]);
    expect(extractPositionalsFromCommandString([123 as unknown as string, 'create <name>'])).toEqual([]);
    expect(extractPositionalsFromCommandString([{} as unknown as string, 'create <name>'])).toEqual([]);
  });

  it('should handle empty array in command string', () => {
    expect(extractPositionalsFromCommandString([])).toEqual([]);
  });

  it('should handle array with empty string as first element', () => {
    expect(extractPositionalsFromCommandString(['', 'create <name>'])).toEqual([]);
  });
});
