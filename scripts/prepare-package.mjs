import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const packageDir = resolve(root, 'packages/yargs-file-commands');
const target = resolve(packageDir, 'publish');
rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
const filter = (path) => !/(?:^|[/\\])fixtures(?:[/\\]|$)|\.(test|spec)\.|\.tsbuildinfo$/.test(path);
for (const directory of ['dist', 'src']) {
  cpSync(resolve(packageDir, directory), resolve(target, directory), { recursive: true, filter });
}
for (const file of ['README.md', 'LICENSE', 'CHANGELOG.md']) {
  cpSync(resolve(root, file), resolve(target, file));
}
const pkg = JSON.parse(readFileSync(resolve(packageDir, 'package.json'), 'utf8'));
delete pkg.scripts;
delete pkg.devDependencies;
writeFileSync(resolve(target, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`);
