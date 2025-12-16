import type { Argv } from 'yargs';

/**
 * Shared helper to add pagination options to a command.
 * Using a function allows chaining and correct type inference in the builder.
 */
export const withPagination = <T>(yargs: Argv<T>) =>
  yargs
    .option('page', {
      type: 'number',
      default: 1,
      describe: 'Page number to retrieve',
    })
    .option('limit', {
      type: 'number',
      default: 10,
      describe: 'Number of items per page',
    });

/**
 * Shared options object that can be spread into a builder object.
 * Useful when using the object-style builder.
 */
export const commonOptions = {
  verbose: {
    alias: 'v',
    type: 'boolean',
    describe: 'Run with verbose logging',
    default: false,
  } as const,
  dryRun: {
    type: 'boolean',
    describe: 'Simulate the command without making changes',
    default: false,
  } as const,
};
