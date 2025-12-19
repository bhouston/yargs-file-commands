import { defineCommand } from 'yargs-file-commands';
import { descriptionOption, formatOption, getOrgOption, getProjectOptionalOption, TokenType } from '../../lib/args.js';

export const command = defineCommand({
  // biome-ignore lint/security/noSecrets: False positive - these are parameter names, not secrets
  command: 'create <serviceAccount> <token>',
  describe: 'Create API token',
  builder: (yargs) =>
    yargs
      // biome-ignore lint/security/noSecrets: False positive - this is a parameter name, not a secret
      .positional('serviceAccount', {
        type: 'string',
        description: 'Service account name',
        demandOption: true,
      })
      .positional('token', {
        type: 'string',
        description: 'Token name',
        demandOption: true,
      })
      .options({
        type: {
          type: 'string',
          choices: TokenType,
          description: 'Token type',
          demandOption: true,
        },
        'domain-whitelist': {
          type: 'string',
          description: 'Domain whitelist (for FRONTEND tokens)',
        },
        ...getOrgOption(),
        ...getProjectOptionalOption(),
        ...descriptionOption,
        ...formatOption,
      }),
  handler: async (argv) => {
    // Output the parsed arguments to verify they're correctly parsed
    console.log('Creating API token with:');
    console.log(`  Service Account: ${argv.serviceAccount}`);
    console.log(`  Token: ${argv.token}`);
    console.log(`  Type: ${argv.type}`);
    if (argv['domain-whitelist']) {
      console.log(`  Domain Whitelist: ${argv['domain-whitelist']}`);
    }
    if (argv.org) {
      console.log(`  Org: ${argv.org}`);
    }
    if (argv.project) {
      console.log(`  Project: ${argv.project}`);
    }
    if (argv.description) {
      console.log(`  Description: ${argv.description}`);
    }
    console.log(`  Format: ${argv.format}`);

    // Simulate token creation
    const tokenValue = `token_${argv.serviceAccount}_${argv.token}_${Date.now()}`;
    console.log(`\nToken created: ${tokenValue}`);

    if (argv.type === 'SECRET') {
      console.log('⚠️  Save this token securely - it will not be shown again!');
    }
  },
});
