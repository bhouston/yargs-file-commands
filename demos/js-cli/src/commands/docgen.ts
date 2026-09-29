import { createRequire } from 'node:module';
import { type DocumentFormat, infoFromPackageJson, writeOpenCliDocument } from '@clidoc/core';
import { fromYargsAsync } from '@clidoc/yargs';
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
    const commands = await fileCommands({ commandDirs: [import.meta.dirname] });
    const document = await fromYargsAsync(commands, infoFromPackageJson(packageInfo));
    await writeOpenCliDocument(document, argv.output, argv.format as DocumentFormat);
  },
});
