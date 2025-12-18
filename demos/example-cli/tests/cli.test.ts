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
    // yargs outputs errors to stdout, so combine both stdout and stderr
    return (error.stdout || '') + (error.stderr || '');
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

  describe('tokens create command (positional + options reproduction)', () => {
    it('should create token with both positional arguments and required option', () => {
      const output = runCli('tokens create myaccount mytoken --type FRONTEND --org myorg');
      expect(output).toContain('Service Account: myaccount');
      expect(output).toContain('Token: mytoken');
      expect(output).toContain('Type: FRONTEND');
      expect(output).toContain('Org: myorg');
      expect(output).toContain('Token created:');
    });

    it('should create token with optional domain-whitelist option', () => {
      const output = runCli('tokens create myaccount mytoken --type FRONTEND --org myorg --domain-whitelist example.com');
      expect(output).toContain('Service Account: myaccount');
      expect(output).toContain('Token: mytoken');
      expect(output).toContain('Type: FRONTEND');
      expect(output).toContain('Domain Whitelist: example.com');
    });

    it('should create token with all options including shared options', () => {
      const output = runCli('tokens create myaccount mytoken --type SECRET --org myorg --project myproject --description "Test token" --format yaml');
      expect(output).toContain('Service Account: myaccount');
      expect(output).toContain('Token: mytoken');
      expect(output).toContain('Type: SECRET');
      expect(output).toContain('Org: myorg');
      expect(output).toContain('Project: myproject');
      expect(output).toContain('Description: Test token');
      expect(output).toContain('Format: yaml');
      expect(output).toContain('⚠️  Save this token securely');
    });

    it('should show error when missing first positional argument', () => {
      const output = runCli('tokens create --type FRONTEND --org myorg');
      expect(output).toContain('Not enough non-option arguments') || expect(output).toContain('Missing required argument');
    });

    it('should show error when missing second positional argument', () => {
      const output = runCli('tokens create myaccount --type FRONTEND --org myorg');
      expect(output).toContain('Not enough non-option arguments') || expect(output).toContain('Missing required argument');
    });

    it('should show error when missing required type option', () => {
      const output = runCli('tokens create myaccount mytoken --org myorg');
      expect(output).toContain('Missing required argument: type') || expect(output).toContain('Required option');
    });

    it('should show error when missing required org option', () => {
      const output = runCli('tokens create myaccount mytoken --type FRONTEND');
      expect(output).toContain('Missing required argument: org') || expect(output).toContain('Required option');
    });

    it('should show help for tokens create command', () => {
      const output = runCli('tokens create --help');
      expect(output).toContain('Create API token');
      expect(output).toContain('serviceAccount');
      expect(output).toContain('token');
      expect(output).toContain('--type');
      expect(output).toContain('--org');
    });
  });
});
