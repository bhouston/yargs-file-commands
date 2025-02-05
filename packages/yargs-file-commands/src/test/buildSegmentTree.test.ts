import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildSegmentTree } from '../lib/buildSegmentTree.js';
import type { Command } from '../lib/Command.js';

describe('buildSegmentTree', async () => {
  it('should build correct tree structure', async () => {
    const commands: Command[] = [
      {
        fullPath: '/commands/db/migration/command.js',
        segments: ['db', 'migration'],
        commandModule: {
          command: 'migration',
          describe: 'Migration command',
          handler: async () => {
            // Test handler
          }
        }
      },
      {
        fullPath: '/commands/db/health.js',
        segments: ['db', 'health'],
        commandModule: {
          command: 'health',
          describe: 'Health command',
          handler: async () => {
            // Test handler
          }
        }
      }
    ];

    const tree = buildSegmentTree(commands);

    assert.equal(tree.length, 1, 'Should have one root node');
    const rootNode = tree[0];
    assert(rootNode, 'Root node should exist');
    assert.equal(rootNode.segmentName, 'db', 'Root node should be "db"');
    assert.equal(
      rootNode.type,
      'internal',
      'Root node should be internal type'
    );

    if (rootNode.type !== 'internal') {
      throw new Error('Expected internal node');
    }

    assert.equal(rootNode.children.length, 2, 'Should have two child nodes');

    const childSegments = rootNode.children
      .map((child) => child.segmentName)
      .sort();
    assert.deepEqual(
      childSegments,
      ['health', 'migration'],
      'Should have "health" and "migration" sub-commands'
    );
  });

  it('should handle empty input', async () => {
    const tree = buildSegmentTree([]);
    assert.equal(tree.length, 0, 'Should return empty array for empty input');
  });

  it('should handle single command', async () => {
    const commands: Command[] = [
      {
        fullPath: '/commands/test.ts',
        segments: ['test'],
        commandModule: {
          command: 'test',
          describe: 'Test command',
          handler: async () => {
            // Test handler
          }
        }
      }
    ];

    const tree = buildSegmentTree(commands);

    assert.equal(tree.length, 1, 'Should have one node');
    const node = tree[0];
    assert(node, 'Node should exist');
    assert.equal(node.segmentName, 'test', 'Should have correct segment');
    assert.equal(node.type, 'leaf', 'Should be a leaf node');
  });
});
