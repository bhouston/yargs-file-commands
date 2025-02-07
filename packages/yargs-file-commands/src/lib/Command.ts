import type { CommandModule } from 'yargs';

/**
 * Represents a command structure with its file path and module information
 * @interface Command
 */
export interface Command {
  /** Full file system path to the command file */
  fullPath: string;
  /** Array of path segments representing the command hierarchy */
  segments: string[];
  /** The Yargs command module implementation */
  commandModule: CommandModule;
  /** Whether this is the default command */
  isDefault?: boolean;
}
