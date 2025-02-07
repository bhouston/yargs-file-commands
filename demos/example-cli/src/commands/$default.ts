import type { ArgumentsCamelCase } from 'yargs';

export const command = '* [word]';

export const describe = 'Default command';

type Options = {
  word: string;
};

export const builder = (yargs: any) => {
  yargs.positional('word', {
    describe: 'Word to be printed',
    type: 'string',
    default: 'Hello'
  });
};

export const handler = async (argv: ArgumentsCamelCase<Options>) => {
  console.log('Default command executed with word:', argv.word);
};
