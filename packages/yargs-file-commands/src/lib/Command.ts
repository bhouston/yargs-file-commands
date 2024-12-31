import type { CommandModule } from 'yargs';

export interface Command {
  fullPath: string;
  segments: string[];
  commandModule: CommandModule;
}
