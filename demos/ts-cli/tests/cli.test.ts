import { execSync } from 'child_process';
import path from 'path';
import { describe, expect, it } from 'vitest';

const runCli = (args: string = '') => {
  try {
    const cliPath = path.resolve(__dirname, '../src/index.ts');
    return execSync(`node ${cliPath} ${args}`, {
      encoding: 'utf-8',
      stdio: 'pipe'
    });
  } catch (error: any) {
    // yargs outputs errors to stdout, so combine both stdout and stderr
    return (error.stdout || '') + (error.stderr || '');
  }
};

describe('ts-cli integration tests', () => {
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
