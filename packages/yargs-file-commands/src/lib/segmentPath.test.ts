import { describe, it } from 'node:test';

import assert from 'assert';

import { segmentPath } from './segmentPath.js';

describe('segmentPath', () => {
  it('should segment a path correctly', () => {
    const fullPath =
      '/Users/username/Coding/Personal/yargs-file-commands/packages/yargs-file-commands/src/lib/segmentPath.ts';
    const baseDir = '/Users/username/Coding/Personal/yargs-file-commands/';
    const expected = [
      'packages',
      'yargs-file-commands',
      'src',
      'lib',
      'segmentPath',
      'ts'
    ];
    const result = segmentPath(fullPath, baseDir);
    assert.deepStrictEqual(result, expected);
  });

  it('should handle paths with periods correctly', () => {
    const fullPath =
      '/Users/username/Coding/Personal/yargs-file-commands/packages/yargs-file-commands/src/lib/segmentPath.test.ts';
    const baseDir = '/Users/username/Coding/Personal/yargs-file-commands/';
    const expected = [
      'packages',
      'yargs-file-commands',
      'src',
      'lib',
      'segmentPath',
      'test',
      'ts'
    ];
    const result = segmentPath(fullPath, baseDir);
    assert.deepStrictEqual(result, expected);
  });

  it('should filter out "command" segments', () => {
    const fullPath =
      '/Users/username/Coding/Personal/yargs-file-commands/packages/yargs-file-commands/src/lib/commandPath.ts';
    const baseDir = '/Users/username/Coding/Personal/yargs-file-commands/';
    const expected = [
      'packages',
      'yargs-file-commands',
      'src',
      'lib',
      'commandPath',
      'ts'
    ];
    const result = segmentPath(fullPath, baseDir);
    assert.deepStrictEqual(result, expected);
  });

  it('should handle empty segments correctly', () => {
    const fullPath =
      '/Users/username/Coding/Personal/yargs-file-commands/packages/yargs-file-commands/src/lib/.hiddenFile';
    const baseDir = '/Users/username/Coding/Personal/yargs-file-commands/';
    const expected = [
      'packages',
      'yargs-file-commands',
      'src',
      'lib',
      'hiddenFile'
    ];
    const result = segmentPath(fullPath, baseDir);
    assert.deepStrictEqual(result, expected);
  });
});
