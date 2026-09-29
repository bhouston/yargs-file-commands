import { execSync } from 'child_process';
import path from 'path';
import { validate } from '@clidoc/core';
import { describe, expect, it } from 'vitest';

const runCli = (args: string = '') => {
  try {
    const cliPath = path.resolve(__dirname, '../src/index.ts');
    return execSync(`node ${cliPath} ${args}`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
  } catch (error: unknown) {
    // yargs outputs errors to stdout, so combine both stdout and stderr
    const { stdout, stderr } = error as { stdout?: string; stderr?: string };
    return (stdout ?? '') + (stderr ?? '');
  }
};

describe('ts-cli integration tests', () => {
  it('docgen writes a valid OpenCLI document with every command', () => {
    const document = JSON.parse(runCli('docgen'));
    expect(validate(document)).toEqual({ valid: true, errors: [] });
    // the '*' default command is keyed as the binary itself
    expect(Object.keys(document.commands).toSorted()).toEqual(['ts-cli', 'ts-cli docgen', 'ts-cli joke']);
  });

  it('should show help with --help flag', () => {
    const output = runCli('--help');
    expect(output).toContain('Commands:');
    expect(output).toContain('ts-cli [word]');
    expect(output).toContain('ts-cli joke');
  });

  it('should tell a joke', () => {
    const output = runCli('joke');
    expect(output).toContain('TypeScript developer');
    expect(output).toContain('library');
  });

  it('should run default command', () => {
    const output = runCli();
    expect(output).toContain('Default command executed with word: Hello');
  });
});
