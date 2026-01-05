import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import { fileCommands } from './fileCommands.js';

// get __dirname in ESM style
const __dirname = path.dirname(new URL(import.meta.url).pathname);

describe('fileCommands', () => {
  it('should load commands from directory structure', async () => {
    const commands = await fileCommands({
      commandDirs: [path.join(__dirname, 'fixtures', 'commands')],
      logLevel: 'debug',
    });

    expect(commands.length).toBeGreaterThan(0);
  });

  it('should respect ignore patterns', async () => {
    const commands = await fileCommands({
      commandDirs: [path.join(__dirname, 'fixtures', 'commands')],
      ignorePatterns: [/health/, /.d.ts/],
      logLevel: 'debug',
    });

    expect(commands.length).toBeGreaterThan(0);
  });

  it('should handle explicit commands and default command', async () => {
    const commands = await fileCommands({
      commandDirs: [path.join(__dirname, 'fixtures', 'commands')],
      logLevel: 'debug',
    });

    console.log(
      'commands',
      JSON.stringify(
        commands.map((c) => c.command),
        null,
        2,
      ),
    );
    // Find the explicit command
    const explicitCommand = commands.find((cmd) => cmd.command?.toString().includes('create [name]'));
    expect(explicitCommand).toBeDefined();
    expect(explicitCommand?.describe).toBe('Create something with a name');

    // Find the default command
    const defaultCommand = commands.find((cmd) => cmd.command === '$0');
    expect(defaultCommand).toBeDefined();
    expect(defaultCommand?.describe).toBe('Default command');
  });

  it('should throw error for invalid extensions (missing dot)', async () => {
    await expect(
      fileCommands({
        commandDirs: [path.join(__dirname, 'fixtures', 'commands')],
        extensions: ['js', 'ts'], // Missing dots
      }),
    ).rejects.toThrow(/Invalid extensions provided, must start with a dot/);
  });

  it('should throw error for empty command directories', async () => {
    await expect(
      fileCommands({
        commandDirs: [],
      }),
    ).rejects.toThrow(/No command directories provided/);
  });

  it('should throw error for non-absolute directory paths', async () => {
    await expect(
      fileCommands({
        commandDirs: ['relative/path'], // Relative path
      }),
    ).rejects.toThrow(/Command directories must be absolute paths/);
  });

  it('should throw error for non-absolute directory paths (multiple)', async () => {
    await expect(
      fileCommands({
        commandDirs: [path.join(__dirname, 'fixtures', 'commands'), 'relative/path', 'another/relative'],
      }),
    ).rejects.toThrow(/Command directories must be absolute paths/);
    await expect(
      fileCommands({
        commandDirs: [path.join(__dirname, 'fixtures', 'commands'), 'relative/path', 'another/relative'],
      }),
    ).rejects.toThrow(/relative\/path, another\/relative/);
  });

  it('should throw error when no commands found', async () => {
    // Create a temporary empty directory
    // Use a unique timestamp to avoid collisions with other tests
    const tempDir = path.join(tmpdir(), `yargs-empty-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(tempDir, { recursive: true });

    try {
      // Ensure directory is truly empty (system files like .DS_Store are automatically ignored)
      await expect(
        fileCommands({
          commandDirs: [tempDir],
          extensions: ['.js', '.ts'], // Only look for JS/TS files
        }),
      ).rejects.toThrow(/No commands found in specified directories/);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should handle multiple command directories', async () => {
    const tempDir1 = path.join(tmpdir(), `yargs-test-1-${Date.now()}`);
    const tempDir2 = path.join(tmpdir(), `yargs-test-2-${Date.now()}`);
    await mkdir(tempDir1, { recursive: true });
    await mkdir(tempDir2, { recursive: true });

    try {
      // Create a command file in each directory
      await writeFile(
        path.join(tempDir1, 'cmd1.ts'),
        "export const describe = 'Command 1';\nexport const handler = async () => {};",
      );
      await writeFile(
        path.join(tempDir2, 'cmd2.ts'),
        "export const describe = 'Command 2';\nexport const handler = async () => {};",
      );

      const commands = await fileCommands({
        commandDirs: [tempDir1, tempDir2],
      });

      expect(commands.length).toBeGreaterThanOrEqual(2);
    } finally {
      await rm(tempDir1, { recursive: true, force: true });
      await rm(tempDir2, { recursive: true, force: true });
    }
  });

  it('should use default options when not provided', async () => {
    const commands = await fileCommands({
      commandDirs: [path.join(__dirname, 'fixtures', 'commands')],
      // No other options provided - should use defaults
    });

    expect(commands.length).toBeGreaterThan(0);
  });

  it('should handle custom extensions', async () => {
    const commands = await fileCommands({
      commandDirs: [path.join(__dirname, 'fixtures', 'commands')],
      extensions: ['.ts'], // Only TypeScript files
    });

    expect(commands.length).toBeGreaterThan(0);
  });

  it('should handle validation disabled', async () => {
    const commands = await fileCommands({
      commandDirs: [path.join(__dirname, 'fixtures', 'commands')],
      validation: false,
    });

    expect(commands.length).toBeGreaterThan(0);
  });

  it('should test debug logging for command importing', async () => {
    const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    await fileCommands({
      commandDirs: [path.join(__dirname, 'fixtures', 'commands')],
      logLevel: 'debug',
    });

    // Check that debug logging for importing commands was called
    const debugCalls = consoleSpy.mock.calls.map((call) => call[0]?.toString() || '');
    expect(debugCalls.some((call) => call.includes('importing command module'))).toBe(true);

    consoleSpy.mockRestore();
  });

  it('should test debug logging for command tree', async () => {
    const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    await fileCommands({
      commandDirs: [path.join(__dirname, 'fixtures', 'commands')],
      logLevel: 'debug',
    });

    // Check that debug logging for command tree was called
    const debugCalls = consoleSpy.mock.calls.map((call) => call[0]?.toString() || '');
    expect(debugCalls.some((call) => call.includes('Command tree structure'))).toBe(true);

    consoleSpy.mockRestore();
  });

  it('should handle single-segment files correctly', async () => {
    // Test files with only one segment (no directory structure)
    const tempDir = path.join(tmpdir(), `yargs-single-segment-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });

    try {
      await writeFile(
        path.join(tempDir, 'single.ts'),
        "export const describe = 'Single segment command';\nexport const handler = async () => {};",
      );

      const commands = await fileCommands({
        commandDirs: [tempDir],
        extensions: ['.ts'],
      });

      expect(commands.length).toBeGreaterThan(0);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should handle commands with validation errors gracefully', async () => {
    // Create a command file with positional arguments not declared in command string
    const tempDir = path.join(tmpdir(), `yargs-validation-error-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });

    try {
      // Use individual exports style instead of defineCommand to avoid import issues
      await writeFile(
        path.join(tempDir, 'bad.ts'),
        `export const command = 'bad'; // Missing positional declaration
export const describe = 'Bad command';
export const builder = (yargs) => yargs.positional('name', { type: 'string' });
export const handler = async () => {};`,
      );

      // This should throw a validation error
      await expect(
        fileCommands({
          commandDirs: [tempDir],
          extensions: ['.ts'],
          validation: true,
        }),
      ).rejects.toThrow(/has.*positional argument.*registered in builder/);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
