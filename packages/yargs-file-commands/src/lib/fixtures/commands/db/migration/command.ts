import type { ArgumentsCamelCase, Argv } from 'yargs';

export const describe = 'Database migration command';

export const builder = (yargs: Argv) =>
  yargs.option('force', {
    type: 'boolean',
    describe: 'Force migration',
  });

type Options = {
  force?: boolean;
};

export const handler = async (_argv: ArgumentsCamelCase<Options>) => {
  console.log('Migration handler called');
};
