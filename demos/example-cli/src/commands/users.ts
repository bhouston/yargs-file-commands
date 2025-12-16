import { defineCommand } from 'yargs-file-commands';
import { commonOptions, withPagination } from '../shared.js';

export const command = defineCommand({
  command: 'users <action>',
  describe: 'Manage users',
  builder: (yargs) => {
    // 1. Add positional argument
    return withPagination(
      yargs
        .positional('action', {
          describe: 'Action to perform on users',
          choices: ['list', 'create', 'delete'] as const,
          demandOption: true,
        })
        // 2. Spread common options (need to cast to specific option type if strictly typed,
        // but yargs builder usually accepts options object)
        .options(commonOptions),
    );
  },
  handler: async (argv) => {
    // Types are correctly inferred here!
    const { action, page, limit, verbose, dryRun } = argv;

    console.log(`Executing users command: ${action}`);

    if (verbose) {
      console.log('Verbose mode enabled');
      console.log(`Configuration: page=${page}, limit=${limit}, dryRun=${dryRun}`);
    }

    if (dryRun) {
      console.log('[DRY RUN] No changes will be made.');
      return;
    }

    // Simulate work
    console.log(`Processing users... (Page ${page}, Limit ${limit})`);
  },
});
