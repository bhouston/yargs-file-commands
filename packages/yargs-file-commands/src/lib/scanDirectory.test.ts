import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

import { scanDirectory } from '../lib/scanDirectory.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('scanDirectory', () => {
  it('should find all command files in directory', async () => {
    const commandsDir = path.join(__dirname, 'fixtures', 'commands');
    console.log('Scan Directory: ', commandsDir);
    const files = await scanDirectory(commandsDir, commandsDir, {
      extensions: ['.ts'],
      logLevel: 'debug',
    });

    expect(files.length).toBe(4);
    expect(files.some((f) => f.includes('health.ts'))).toBe(true);
    expect(files.some((f) => f.includes('command.ts'))).toBe(true);
  });

  it('should respect ignore patterns', async () => {
    const commandsDir = path.join(__dirname, 'fixtures', 'commands');
    console.log('Scan Directory: ', commandsDir);
    const files = await scanDirectory(commandsDir, commandsDir, {
      extensions: ['.ts'],
      ignorePatterns: [/health/, /\.d\.ts$/],
      logLevel: 'debug',
    });

    expect(files.length).toBe(3);
    expect(files.some((f) => f.includes('command.ts'))).toBe(true);
    expect(files.some((f) => f.includes('health.ts'))).toBe(false);
  });

  it('should handle non-existent directories', async () => {
    const nonExistentDir = path.join(__dirname, 'fixtures', 'non-existent');
    await expect(
      scanDirectory(nonExistentDir, nonExistentDir, {
        extensions: ['.ts'],
        logLevel: 'debug',
      }),
    ).rejects.toThrow(/ENOENT/);
  });

  it('should ignore files with non-matching extensions', async () => {
    // Create a temporary directory with mixed file types
    const tempDir = path.join(tmpdir(), `yargs-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });

    try {
      // Create files with different extensions
      await writeFile(path.join(tempDir, 'valid.ts'), '// TS file');
      await writeFile(path.join(tempDir, 'invalid.js'), '// JS file');
      await writeFile(path.join(tempDir, 'invalid.txt'), '// TXT file');

      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      const files = await scanDirectory(tempDir, tempDir, {
        extensions: ['.ts'], // Only .ts files
        logLevel: 'debug',
      });

      // Should only find the .ts file
      expect(files.length).toBe(1);
      expect(files[0]).toContain('valid.ts');
      expect(files.some((f) => f.includes('invalid.js'))).toBe(false);
      expect(files.some((f) => f.includes('invalid.txt'))).toBe(false);

      // Should log extension mismatch
      const debugCalls = consoleSpy.mock.calls.map((call) => call[0]?.toString() || '');
      expect(debugCalls.some((call) => call.includes("doesn't match required extension"))).toBe(true);

      consoleSpy.mockRestore();
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should handle custom extensions', async () => {
    // Create a temporary directory with .js files
    const tempDir = path.join(tmpdir(), `yargs-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });

    try {
      await writeFile(path.join(tempDir, 'cmd.js'), '// JS file');
      await writeFile(path.join(tempDir, 'cmd.ts'), '// TS file');

      const files = await scanDirectory(tempDir, tempDir, {
        extensions: ['.js'], // Only .js files
      });

      expect(files.length).toBe(1);
      expect(files[0]).toContain('cmd.js');
      expect(files.some((f) => f.includes('cmd.ts'))).toBe(false);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should handle multiple extensions', async () => {
    // Create a temporary directory with different file types
    const tempDir = path.join(tmpdir(), `yargs-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });

    try {
      await writeFile(path.join(tempDir, 'cmd1.js'), '// JS file');
      await writeFile(path.join(tempDir, 'cmd2.ts'), '// TS file');
      await writeFile(path.join(tempDir, 'cmd3.txt'), '// TXT file');

      const files = await scanDirectory(tempDir, tempDir, {
        extensions: ['.js', '.ts'], // Both JS and TS files
        // Note: Hidden files (starting with '.') are automatically ignored by system ignore patterns
      });

      // Should find exactly 2 files (cmd1.js and cmd2.ts)
      const jsFiles = files.filter((f) => f.includes('cmd1.js'));
      const tsFiles = files.filter((f) => f.includes('cmd2.ts'));
      const txtFiles = files.filter((f) => f.includes('cmd3.txt'));

      expect(jsFiles.length).toBe(1);
      expect(tsFiles.length).toBe(1);
      expect(txtFiles.length).toBe(0);

      // Verify we have at least our expected files (there might be hidden files)
      expect(files.some((f) => f.includes('cmd1.js'))).toBe(true);
      expect(files.some((f) => f.includes('cmd2.ts'))).toBe(true);
      expect(files.some((f) => f.includes('cmd3.txt'))).toBe(false);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should handle nested directories with extension filtering', async () => {
    // Create a temporary directory structure
    const tempDir = path.join(tmpdir(), `yargs-test-${Date.now()}`);
    const subDir = path.join(tempDir, 'subdir');
    await mkdir(subDir, { recursive: true });

    try {
      await writeFile(path.join(tempDir, 'root.ts'), '// Root TS file');
      await writeFile(path.join(tempDir, 'root.js'), '// Root JS file');
      await writeFile(path.join(subDir, 'nested.ts'), '// Nested TS file');
      await writeFile(path.join(subDir, 'nested.js'), '// Nested JS file');

      const files = await scanDirectory(tempDir, tempDir, {
        extensions: ['.ts'],
        // Note: Hidden files (starting with '.') are automatically ignored by system ignore patterns
      });

      // Should find exactly 2 files (root.ts and nested.ts)
      const rootFiles = files.filter((f) => f.includes('root.ts'));
      const nestedFiles = files.filter((f) => f.includes('nested.ts'));
      const jsFiles = files.filter((f) => f.includes('.js'));

      expect(rootFiles.length).toBe(1);
      expect(nestedFiles.length).toBe(1);
      expect(jsFiles.length).toBe(0);
      expect(files.some((f) => f.includes('root.ts'))).toBe(true);
      expect(files.some((f) => f.includes('nested.ts'))).toBe(true);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should use default options when not provided', async () => {
    const commandsDir = path.join(__dirname, 'fixtures', 'commands');
    const files = await scanDirectory(commandsDir, commandsDir);

    // Should use default extensions (.js, .ts) and find files
    expect(files.length).toBeGreaterThan(0);
  });

  it('should handle empty directories', async () => {
    const tempDir = path.join(tmpdir(), `yargs-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });

    try {
      const files = await scanDirectory(tempDir, tempDir, {
        extensions: ['.ts'],
        // Note: Hidden files (starting with '.') are automatically ignored by system ignore patterns
      });

      expect(files.length).toBe(0);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should handle error with proper message formatting', async () => {
    const nonExistentDir = path.join(__dirname, 'fixtures', 'non-existent');
    await expect(
      scanDirectory(nonExistentDir, nonExistentDir, {
        extensions: ['.ts'],
        logPrefix: '  ',
      }),
    ).rejects.toThrow(/Failed to scan directory/);
  });
});
