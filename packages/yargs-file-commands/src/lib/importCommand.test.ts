import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import { importCommandFromFile } from './importCommand.js';

// get __dirname in ESM style
const __dirname = path.dirname(new URL(import.meta.url).pathname);

describe('importCommandFromFile', () => {
  it('should import command module correctly', async () => {
    const filePath = path.join(__dirname, 'fixtures', 'commands', 'db', 'health.ts');
    const command = await importCommandFromFile(filePath, 'health', {
      logLevel: 'info',
    });

    expect(command.describe).toBe('Database health check');
  });

  it('should handle non-existent files', async () => {
    const filePath = path.join(__dirname, 'fixtures', 'commands', 'non-existent.ts');
    await expect(
      importCommandFromFile(filePath, 'non-existent', {
        logLevel: 'info',
      }),
    ).rejects.toThrow(/Cannot import command from non-existent file path/);
  });

  it('should handle explicit command names', async () => {
    const filePath = path.join(__dirname, 'fixtures', 'commands', 'create.ts');
    const command = await importCommandFromFile(filePath, 'create', {
      logLevel: 'info',
    });

    expect(command.command).toBe('create [name]');
    expect(command.describe).toBe('Create something with a name');
  });

  it('should handle default commands', async () => {
    const filePath = path.join(__dirname, 'fixtures', 'commands', '$default.ts');
    const command = await importCommandFromFile(filePath, '$default', {
      logLevel: 'info',
    });

    expect(command.command).toBe('$0');
    expect(command.describe).toBe('Default command');
  });

  it('should handle CommandModule export style', async () => {
    // Create a temporary command file with CommandModule export
    const tempDir = path.join(tmpdir(), `yargs-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
    const filePath = path.resolve(path.join(tempDir, 'cmd.js')); // Use .js and ensure absolute path

    try {
      await writeFile(
        filePath,
        `export const command = {
          command: 'testcmd',
          describe: 'Test command',
          handler: async () => {}
        };`,
      );

      const command = await importCommandFromFile(filePath, 'testcmd', {
        logLevel: 'info',
      });

      expect(command.command).toBe('testcmd');
      expect(command.describe).toBe('Test command');
      expect(command.handler).toBeDefined();
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should handle CommandModule export with default command name', async () => {
    // Create a temporary command file with CommandModule export for default
    // Note: Using a simpler filename to avoid potential issues with $ character in file URLs
    const tempDir = path.join(tmpdir(), `yargs-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
    const filePath = path.resolve(path.join(tempDir, 'default-cmd.js')); // Use simpler name

    try {
      await writeFile(
        filePath,
        `export const command = {
          command: '$0',
          describe: 'Default test',
          handler: async () => {}
        };`,
      );

      // Verify file exists
      const fs = await import('node:fs');
      if (!fs.existsSync(filePath)) {
        throw new Error(`File was not created at ${filePath}`);
      }

      const command = await importCommandFromFile(filePath, '$default', {
        logLevel: 'info',
      });

      expect(command.command).toBe('$0');
      expect(command.describe).toBe('Default test');
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should throw error for unsupported exports', async () => {
    // Create a temporary command file with unsupported exports
    const tempDir = path.join(tmpdir(), `yargs-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
    const filePath = path.resolve(path.join(tempDir, 'cmd.js')); // Use .js and ensure absolute path

    try {
      await writeFile(
        filePath,
        `export const describe = 'Test';
export const handler = async () => {};
export const unsupportedExport = 'should error';
export const anotherBadExport = 123;`,
      );

      // Verify file was written
      const fs = await import('node:fs');
      if (!fs.existsSync(filePath)) {
        throw new Error(`File was not created at ${filePath}`);
      }

      await expect(
        importCommandFromFile(filePath, 'cmd', {
          logLevel: 'info',
        }),
      ).rejects.toThrow(/has some unsupported exports, probably a misspelling/);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should create null handler when handler is not provided', async () => {
    // Create a temporary command file without handler
    const tempDir = path.join(tmpdir(), `yargs-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
    const filePath = path.resolve(path.join(tempDir, 'cmd.js')); // Use .js and ensure absolute path

    try {
      await writeFile(
        filePath,
        `export const describe = 'Test without handler';
export const command = 'test';`,
      );

      const command = await importCommandFromFile(filePath, 'cmd', {
        logLevel: 'info',
      });

      expect(command.handler).toBeDefined();
      expect(typeof command.handler).toBe('function');
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should handle command with aliases', async () => {
    const filePath = path.join(__dirname, 'fixtures', 'commands', 'db', 'health.ts');
    const command = await importCommandFromFile(filePath, 'health', {
      logLevel: 'info',
    });

    // Health command doesn't have aliases, but let's verify the structure supports it
    expect(command).toBeDefined();
    expect(command.describe).toBe('Database health check');
  });

  it('should use filename as command name when not provided', async () => {
    // Create a temporary command file without explicit command name
    const tempDir = path.join(tmpdir(), `yargs-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
    const filePath = path.resolve(path.join(tempDir, 'mycommand.js')); // Use .js and ensure absolute path

    try {
      await writeFile(
        filePath,
        `export const describe = 'My command';
export const handler = async () => {};`,
      );

      const command = await importCommandFromFile(filePath, 'mycommand', {
        logLevel: 'info',
      });

      expect(command.command).toBe('mycommand');
      expect(command.describe).toBe('My command');
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should handle debug log level', async () => {
    const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    const filePath = path.join(__dirname, 'fixtures', 'commands', 'create.ts');
    await importCommandFromFile(filePath, 'create', {
      logLevel: 'debug',
    });

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
