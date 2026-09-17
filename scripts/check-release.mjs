import assert from 'node:assert/strict';
import { analyzeCommits } from '@semantic-release/commit-analyzer';
import { generateNotes } from '@semantic-release/release-notes-generator';
import config from '../release.config.js';

const pluginOptions = (name) => config.plugins.find((plugin) => plugin[0] === name)[1];
const analyzerOptions = pluginOptions('@semantic-release/commit-analyzer');
const notesOptions = pluginOptions('@semantic-release/release-notes-generator');
const logger = { log() {} };
const breaking = 'feat!: require Node 24\n\nBREAKING CHANGE: Node 24 is required.';
for (const [message, expected] of [
  ['fix: handle empty input', 'patch'],
  ['feat: add a command', 'minor'],
  [breaking, 'major'],
  ['chore: update tooling', null],
]) {
  assert.equal(await analyzeCommits(analyzerOptions, { commits: [{ message }], logger }), expected);
}

// Exercise the actual preset and writer together: commit analysis alone cannot
// detect incompatible changelog templates. These plugin calls never publish.
const notes = await generateNotes(notesOptions, {
  cwd: process.cwd(),
  logger,
  options: { repositoryUrl: 'https://github.com/bhouston/yargs-file-commands.git' },
  commits: [
    { hash: 'a'.repeat(40), message: breaking },
    { hash: 'b'.repeat(40), message: 'fix: handle empty input' },
  ],
  lastRelease: { version: '1.2.2', gitTag: 'v1.2.2' },
  nextRelease: { version: '2.0.0', gitTag: 'v2.0.0' },
});
assert.match(notes, /2\.0\.0/);
assert.match(notes, /BREAKING CHANGES/);
assert.match(notes, /Node 24 is required/);
assert.match(notes, /handle empty input/);
assert.match(notes, /compare\/v1\.2\.2\.\.\.v2\.0\.0/);
console.log('Release checks passed: version analysis and rendered changelog.');
