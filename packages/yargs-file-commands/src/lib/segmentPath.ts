export const segmentPath = (fullPath: string, baseDir: string): string[] => {
  // Remove base directory and normalize slashes
  const relativePath = fullPath.replace(baseDir, '').replace(/^[/\\]+/, '');

  // Split into path segments and filename
  const allSegments = relativePath.split(/[/\\]/);

  // Process all segments including filename (without extension)
  const processedSegments = allSegments
    // Remove extension from the last segment (filename)
    .map((segment, index, array) =>
      index === array.length - 1 ? segment.replace(/\.[^/.]+$/, '') : segment
    )
    // Split segments containing periods
    .flatMap((segment) => segment.split('.'))
    // Filter out empty segments and 'command'
    .filter((segment) => segment !== '' && segment !== 'command');

  return processedSegments;
};
