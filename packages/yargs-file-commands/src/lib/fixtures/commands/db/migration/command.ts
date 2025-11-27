export const describe = 'Database migration command';

export const builder = (yargs: any) =>
  yargs.option('force', {
    type: 'boolean',
    describe: 'Force migration',
  });

export const handler = async (_argv: any) => {
  console.log('Migration handler called');
};
