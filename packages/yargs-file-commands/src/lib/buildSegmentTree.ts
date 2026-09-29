import type { Argv, CommandModule } from 'yargs';

import type { Command } from './Command.js';

/**
 * Represents a node in the command tree structure
 * @type {CommandTreeNode}
 */
type CommandTreeNode = {
  /** Name of the command segment */
  segmentName: string;
} & (
  | {
      /** Internal node type with children */
      type: 'internal';
      /** Child command nodes */
      children: CommandTreeNode[];
    }
  | {
      /** Leaf node type with command implementation */
      type: 'leaf';
      /** The command implementation */
      command: Command;
    }
);

/**
 * Builds a tree structure from command definitions
 * @param {Command[]} commands - Array of command definitions
 * @returns {CommandTreeNode[]} Root nodes of the command tree
 *
 * @description
 * Constructs a hierarchical tree structure from flat command definitions,
 * preserving the command hierarchy defined by the file system structure.
 */
export const buildSegmentTree = (commands: Command[]): CommandTreeNode[] => {
  const rootTreeNodes: CommandTreeNode[] = [];

  for (const command of commands) {
    insertIntoTree(rootTreeNodes, command, 0);
  }

  return rootTreeNodes;
};

/**
 * Inserts a command into the tree structure at the specified depth
 * @param {CommandTreeNode[]} treeNodes - Current level tree nodes
 * @param {Command} command - Command to insert
 * @param {number} depth - Current depth in the segment tree
 * @throws {Error} When there's a conflict between directory and command names
 */
function insertIntoTree(treeNodes: CommandTreeNode[], command: Command, depth: number): void {
  // If we've processed all segments, we shouldn't be here
  if (depth >= command.segments.length) {
    return;
  }

  const currentSegmentName = command.segments[depth];
  if (currentSegmentName === undefined) {
    return;
  }
  let currentSegment = treeNodes.find((s) => s.segmentName === currentSegmentName);

  // If this is the last segment, create a leaf node
  if (depth === command.segments.length - 1) {
    if (currentSegment == null) {
      treeNodes.push({
        type: 'leaf',
        segmentName: currentSegmentName,
        command,
      });
    } else if (currentSegment.type === 'internal') {
      throw new Error(
        `Conflict: ${currentSegmentName} is both a directory and a command ${JSON.stringify(
          currentSegment,
        )},${JSON.stringify(command)}`,
      );
    }
    return;
  }

  // Creating or ensuring we have an internal node
  if (currentSegment == null) {
    currentSegment = {
      type: 'internal',
      segmentName: currentSegmentName,
      children: [],
    };
    treeNodes.push(currentSegment);
  } else if (currentSegment.type === 'leaf') {
    throw new Error(
      `Conflict: ${currentSegmentName} is both a directory and a command ${JSON.stringify(
        currentSegment,
      )}, ${JSON.stringify(command)}`,
    );
  }

  // Recurse into children
  insertIntoTree(currentSegment.children, command, depth + 1);
}

/**
 * Creates a Yargs command module from a tree node
 * @param {CommandTreeNode} treeNode - The tree node to convert
 * @returns {Promise<CommandModule>} Yargs command module
 *
 * @description
 * Leaf nodes import their command module. Internal nodes return a group command whose
 * builder imports and registers its children only when yargs enters the group, so a
 * CLI invocation only loads the modules along the command path it uses.
 */
export interface CreateCommandOptions {
  /** Message used by every group when run without a subcommand; defaults to `You must specify a <name> subcommand` */
  demandCommandMessage?: string;
}

export const createCommand = async (
  treeNode: CommandTreeNode,
  options: CreateCommandOptions = {},
): Promise<CommandModule> => {
  if (treeNode.type === 'leaf') {
    return treeNode.command.load();
  }

  const name = treeNode.segmentName;
  return {
    command: name,
    describe: `${name} commands`,
    builder: async (yargs: Argv): Promise<Argv> => {
      yargs.command(await Promise.all(treeNode.children.map((child) => createCommand(child, options))));
      yargs.demandCommand(1, options.demandCommandMessage ?? `You must specify a ${name} subcommand`);
      return yargs;
    },
    handler: async () => {
      // Internal nodes don't need handlers as they'll demand subcommands
    },
  };
};

export const logCommandTree = (commands: CommandTreeNode[], level = 0) => {
  commands.forEach((command) => {
    console.debug(`${'  '.repeat(level) + command.segmentName}`);
    if (command.type === 'internal') {
      logCommandTree(command.children, level + 1);
    }
  });
};
