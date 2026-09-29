import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import yargs from 'yargs';

import { fileCommands, validateCommands } from './fileCommands.js';

// get __dirname in ESM style
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Each command module records its import in a global so tests can see what was loaded.
const writeTree = async (root: string, files: string[]) => {
  for (const file of files) {
    const name = file.replace(/\.js$/, '');
    await mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await writeFile(
      path.join(root, file),
      `globalThis.__yfcLoaded.push(${JSON.stringify(name)});
export const describe = ${JSON.stringify(`describe ${name}`)};
export const handler = () => { globalThis.__yfcRan.push(${JSON.stringify(name)}); };
`,
    );
  }
};

const writeCommand = async (file: string, description: string) => {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `export const describe = ${JSON.stringify(description)};\nexport const handler = () => {};\n`);
};

const helpFor = async (commandDirs: string[], argv: string[]) => {
  const logs: string[] = [];
  const logSpy = vi.spyOn(console, 'log').mockImplementation((msg) => logs.push(String(msg)));
  try {
    await yargs(argv)
      .command(await fileCommands({ commandDirs }))
      .exitProcess(false)
      .parseAsync();
  } finally {
    logSpy.mockRestore();
  }
  return logs.join('\n');
};

const makeTree = async (files: Record<string, string>) => {
  const dir = path.join(tmpdir(), `yargs-group-def-${randomUUID()}`);
  for (const [file, source] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(dir, file)), { recursive: true });
    await writeFile(path.join(dir, file), source);
  }
  return dir;
};

