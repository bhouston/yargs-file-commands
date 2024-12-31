import type { Argv, CommandModule } from 'yargs';

import type { Command } from './Command';

type CommandTreeNode = {
  segmentName: string;
} & (
  | {
      type: 'internal';
      children: CommandTreeNode[];
    }
  | {
      type: 'leaf';
      command: Command;
    }
);

export const buildSegmentTree = (commands: Command[]): CommandTreeNode[] => {
  const rootTreeNodes: CommandTreeNode[] = [];

  for (const command of commands) {
    insertIntoTree(rootTreeNodes, command, 0);
  }

  return rootTreeNodes;
};

function insertIntoTree(
  treeNodes: CommandTreeNode[],
  command: Command,
  depth: number
): void {
  // If we've processed all segments, we shouldn't be here
  if (depth >= command.segments.length) {
    return;
  }

  const currentSegmentName = command.segments[depth]!;
  let currentSegment = treeNodes.find(
    (s) => s.segmentName === currentSegmentName
  );

  // If this is the last segment, create a leaf node
  if (depth === command.segments.length - 1) {
    if (currentSegment == null) {
      treeNodes.push({
        type: 'leaf',
        segmentName: currentSegmentName,
        command
      });
    } else if (currentSegment.type === 'internal') {
      throw new Error(
        `Conflict: ${currentSegmentName} is both a directory and a command`
      );
    }
    return;
  }

  // Creating or ensuring we have an internal node
  if (currentSegment == null) {
    currentSegment = {
      type: 'internal',
      segmentName: currentSegmentName,
      children: []
    };
    treeNodes.push(currentSegment);
  } else if (currentSegment.type === 'leaf') {
    throw new Error(
      `Conflict: ${currentSegmentName} is both a directory and a command`
    );
  }

  // Recurse into children
  insertIntoTree(currentSegment.children, command, depth + 1);
}

export const createCommand = (treeNode: CommandTreeNode): CommandModule => {
  if (treeNode.type === 'leaf') {
    return treeNode.command.commandModule;
  }

  const name = treeNode.segmentName;
  // For internal nodes, create a command that registers all children
  const command: CommandModule = {
    command: name,
    describe: `${name} commands`,
    builder: (yargs: Argv): Argv => {
      // Register all child segments as subcommands
      yargs.command(treeNode.children.map((child) => createCommand(child)));
      // Demand a subcommand unless we're at the root
      yargs.demandCommand(1, `You must specify a ${name} subcommand`);

      return yargs;
    },
    handler: async () => {
      // Internal nodes don't need handlers as they'll demand subcommands
    }
  };

  return command;
};
