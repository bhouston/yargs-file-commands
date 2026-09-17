export default {
  branches: ['main'],
  tagFormat: 'v${version}',
  plugins: [
    ['@semantic-release/commit-analyzer', { preset: 'conventionalcommits' }],
    ['@semantic-release/release-notes-generator', { preset: 'conventionalcommits' }],
    ['@semantic-release/changelog', { changelogFile: 'packages/yargs-file-commands/publish/CHANGELOG.md' }],
    ['@semantic-release/npm', { pkgRoot: 'packages/yargs-file-commands/publish' }],
    [
      '@semantic-release/github',
      {
        successComment: false,
        failComment: false,
        releasedLabels: false,
        assets: [{ path: 'packages/yargs-file-commands/publish/CHANGELOG.md', label: 'Changelog' }],
      },
    ],
  ],
};
