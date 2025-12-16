import { defineCommand } from 'yargs-file-commands';

export const command = defineCommand({
  describe: 'Tells you a short joke',
  builder: (yargs) =>
    yargs.option('kind', {
      choices: ['nerdy', 'dad'] as const,
      default: 'nerdy',
      describe: 'The kind of joke to tell',
    }),
  handler: async (argv) => {
    // In some environments, yargs choices inference defaults to string.
    // However, we can assert it because we know the validator enforces it.
    const kind = argv.kind as 'nerdy' | 'dad';

    if (kind === 'nerdy') {
      console.log(
        `Q: Why did the TypeScript developer get kicked out of the library?\n` +
          `A: They kept trying to enforce strict types on all the books and ` +
          `wouldn't let anyone check anything out without proper type declarations!`,
      );
    } else {
      console.log('Q: What do you call a fake noodle? A: An impasta!');
    }
  },
});
