import type { ArgumentsCamelCase, CommandModule } from 'yargs';

type TriageArgs = {
  owner: string;
  repo: string;
  issue: number;
};

export const command: CommandModule<object, TriageArgs> = {
  command: 'triage <owner> <repo> <issue>',
  describe: 'Triage a GitHub issue',
  builder: {
    owner: {
      type: 'string',
      description: 'GitHub repository owner',
      demandOption: true
    },
    repo: {
      type: 'string',
      description: 'GitHub repository name',
      demandOption: true
    },
    issue: {
      type: 'number',
      description: 'Issue number',
      demandOption: true
    }
  },
  handler: async (argv: ArgumentsCamelCase<TriageArgs>) => {
    console.log('owner', argv.owner);
    console.log('repo', argv.repo);
    console.log('issue', argv.issue);
  }
};
