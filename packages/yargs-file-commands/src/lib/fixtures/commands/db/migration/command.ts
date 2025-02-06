export const describe = 'Database migration command';

export const builder = (yargs: any) => {
  return yargs.option('force', {
    type: 'boolean',
    describe: 'Force migration'
  });
};

export const handler = async (argv: any) => {
  console.log('Migration handler called');
};
