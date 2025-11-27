export const describe = 'Database health check';

export const builder = (yargs: any) => yargs;

export const handler = async () => {
  console.log('Health check handler called');
};
