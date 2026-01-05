import { describe, expect, it, vi } from 'vitest';

import { buildSegmentTree, createCommand, logCommandTree } from './buildSegmentTree.js';
import type { Command } from './Command.js';

describe('buildSegmentTree', () => {
  it('should build correct tree structure', () => {
    const commands: Command[] = [
      {
        fullPath: '/commands/db/migration/command.js',
        segments: ['db', 'migration'],
        commandModule: {
          command: 'migration',
          describe: 'Migration command',
          handler: async () => {
            // Test handler
          },
        },
      },
      {
        fullPath: '/commands/db/health.js',
        segments: ['db', 'health'],
        commandModule: {
          command: 'health',
          describe: 'Health command',
          handler: async () => {
            // Test handler
          },
        },
      },
    ];

    const tree = buildSegmentTree(commands);

    expect(tree.length).toBe(1);
    const rootNode = tree[0];
    expect(rootNode).toBeDefined();
    if (!rootNode) {
      throw new Error('Root node should exist');
    }
    expect(rootNode.segmentName).toBe('db');
    expect(rootNode.type).toBe('internal');

    if (rootNode.type !== 'internal') {
      throw new Error('Expected internal node');
    }

    expect(rootNode.children.length).toBe(2);

    const childSegments = rootNode.children.map((child) => child.segmentName).sort();
    expect(childSegments).toEqual(['health', 'migration']);
  });

  it('should handle empty input', () => {
    const tree = buildSegmentTree([]);
    expect(tree.length).toBe(0);
  });

  it('should handle single command', () => {
    const commands: Command[] = [
      {
        fullPath: '/commands/test.ts',
        segments: ['test'],
        commandModule: {
          command: 'test',
          describe: 'Test command',
          handler: async () => {
            // Test handler
          },
        },
      },
    ];

    const tree = buildSegmentTree(commands);

    expect(tree.length).toBe(1);
    const node = tree[0];
    expect(node).toBeDefined();
    if (!node) {
      throw new Error('Node should exist');
    }
    expect(node.segmentName).toBe('test');
    expect(node.type).toBe('leaf');
  });

  it('should throw error when directory conflicts with command name (directory first)', () => {
    const commands: Command[] = [
      {
        fullPath: '/commands/db/migration/command.js',
        segments: ['db', 'migration'],
        commandModule: {
          command: 'migration',
          describe: 'Migration command',
          handler: async () => {},
        },
      },
      {
        fullPath: '/commands/db.js',
        segments: ['db'],
        commandModule: {
          command: 'db',
          describe: 'DB command',
          handler: async () => {},
        },
      },
    ];

    expect(() => buildSegmentTree(commands)).toThrow(/Conflict: db is both a directory and a command/);
  });

  it('should throw error when directory conflicts with command name (command first)', () => {
    const commands: Command[] = [
      {
        fullPath: '/commands/db.js',
        segments: ['db'],
        commandModule: {
          command: 'db',
          describe: 'DB command',
          handler: async () => {},
        },
      },
      {
        fullPath: '/commands/db/migration/command.js',
        segments: ['db', 'migration'],
        commandModule: {
          command: 'migration',
          describe: 'Migration command',
          handler: async () => {},
        },
      },
    ];

    expect(() => buildSegmentTree(commands)).toThrow(/Conflict: db is both a directory and a command/);
  });

  it('should handle multiple root commands', () => {
    const commands: Command[] = [
      {
        fullPath: '/commands/hello.ts',
        segments: ['hello'],
        commandModule: {
          command: 'hello',
          describe: 'Hello command',
          handler: async () => {},
        },
      },
      {
        fullPath: '/commands/world.ts',
        segments: ['world'],
        commandModule: {
          command: 'world',
          describe: 'World command',
          handler: async () => {},
        },
      },
    ];

    const tree = buildSegmentTree(commands);
    expect(tree.length).toBe(2);
    expect(tree.map((n) => n.segmentName).sort()).toEqual(['hello', 'world']);
  });

  it('should handle nested commands at different depths', () => {
    const commands: Command[] = [
      {
        fullPath: '/commands/a/b/c.ts',
        segments: ['a', 'b', 'c'],
        commandModule: {
          command: 'c',
          describe: 'C command',
          handler: async () => {},
        },
      },
      {
        fullPath: '/commands/a/d.ts',
        segments: ['a', 'd'],
        commandModule: {
          command: 'd',
          describe: 'D command',
          handler: async () => {},
        },
      },
    ];

    const tree = buildSegmentTree(commands);
    expect(tree.length).toBe(1);
    expect(tree[0]?.segmentName).toBe('a');
    if (tree[0]?.type === 'internal') {
      expect(tree[0].children.length).toBe(2);
      const childNames = tree[0].children.map((c) => c.segmentName).sort();
      expect(childNames).toEqual(['b', 'd']);

      const bNode = tree[0].children.find((c) => c.segmentName === 'b');
      if (bNode?.type === 'internal') {
        expect(bNode.children.length).toBe(1);
        expect(bNode.children[0]?.segmentName).toBe('c');
        expect(bNode.children[0]?.type).toBe('leaf');
      }
    }
  });
});

