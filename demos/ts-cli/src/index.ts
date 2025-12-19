import { createRequire } from 'node:module';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PackageJson } from 'type-fest';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { fileCommands } from 'yargs-file-commands';

const require = createRequire(import.meta.url);
const packageInfo = require('../package.json') as PackageJson;
const distDir = path.dirname(fileURLToPath(import.meta.url));

export const main = async () => {
  const commandsDir = path.join(distDir, 'commands');
  const yargsInstance = yargs(hideBin(process.argv));

  if (packageInfo.name) {
    yargsInstance.scriptName(packageInfo.name);
  }

  if (packageInfo.version) {
    yargsInstance.version(packageInfo.version);
  }

  return yargsInstance
    .command(await fileCommands({ commandDirs: [commandsDir] }))
    .demandCommand(1, 'No command specified - use --help for available commands')
    .showHelpOnFail(true)
    .help().argv;
};

// Call main when this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
