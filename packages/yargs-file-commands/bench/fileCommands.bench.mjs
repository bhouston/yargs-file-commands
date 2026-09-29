// Startup benchmark for fileCommands against a large synthetic command tree,
// sized like a big real-world CLI (~4k commands, e.g. cloudflare/cf).
//
// Usage: pnpm bench   (builds dist first)
//
// Each scenario runs in a fresh child process so the ESM module cache is cold,
// exactly as it is for a real CLI invocation.
import { fork } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const PRODUCTS = 110;
const GROUPS_PER_PRODUCT = 6;
const LEAVES_PER_GROUP = 6;
// Every command imports a shared "SDK" module that costs this much to evaluate once.
const SHARED_MODULE_MS = 150;
// Every Nth command also has its own expensive top-level work (heavy per-command deps).
const SLOW_LEAF_EVERY = 10;
const SLOW_LEAF_MS = 5;

// Synchronous busy-wait: module evaluation is synchronous CPU work, so this is
// a faithful stand-in for parsing/evaluating a large dependency.
const burn = (ms) => `{ const end = performance.now() + ${ms}; while (performance.now() < end) {} }`;

const generateTree = (root) => {
  const commandsDir = path.join(root, 'commands');
  mkdirSync(path.join(root, 'lib'));
  writeFileSync(path.join(root, 'lib', 'sdk.js'), `${burn(SHARED_MODULE_MS)}\nexport const sdk = {};\n`);

  let count = 0;
  for (let p = 0; p < PRODUCTS; p++) {
    for (let g = 0; g < GROUPS_PER_PRODUCT; g++) {
      const dir = path.join(commandsDir, `p${p}`, `g${g}`);
      mkdirSync(dir, { recursive: true });
      for (let l = 0; l < LEAVES_PER_GROUP; l++) {
        const slow = count++ % SLOW_LEAF_EVERY === 0 ? `${burn(SLOW_LEAF_MS)}\n` : '';
        writeFileSync(
          path.join(dir, `l${l}.js`),
          `import { sdk } from '../../../lib/sdk.js';
${slow}export const command = {
  command: 'l${l} <id>',
  describe: 'Leaf ${l} of p${p} g${g}',
  builder: (yargs) => yargs.positional('id', { type: 'string' }).option('x', { type: 'string' }),
  handler: () => { void sdk; },
};
`,
        );
      }
    }
  }
  return { commandsDir, count };
};

const SCENARIOS = [
  { name: 'root --help', argv: ['--help'] },
  { name: 'group --help', argv: ['p3', '--help'] },
  { name: 'run leaf', argv: ['p3', 'g2', 'l1', 'abc', '--x', 'y'] },
];

const runChild = async () => {
  const [commandsDir, validation, ...argv] = process.argv.slice(3);
  const t0 = performance.now();
  const [{ fileCommands }, { default: yargs }] = await Promise.all([import('../dist/index.js'), import('yargs')]);
  const t1 = performance.now();
  const commands = await fileCommands({ commandDirs: [commandsDir], validation: validation === 'true' });
  const t2 = performance.now();
  await yargs(argv).command(commands).exitProcess(false).parseAsync();
  const t3 = performance.now();
  process.send({ loadMs: t1 - t0, fileCommandsMs: t2 - t1, parseMs: t3 - t2, totalMs: t3 - t0 });
};

const runScenario = (commandsDir, validation, argv) =>
  new Promise((resolve, reject) => {
    const child = fork(import.meta.filename, ['--child', commandsDir, String(validation), ...argv], {
      // Swallow help/command output; timings come back over IPC.
      stdio: ['ignore', 'ignore', 'inherit', 'ipc'],
    });
    let result;
    child.on('message', (message) => (result = message));
    child.on('error', reject);
    child.on('exit', (code) => (result ? resolve(result) : reject(new Error(`child exited ${code}`))));
  });

const main = async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'yfc-bench-'));
  try {
    const { commandsDir, count } = generateTree(root);
    console.log(
      `${count} commands; shared module ${SHARED_MODULE_MS}ms, every ${SLOW_LEAF_EVERY}th command +${SLOW_LEAF_MS}ms\n`,
    );
    const rows = [];
    for (const validation of [false, true]) {
      for (const { name, argv } of SCENARIOS) {
        const r = await runScenario(commandsDir, validation, argv);
        rows.push({
          scenario: name,
          validation,
          'fileCommands ms': Math.round(r.fileCommandsMs),
          'parse ms': Math.round(r.parseMs),
          'total ms': Math.round(r.totalMs),
        });
      }
    }
    console.table(rows);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

await (process.argv[2] === '--child' ? runChild() : main());
