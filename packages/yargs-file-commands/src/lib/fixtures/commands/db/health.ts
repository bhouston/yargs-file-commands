import type { Argv } from 'yargs';

export const describe = 'Database health check';

export const builder = (yargs: Argv) => yargs;

export const handler = async () => {
  console.log('Health check handler called');
};