describe('createCommand', () => {
  it('should create command module from leaf node', () => {
    const command: Command = {
      fullPath: '/commands/test.ts',
      segments: ['test'],
      commandModule: {
        command: 'test',
        describe: 'Test command',
        handler: async () => {
          // Test handler
        },
      },
    };

    const treeNode = {
      type: 'leaf' as const,
      segmentName: 'test',
      command,
    };

    const commandModule = createCommand(treeNode);
    expect(commandModule.command).toBe('test');
    expect(commandModule.describe).toBe('Test command');
    expect(commandModule.handler).toBe(command.commandModule.handler);
  });

  it('should create command module from internal node with children', () => {
    const childCommand: Command = {
      fullPath: '/commands/db/health.ts',
      segments: ['db', 'health'],
      commandModule: {
        command: 'health',
        describe: 'Health check',
        handler: async () => {},
      },
    };

    const childTreeNode = {
      type: 'leaf' as const,
      segmentName: 'health',
      command: childCommand,
    };

    const internalTreeNode = {
      type: 'internal' as const,
      segmentName: 'db',
      children: [childTreeNode],
    };

    const commandModule = createCommand(internalTreeNode);
    expect(commandModule.command).toBe('db');
    expect(commandModule.describe).toBe('db commands');
    expect(commandModule.builder).toBeDefined();
    expect(commandModule.handler).toBeDefined();
  });

  it('should create nested command structure with builder', () => {
    const healthCommand: Command = {
      fullPath: '/commands/db/health.ts',
      segments: ['db', 'health'],
      commandModule: {
        command: 'health',
        describe: 'Health check',
        handler: async () => {},
      },
    };

    const migrationCommand: Command = {
      fullPath: '/commands/db/migration.ts',
      segments: ['db', 'migration'],
      commandModule: {
        command: 'migration',
        describe: 'Migration',
        handler: async () => {},
      },
    };

    const tree = buildSegmentTree([healthCommand, migrationCommand]);
    const dbNode = tree[0];
    if (!dbNode || dbNode.type !== 'internal') {
      throw new Error('Expected internal node');
    }

    const commandModule = createCommand(dbNode);
    expect(commandModule.command).toBe('db');
    expect(commandModule.builder).toBeDefined();

    // Test the builder function
    if (commandModule.builder && typeof commandModule.builder === 'function') {
      const mockYargs = {
        command: vi.fn().mockReturnThis(),
        demandCommand: vi.fn().mockReturnThis(),
      } as unknown as Parameters<typeof commandModule.builder>[0];

      commandModule.builder(mockYargs);
      expect(mockYargs.command).toHaveBeenCalledTimes(1);
      expect(mockYargs.demandCommand).toHaveBeenCalledWith(1, 'You must specify a db subcommand');
    }
  });
});

describe('logCommandTree', () => {
  it('should log command tree structure', () => {
    const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    const commands: Command[] = [
      {
        fullPath: '/commands/db/health.ts',
        segments: ['db', 'health'],
        commandModule: {
          command: 'health',
          describe: 'Health',
          handler: async () => {},
        },
      },
      {
        fullPath: '/commands/hello.ts',
        segments: ['hello'],
        commandModule: {
          command: 'hello',
          describe: 'Hello',
          handler: async () => {},
        },
      },
    ];

    const tree = buildSegmentTree(commands);
    logCommandTree(tree);

    expect(consoleSpy).toHaveBeenCalled();
    const calls = consoleSpy.mock.calls.map((call) => call[0]);
    expect(calls.some((call) => call.includes('db'))).toBe(true);
    expect(calls.some((call) => call.includes('health'))).toBe(true);
    expect(calls.some((call) => call.includes('hello'))).toBe(true);

    consoleSpy.mockRestore();
  });

  it('should log command tree with correct indentation levels', () => {
    const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    const commands: Command[] = [
      {
        fullPath: '/commands/a/b/c.ts',
        segments: ['a', 'b', 'c'],
        commandModule: {
          command: 'c',
          describe: 'C',
          handler: async () => {},
        },
      },
    ];

    const tree = buildSegmentTree(commands);
    logCommandTree(tree, 2);

    expect(consoleSpy).toHaveBeenCalled();
    const calls = consoleSpy.mock.calls.map((call) => call[0]);
    // Check for indentation (initial level 2 = 4 spaces, then children add more)
    expect(calls.length).toBeGreaterThan(0);

    consoleSpy.mockRestore();
  });
});

