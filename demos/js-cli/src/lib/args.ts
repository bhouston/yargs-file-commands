/**
 * Shared option helper functions for use with .options() spread pattern.
 * These functions return option objects that can be spread into yargs.options() calls.
 */

/**
 * Token type choices for the reproduction case.
 */
export const TokenType = ['FRONTEND', 'SECRET', 'API'] as const;
export type TokenType = (typeof TokenType)[number];

/**
 * Format types for output.
 */
export const FormatType = ['json', 'yaml', 'csv'] as const;
export type FormatType = (typeof FormatType)[number];

/**
 * Get org option definition with dynamic default handling.
 * Returns an option object that can be spread into .options().
 */
export const getOrgOption = () => {
  // In a real scenario, this might check config files or environment variables
  // For the reproduction case, we'll make it required
  return {
    org: {
      type: 'string' as const,
      description: 'Organization name',
      demandOption: true as const,
    },
  };
};

/**
 * Get optional project option definition.
 * Returns an option object that can be spread into .options().
 */
export const getProjectOptionalOption = () => ({
  project: {
    type: 'string' as const,
    description: 'Project name',
  },
});

/**
 * Description option definition.
 */
export const descriptionOption = {
  description: {
    type: 'string' as const,
    description: 'Description',
  },
} as const;

/**
 * Format option definition.
 */
export const formatOption = {
  format: {
    alias: 'f',
    type: 'string' as const,
    choices: FormatType,
    description: 'Output format',
    default: 'json' as const,
  },
} as const;
