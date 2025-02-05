/**
 * Converts a file path into an array of command segments
 * @param {string} fullPath - The complete file system path to the command file
 * @param {string} baseDir - The base directory to make the path relative to
 * @returns {string[]} Array of segments representing the command hierarchy
 *
 * @description
 * This function processes a file path into command segments by:
 * 1. Making the path relative to the base directory
 * 2. Splitting on directory separators
 * 3. Removing file extensions
 * 4. Splitting on dots for nested commands
 * 5. Filtering out empty segments and 'command' keyword
 *
 * @example
 * segmentPath('/base/dir/hello/world.command.ts', '/base/dir')
 * // Returns: ['hello', 'world']
 */
export const segmentPath = (fullPath: string, baseDir: string): string[] => {
  // Remove base directory and normalize slashes
  const relativePath = fullPath.replace(baseDir, '').replace(/^[/\\\\]+/, '');

  // Split into path segments and filename
  const allSegments = relativePath.split(/[/\\\\]/);

  // Process all segments including filename (without extension)
  const processedSegments = allSegments
    // Remove extension from the last segment (filename)
    .map((segment, index, array) =>
      index === array.length - 1 ? segment.replace(/\\.[^/.]+$/, '') : segment
    )
    // Split segments containing periods
    .flatMap((segment) => segment.split('.'))
    // Filter out empty segments and 'command'
    .filter((segment) => segment !== '' && segment !== 'command');

  return processedSegments;
};
