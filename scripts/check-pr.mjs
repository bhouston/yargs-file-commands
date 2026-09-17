import { readFileSync } from 'node:fs';

const { pull_request: pr, repository } = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
if (!pr) throw new Error('Expected a pull request event');
if (pr.base.ref === 'main') {
  if (pr.head.ref !== 'dev' || pr.head.repo.full_name !== repository.full_name) {
    throw new Error('Only the repository dev branch may target main');
  }
} else {
  if (pr.base.ref !== 'dev') throw new Error('Implementation PRs must target dev');
  const match = /^(?:feature|fix|docs|chore|refactor|test|ci)\/(\d+)-[a-z0-9-]+$/.exec(pr.head.ref);
  if (!match) throw new Error('Use a branch such as feature/42-batch-export');
  const linked = [...(pr.body ?? '').matchAll(/\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)\b/gi)];
  if (!linked.some((entry) => entry[1] === match[1])) {
    throw new Error(`PR body must close the branch issue: Closes #${match[1]}`);
  }
}
