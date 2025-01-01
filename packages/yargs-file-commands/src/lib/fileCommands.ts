import { buildSegmentTree, createCommand } from './buildSegmentTree.js';
import type { Command } from './Command.js';
import { importCommandFromFile } from './importCommand.js';
import { scanDirectory } from './scanDirectory.js';
import { segmentPath } from './segmentPath.js';

export type FileCommandsOptions = {
  commandDirs: string[];
  extensions?: string[];
  ignorePatterns?: RegExp[];
  logLevel?: 'info' | 'debug';
};

export const DefaultFileCommandsOptions: Partial<FileCommandsOptions> = {
  extensions: ['.js', '.ts'],
  ignorePatterns: [
    /^[.|_].*/,
    /\.(?:test|spec)\.[jt]s$/,
    /__(?:test|spec)__/,
    /\.d\.ts$/
  ],
  logLevel: 'info'
};

export const fileCommands = async (options: FileCommandsOptions) => {
  const fullOptions = { ...DefaultFileCommandsOptions, ...options };

  const commands: Command[] = [];

  await Promise.all(
    options.commandDirs.map(async (commandDir) => {
      const filePaths = await scanDirectory(commandDir, fullOptions);

      const rootDirCommands = await Promise.all(
        filePaths.map(async (filePath) => {
          const segments = segmentPath(filePath, commandDir);

          return {
            fullPath: filePath,
            segments: segmentPath(filePath, commandDir),
            commandModule: await importCommandFromFile(
              filePath,
              segments[segments.length - 1]!
            )
          };
        })
      );
      commands.push(...rootDirCommands);
    })
  );

  const commandRootNodes = buildSegmentTree(commands);

  const rootCommands = commandRootNodes.map((node) => createCommand(node));

  return rootCommands;
};
