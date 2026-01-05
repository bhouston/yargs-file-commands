import { describe, expect, it } from 'vitest';

import { segmentPath } from './segmentPath.js';

describe('segmentPath', () => {
  it('should segment a path correctly', () => {
    const fullPath =
      '/Users/username/Coding/Personal/yargs-file-commands/packages/yargs-file-commands/src/lib/segmentPath.ts';
    const baseDir = '/Users/username/Coding/Personal/yargs-file-commands/';
    const expected = ['packages', 'yargs-file-commands', 'src', 'lib', 'segmentPath', 'ts'];
    const result = segmentPath(fullPath, baseDir);
    expect(result).toEqual(expected);
  });

  it('should handle paths with periods correctly', () => {
    const fullPath =
      '/Users/username/Coding/Personal/yargs-file-commands/packages/yargs-file-commands/src/lib/segmentPath.test.ts';
    const baseDir = '/Users/username/Coding/Personal/yargs-file-commands/';
    const expected = ['packages', 'yargs-file-commands', 'src', 'lib', 'segmentPath', 'test', 'ts'];
    const result = segmentPath(fullPath, baseDir);
    expect(result).toEqual(expected);
  });

  it('should filter out "command" segments', () => {
    const fullPath =
      '/Users/username/Coding/Personal/yargs-file-commands/packages/yargs-file-commands/src/lib/commandPath.ts';
    const baseDir = '/Users/username/Coding/Personal/yargs-file-commands/';
    const expected = ['packages', 'yargs-file-commands', 'src', 'lib', 'commandPath', 'ts'];
    const result = segmentPath(fullPath, baseDir);
    expect(result).toEqual(expected);
  });

  it('should handle empty segments correctly', () => {
    const fullPath =
      '/Users/username/Coding/Personal/yargs-file-commands/packages/yargs-file-commands/src/lib/.hiddenFile';
    const baseDir = '/Users/username/Coding/Personal/yargs-file-commands/';
    const expected = ['packages', 'yargs-file-commands', 'src', 'lib', 'hiddenFile'];
    const result = segmentPath(fullPath, baseDir);
    expect(result).toEqual(expected);
  });

  it('should handle Windows-style paths with backslashes', () => {
    const fullPath = 'C:\\Users\\username\\commands\\db\\health.ts';
    const baseDir = 'C:\\Users\\username\\commands';
    const expected = ['db', 'health', 'ts'];
    const result = segmentPath(fullPath, baseDir);
    expect(result).toEqual(expected);
  });

  it('should handle paths with "command" in the middle of segments', () => {
    const fullPath = '/base/dir/db/migration/command.ts';
    const baseDir = '/base/dir';
    const expected = ['db', 'migration', 'ts'];
    const result = segmentPath(fullPath, baseDir);
    expect(result).toEqual(expected);
  });

  it('should handle paths with multiple consecutive dots', () => {
    const fullPath = '/base/dir/test..file.ts';
    const baseDir = '/base/dir';
    const expected = ['test', 'file', 'ts'];
    const result = segmentPath(fullPath, baseDir);
    expect(result).toEqual(expected);
  });

  it('should handle paths with leading slashes', () => {
    const fullPath = '///base/dir/test.ts';
    const baseDir = '/base/dir';
    const expected = ['test', 'ts'];
    const result = segmentPath(fullPath, baseDir);
    expect(result).toEqual(expected);
  });

  it('should handle paths with trailing slashes in baseDir', () => {
    const fullPath = '/base/dir/test.ts';
    const baseDir = '/base/dir/';
    const expected = ['test', 'ts'];
    const result = segmentPath(fullPath, baseDir);
    expect(result).toEqual(expected);
  });

  it('should handle paths with mixed slashes', () => {
    // Test that mixed slashes are normalized correctly
    const fullPath = '/base/dir/test.ts';
    const baseDir = '/base/dir';
    const expected = ['test', 'ts'];
    const result = segmentPath(fullPath, baseDir);
    expect(result).toEqual(expected);

    // Test with backslashes in fullPath
    const fullPath2 = 'C:\\base\\dir\\test.ts';
    const baseDir2 = 'C:\\base\\dir';
    const result2 = segmentPath(fullPath2, baseDir2);
    expect(result2).toEqual(expected);
  });

  it('should handle file with only extension segment', () => {
    const fullPath = '/base/dir/.ts';
    const baseDir = '/base/dir';
    const expected = ['ts'];
    const result = segmentPath(fullPath, baseDir);
    expect(result).toEqual(expected);
  });

  it('should handle nested command files', () => {
    const fullPath = '/base/dir/studio.start.ts';
    const baseDir = '/base/dir';
    const expected = ['studio', 'start', 'ts'];
    const result = segmentPath(fullPath, baseDir);
    expect(result).toEqual(expected);
  });

  it('should handle paths where baseDir is root', () => {
    const fullPath = '/test.ts';
    const baseDir = '/';
    const expected = ['test', 'ts'];
    const result = segmentPath(fullPath, baseDir);
    expect(result).toEqual(expected);
  });

  it('should filter out multiple "command" keywords', () => {
    const fullPath = '/base/dir/command/command/file.command.ts';
    const baseDir = '/base/dir';
    const expected = ['file', 'ts'];
    const result = segmentPath(fullPath, baseDir);
    expect(result).toEqual(expected);
  });

  it('should handle file in root of baseDir', () => {
    const fullPath = '/base/dir/file.ts';
    const baseDir = '/base/dir';
    const expected = ['file', 'ts'];
    const result = segmentPath(fullPath, baseDir);
    expect(result).toEqual(expected);
  });
});