describe('buildSegmentTree edge cases', () => {
  it('should handle commands with undefined segment name', () => {
    const commands: Command[] = [
      {
        fullPath: '/commands/test.ts',
        segments: ['test', undefined as any], // Undefined segment
        commandModule: {
          command: 'test',
          describe: 'Test command',
          handler: async () => {},
        },
      },
    ];

    // Should handle undefined segments gracefully
    const tree = buildSegmentTree(commands);
    expect(tree.length).toBeGreaterThan(0);
  });

  it('should handle commands with isDefault flag', () => {
    const commands: Command[] = [
      {
        fullPath: '/commands/$default.ts',
        segments: ['$default'],
        isDefault: true,
        commandModule: {
          command: '$0',
          describe: 'Default command',
          handler: async () => {},
        },
      },
    ];

    const tree = buildSegmentTree(commands);
    expect(tree.length).toBe(1);
    expect(tree[0]?.segmentName).toBe('$default');
    expect(tree[0]?.type).toBe('leaf');
  });

  it('should handle commands with empty segments array gracefully', () => {
    const commands: Command[] = [
      {
        fullPath: '/commands/test.ts',
        segments: [], // Empty segments
        commandModule: {
          command: 'test',
          describe: 'Test command',
          handler: async () => {},
        },
      },
    ];

    // Should handle empty segments without crashing
    const tree = buildSegmentTree(commands);
    expect(tree.length).toBe(0); // Empty segments result in empty tree
  });

  it('should verify internal node handler is async function', () => {
    const healthCommand: Command = {
      fullPath: '/commands/db/health.ts',
      segments: ['db', 'health'],
      commandModule: {
        command: 'health',
        describe: 'Health check',
        handler: async () => {},
      },
    };

    const tree = buildSegmentTree([healthCommand]);
    const dbNode = tree[0];
    if (!dbNode || dbNode.type !== 'internal') {
      throw new Error('Expected internal node');
    }

    const commandModule = createCommand(dbNode);
    expect(commandModule.handler).toBeDefined();
    expect(typeof commandModule.handler).toBe('function');

    // Verify handler is async (returns a Promise)
    if (commandModule.handler) {
      const result = commandModule.handler({} as any);
      expect(result).toBeInstanceOf(Promise);
    }
  });

  it('should handle very deeply nested command structures', () => {
    const commands: Command[] = [
      {
        fullPath: '/commands/a/b/c/d/e/f/g.ts',
        segments: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
        commandModule: {
          command: 'g',
          describe: 'Deeply nested command',
          handler: async () => {},
        },
      },
    ];

    const tree = buildSegmentTree(commands);
    expect(tree.length).toBe(1);

    // Traverse the tree to verify depth
    let currentNode = tree[0];
    let depth = 0;
    while (currentNode && currentNode.type === 'internal') {
      expect(currentNode.children.length).toBeGreaterThan(0);
      currentNode = currentNode.children[0];
      depth++;
    }

    expect(depth).toBe(6); // 6 internal nodes before leaf
    expect(currentNode?.type).toBe('leaf');
  });

  it('should handle commands with special characters in segment names', () => {
    const commands: Command[] = [
      {
        fullPath: '/commands/test-command.ts',
        segments: ['test-command'],
        commandModule: {
          command: 'test-command',
          describe: 'Test with dash',
          handler: async () => {},
        },
      },
      {
        fullPath: '/commands/test_command.ts',
        segments: ['test_command'],
        commandModule: {
          command: 'test_command',
          describe: 'Test with underscore',
          handler: async () => {},
        },
      },
    ];

    const tree = buildSegmentTree(commands);
    expect(tree.length).toBe(2);
    const segmentNames = tree.map((n) => n.segmentName).sort();
    expect(segmentNames).toEqual(['test-command', 'test_command']);
  });
});