const runCli = async (commandDirs: string[], argv: string[]) => {
  const logs: string[] = [];
  const logSpy = vi.spyOn(console, 'log').mockImplementation((msg) => logs.push(String(msg)));
  try {
    const argvResult = await yargs(argv)
      .command(await fileCommands({ commandDirs }))
      .exitProcess(false)
      .parseAsync();
    return { help: logs.join('\n'), argv: argvResult };
  } finally {
    logSpy.mockRestore();
  }
};

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
    // Use a unique UUID to avoid collisions with other tests
    const tempDir = path.join(tmpdir(), `yargs-empty-test-${randomUUID()}`);
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
    const tempDir1 = path.join(tmpdir(), `yargs-test-1-${randomUUID()}`);
    const tempDir2 = path.join(tmpdir(), `yargs-test-2-${randomUUID()}`);
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
    const tempDir = path.join(tmpdir(), `yargs-single-segment-${randomUUID()}`);
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
    const tempDir = path.join(tmpdir(), `yargs-validation-error-${randomUUID()}`);
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

      // Validation is off by default at runtime...
      await expect(fileCommands({ commandDirs: [tempDir], extensions: ['.ts'] })).resolves.toHaveLength(1);
      // ...and validateCommands() runs it explicitly
      await expect(validateCommands({ commandDirs: [tempDir], extensions: ['.ts'] })).rejects.toThrow(
        /has.*positional argument.*registered in builder/,
      );
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('validateCommands resolves for valid commands', async () => {
    await expect(
      validateCommands({ commandDirs: [path.join(__dirname, 'fixtures', 'commands')] }),
    ).resolves.toBeUndefined();
  });

  describe('lazy loading', () => {
    const run = async (argv: string[]) => {
      const tempDir = path.join(tmpdir(), `yargs-lazy-${randomUUID()}`);
      const g = globalThis as unknown as { __yfcLoaded: string[]; __yfcRan: string[] };
      g.__yfcLoaded = [];
      g.__yfcRan = [];
      const logs: string[] = [];
      const logSpy = vi.spyOn(console, 'log').mockImplementation((msg) => logs.push(String(msg)));
      try {
        await writeTree(tempDir, ['top.js', 'db/health.js', 'db/migrate/up.js', 'db/migrate/down.js', 'other/x.js']);
        const commands = await fileCommands({ commandDirs: [tempDir] });
        await yargs(argv).command(commands).exitProcess(false).parseAsync();
        return { loaded: [...g.__yfcLoaded].toSorted(), ran: g.__yfcRan, help: logs.join('\n') };
      } finally {
        logSpy.mockRestore();
        await rm(tempDir, { recursive: true, force: true });
      }
    };

    it('root --help imports only root-level command modules', async () => {
      const { loaded, help } = await run(['--help']);
      expect(loaded).toEqual(['top']);
      expect(help).toContain('db commands');
      expect(help).toContain('describe top');
    });

    it('group --help imports only that group level and lists its commands', async () => {
      const { loaded, help } = await run(['db', '--help']);
      expect(loaded).toEqual(['db/health', 'top']);
      expect(help).toContain('describe db/health');
      expect(help).toContain('migrate commands');
    });

    it('running a nested command imports only modules along its path', async () => {
      const { loaded, ran } = await run(['db', 'migrate', 'up']);
      expect(loaded).toEqual(['db/health', 'db/migrate/down', 'db/migrate/up', 'top']);
      expect(ran).toEqual(['db/migrate/up']);
    });

    it('validateCommands imports every command module', async () => {
      const tempDir = path.join(tmpdir(), `yargs-lazy-validate-${randomUUID()}`);
      const g = globalThis as unknown as { __yfcLoaded: string[] };
      g.__yfcLoaded = [];
      try {
        await writeTree(tempDir, ['top.js', 'db/health.js', 'db/migrate/up.js']);
        await validateCommands({ commandDirs: [tempDir] });
        expect(g.__yfcLoaded.toSorted()).toEqual(['db/health', 'db/migrate/up', 'top']);
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });

    it('validateCommands reports a command module that fails to import', async () => {
      const tempDir = path.join(tmpdir(), `yargs-lazy-broken-${randomUUID()}`);
      try {
        await mkdir(path.join(tempDir, 'db'), { recursive: true });
        await writeFile(path.join(tempDir, 'top.js'), 'export const handler = () => {};');
        await writeFile(path.join(tempDir, 'db', 'broken.js'), "throw new Error('boom');");
        // fileCommands never touches db/broken.js...
        await expect(fileCommands({ commandDirs: [tempDir] })).resolves.toHaveLength(2);
        // ...validateCommands does
        await expect(validateCommands({ commandDirs: [tempDir] })).rejects.toThrow(/Failed to import.*boom/);
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });

    it('lazy: false imports everything up front and builds groups synchronously', async () => {
      const tempDir = path.join(tmpdir(), `yargs-eager-${randomUUID()}`);
      const g = globalThis as unknown as { __yfcLoaded: string[]; __yfcRan: string[] };
      g.__yfcLoaded = [];
      g.__yfcRan = [];
      try {
        await writeTree(tempDir, ['top.js', 'db/health.js', 'db/migrate/up.js']);
        const commands = await fileCommands({ commandDirs: [tempDir], lazy: false });
        expect(g.__yfcLoaded.toSorted()).toEqual(['db/health', 'db/migrate/up', 'top']);

        // clidoc-style walk: a synchronous builder registers its children before returning
        const dbBuilder = commands.find((c) => c.command === 'db')?.builder as (y: unknown) => unknown;
        const registered: unknown[] = [];
        const recorder = { command: (c: unknown) => registered.push(c), demandCommand: () => recorder };
        const result = dbBuilder(recorder);
        expect(result).not.toBeInstanceOf(Promise);
        expect(registered.map((c) => (c as { command: string }).command)).toEqual(['health', 'migrate']);

        await yargs(['db', 'migrate', 'up']).command(commands).exitProcess(false).parseAsync();
        expect(g.__yfcRan).toEqual(['db/migrate/up']);
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe('demandCommandMessage', () => {
    const failMessage = async (argv: string[], demandCommandMessage?: string) => {
      const tempDir = path.join(tmpdir(), `yargs-demand-${randomUUID()}`);
      const g = globalThis as unknown as { __yfcLoaded: string[]; __yfcRan: string[] };
      g.__yfcLoaded = [];
      g.__yfcRan = [];
      try {
        await writeTree(tempDir, ['top.js', 'db/health.js', 'db/migrate/up.js']);
        const commands = await fileCommands({ commandDirs: [tempDir], demandCommandMessage });
        let message: string | undefined;
        await yargs(argv)
          .command(commands)
          .exitProcess(false)
          .fail((msg) => {
            message = msg;
          })
          .parseAsync();
        return message;
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    };

    it('uses the configured message for every group at any depth', async () => {
      const message = 'Please specify a subcommand';
      expect(await failMessage(['db'], message)).toBe(message);
      expect(await failMessage(['db', 'migrate'], message)).toBe(message);
    });

    it('keeps the per-group default message', async () => {
      expect(await failMessage(['db', 'migrate'])).toBe('You must specify a migrate subcommand');
    });
  });

  describe('overlays', () => {
    it('later commandDirs replace commands and add to groups from earlier ones', async () => {
      const base = path.join(tmpdir(), `yargs-overlay-base-${randomUUID()}`);
      const over = path.join(tmpdir(), `yargs-overlay-over-${randomUUID()}`);
      try {
        await writeCommand(path.join(base, 'top.js'), 'base top');
        await writeCommand(path.join(base, 'db', 'health.js'), 'base health');
        await writeCommand(path.join(base, 'db', 'backup.js'), 'base backup');
        await writeCommand(path.join(over, 'top.js'), 'overlay top');
        await writeCommand(path.join(over, 'db', 'health.js'), 'overlay health');
        await writeCommand(path.join(over, 'db', 'restore.js'), 'overlay restore');

        const rootHelp = await helpFor([base, over], ['--help']);
        expect(rootHelp).toContain('overlay top');
        expect(rootHelp).not.toContain('base top');

        const dbHelp = await helpFor([base, over], ['db', '--help']);
        expect(dbHelp).toContain('overlay health');
        expect(dbHelp).not.toContain('base health');
        expect(dbHelp).toContain('base backup');
        expect(dbHelp).toContain('overlay restore');

        // Order matters: reversed, the base directory wins
        expect(await helpFor([over, base], ['--help'])).toContain('base top');
      } finally {
        await rm(base, { recursive: true, force: true });
        await rm(over, { recursive: true, force: true });
      }
    });

    it('a command in one dir and a group of the same name in another is a conflict', async () => {
      const base = path.join(tmpdir(), `yargs-overlay-conflict-a-${randomUUID()}`);
      const over = path.join(tmpdir(), `yargs-overlay-conflict-b-${randomUUID()}`);
      try {
        await writeCommand(path.join(base, 'db', 'health.js'), 'health');
        await writeCommand(path.join(over, 'db.js'), 'db');
        await expect(fileCommands({ commandDirs: [base, over] })).rejects.toThrow(/Conflict: db/);
      } finally {
        await rm(base, { recursive: true, force: true });
        await rm(over, { recursive: true, force: true });
      }
    });

    it('two files in one directory mapping to the same command throw', async () => {
      const dir = path.join(tmpdir(), `yargs-overlay-dup-${randomUUID()}`);
      try {
        await writeCommand(path.join(dir, 'db.health.js'), 'dotted');
        await writeCommand(path.join(dir, 'db', 'health.js'), 'nested');
        await expect(fileCommands({ commandDirs: [dir] })).rejects.toThrow(/Duplicate command "db health"/);
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    });
  });

  describe('group definitions', () => {
    const leaf = `export const describe = 'check health';
export const handler = (argv) => { globalThis.__yfcArgv = argv; };
`;

    it('takes describe and aliases from command.js and hides with describe: false', async () => {
      const dir = await makeTree({
        'db/command.js': "export const describe = 'Database tools';\nexport const aliases = ['database'];\n",
        'db/health.js': leaf,
        'secret/command.js': 'export const describe = false;\n',
        'secret/x.js': leaf,
      });
      try {
        const { help } = await runCli([dir], ['--help']);
        expect(help).toContain('Database tools');
        expect(help).not.toContain('db commands');
        expect(help).not.toContain('secret');

        // Aliases and hidden groups still run
        await runCli([dir], ['database', 'health']);
        await runCli([dir], ['secret', 'x']);
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    });

    it('applies options and middleware from the group builder to its subcommands', async () => {
      const dir = await makeTree({
        'db/command.js': `export const builder = (yargs) =>
  yargs
    .option('region', { type: 'string', default: 'us', global: true })
    .middleware((argv) => { argv.fromGroup = true; });
`,
        'db/health.js': leaf,
      });
      try {
        await runCli([dir], ['db', 'health', '--region', 'eu']);
        const argv = (globalThis as unknown as { __yfcArgv: Record<string, unknown> }).__yfcArgv;
        expect(argv.region).toBe('eu');
        expect(argv.fromGroup).toBe(true);
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    });

    it('an overlay command.js replaces the description of a group from an earlier dir', async () => {
      const base = await makeTree({ 'db/command.js': "export const describe = 'generated';\n", 'db/health.js': leaf });
      const over = await makeTree({ 'db/command.js': "export const describe = 'hand-written';\n" });
      try {
        const { help } = await runCli([base, over], ['--help']);
        expect(help).toContain('hand-written');
        expect(help).not.toContain('generated');
      } finally {
        await rm(base, { recursive: true, force: true });
        await rm(over, { recursive: true, force: true });
      }
    });

    it('a group definition with a handler is a conflict', async () => {
      const dir = await makeTree({
        'db.js': 'export const handler = () => {};\n',
        'db/health.js': leaf,
        'tools/command.js': "export const describe = 'tools';\n",
        'tools/cache.js': 'export const handler = () => {};\n',
        'tools/cache/clear.js': leaf,
      });
      try {
        // Root-level group definitions load up front
        await expect(fileCommands({ commandDirs: [dir] })).rejects.toThrow(/Conflict: db is both a directory/);
        // Nested ones are caught by validateCommands
        await rm(path.join(dir, 'db.js'));
        await expect(fileCommands({ commandDirs: [dir] })).resolves.toHaveLength(2);
        await expect(validateCommands({ commandDirs: [dir] })).rejects.toThrow(/Conflict: cache is both a directory/);
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    });
  });
});
