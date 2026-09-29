import { createRequire } from 'node:module';
import { type DocumentFormat, infoFromPackageJson, writeOpenCliDocument } from '@clidoc/core';
import { fromYargs } from '@clidoc/yargs';
import { defineCommand, fileCommands } from 'yargs-file-commands';

const packageInfo = createRequire(import.meta.url)('../../package.json');

export const command = defineCommand({
  describe: 'Write the OpenCLI document for this CLI (https://clidoc.dev)',
  builder: (yargs) =>
    yargs
      .option('format', {
        type: 'string',
        choices: ['json', 'yaml', 'markdown'] as const,
        default: 'json',
        describe: 'Output format',
      })
      .option('output', { type: 'string', alias: 'o', describe: 'Output file; defaults to stdout' }),
  handler: async (argv) => {
    // clidoc walks builders synchronously, so load the whole command tree up front instead of lazily
    const commands = await fileCommands({ commandDirs: [import.meta.dirname], lazy: false });
    const document = fromYargs(commands, infoFromPackageJson(packageInfo));
    await writeOpenCliDocument(document, argv.output, argv.format as DocumentFormat);
  },
});
