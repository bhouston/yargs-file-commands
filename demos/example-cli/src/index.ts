import { createRequire } from 'module';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { fileCommands } from 'yargs-file-commands';

const require = createRequire(import.meta.url);
const packageInfo = require('../package.json');

export const main = async () => {
  const rootCommandDir = path.join(
    import.meta.url.replace('file://', ''),
    '../commands'
  );

  return yargs(hideBin(process.argv))
    .scriptName(packageInfo.name)
    .version(packageInfo.version)
    .command(await fileCommands({ rootDirs: [rootCommandDir] }))
    .help().argv;
};
