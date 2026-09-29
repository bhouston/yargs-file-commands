import type { Argv, CommandModule } from 'yargs';

import type { Command } from './Command.js';
import { noopHandler } from './importCommand.js';

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
      /** Optional file at the group's own path that defines the group (describe, builder, ...) */
      definition?: Command;
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
 * When two commands have the same segments, the later one replaces the earlier one,
 * so later commandDirs overlay earlier ones. A command whose segments match a group
 * becomes that group's definition.
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
    } else if (currentSegment.type === 'leaf') {
      // Overlay: a command from a later commandDir replaces the earlier one
      currentSegment.command = command;
    } else {
      // A file at a group's own path defines the group (later commandDirs win here too)
      currentSegment.definition = command;
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
    // The command found first turns out to be at a group's path: it defines the group
    const index = treeNodes.indexOf(currentSegment);
    currentSegment = {
      type: 'internal',
      segmentName: currentSegmentName,
      children: [],
      definition: currentSegment.command,
    };
    treeNodes[index] = currentSegment;
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
  /** Import each group's commands when yargs enters it (default). `false` imports everything up front and makes group builders synchronous */
  lazy?: boolean;
}

export const createCommand = async (
  treeNode: CommandTreeNode,
  options: CreateCommandOptions = {},
): Promise<CommandModule> => {
  if (treeNode.type === 'leaf') {
    return treeNode.command.load();
  }

  const name = treeNode.segmentName;
  const definition = await treeNode.definition?.load();
  if (definition !== undefined && definition.handler !== undefined && definition.handler !== noopHandler) {
    throw new Error(
      `Conflict: ${name} is both a directory and a command. ${treeNode.definition?.fullPath} is at the path of ` +
        `the "${name}" group, so it defines the group, but it exports a handler, and groups require a subcommand ` +
        `so the handler would never run. Remove the handler, or rename the file or the directory.`,
    );
  }

  const register = (yargs: Argv, children: CommandModule[]): Argv => {
    // One at a time: builder walkers like clidoc only record .command(module), not .command([modules])
    for (const child of children) yargs.command(child);
    yargs.demandCommand(1, options.demandCommandMessage ?? `You must specify a ${name} subcommand`);
    return yargs;
  };
  const loadChildren = () => Promise.all(treeNode.children.map((child) => createCommand(child, options)));
  // The group's own builder runs first, so its options and middleware apply to its subcommands
  const builder = definition?.builder;
  const applyDefinition = (yargs: Argv) =>
    typeof builder === 'function' ? builder(yargs) : builder !== undefined ? yargs.options(builder) : undefined;

  // Eager groups load their children now and build synchronously, for tools that walk builders (e.g. clidoc)
  const eagerChildren = options.lazy === false ? await loadChildren() : undefined;

  return {
    command: definition?.command ?? name,
    describe: definition?.describe ?? `${name} commands`,
    aliases: definition?.aliases,
    deprecated: definition?.deprecated,
    builder: eagerChildren
      ? (yargs: Argv): Argv => {
          applyDefinition(yargs);
          return register(yargs, eagerChildren);
        }
      : async (yargs: Argv): Promise<Argv> => {
          await applyDefinition(yargs);
          return register(yargs, await loadChildren());
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
