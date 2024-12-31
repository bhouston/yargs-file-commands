import type { ArgumentsCamelCase, Argv } from 'yargs';

export interface Options {
  port?: number;
}

export const describe = 'Studio web interface';

export const builder = (args: Argv): Argv<Options> => {
  const result = args.option('port', {
    alias: 'p',
    type: 'number',
    describe: 'Port to listen on'
  });
  return result;
};
export const handler = async (args: ArgumentsCamelCase<Options>) => {
  // Implementation
  console.log('Starting studio on port', args.port);
};
