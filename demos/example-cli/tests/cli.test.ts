import { execSync } from 'child_process';
import path from 'path';
import { describe, expect, it } from 'vitest';

const runCli = (args: string = '') => {
  try {
    const cliPath = path.resolve(__dirname, '../dist/index.js');
    return execSync(`node ${cliPath} ${args}`, {
      encoding: 'utf-8',
      stdio: 'pipe'
    });
  } catch (error: any) {
    return error.stdout;
  }
};

describe('example-cli integration tests', () => {
  it('should show help with --help flag', () => {
    const output = runCli('--help');
    expect(output).toContain('Commands:');
    expect(output).toContain('example-cli hello');
    expect(output).toContain('example-cli joke');
    expect(output).toContain('example-cli studio');
  });

  it('should run hello world command', () => {
    const output = runCli('hello world');
    expect(output).toContain('Hello World!');
  });

  it('should tell a joke', () => {
    const output = runCli('joke');
    expect(output).toContain('TypeScript developer');
    expect(output).toContain('library');
  });

  it('should start studio with default port', () => {
    const output = runCli('studio start');
    expect(output).toContain('Starting studio on port');
  });

  it('should start studio with custom port', () => {
    const output = runCli('studio start --port 3000');
    expect(output).toContain('Starting studio on port 3000');
  });

  it('should show help for studio start command', () => {
    const output = runCli('studio start --help');
    expect(output).toContain('Studio web interface');
    expect(output).toContain('--port');
  });
});
