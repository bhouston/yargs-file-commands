import { readFileSync } from 'node:fs';

const { pull_request: pr } = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
if (!pr) throw new Error('Expected a pull request event');
if (pr.base.ref !== 'main') throw new Error('PRs must target main');
const linked = /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)\b/i.test(pr.body ?? '');
if (!linked) {
  throw new Error('PR body must close an issue, e.g. Closes #42');
}
