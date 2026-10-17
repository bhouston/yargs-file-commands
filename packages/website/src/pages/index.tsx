import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import CodeBlock from '@theme/CodeBlock';

const features = [
  [
    'Follow the file tree',
    'Organize commands with directories or dotted filenames. Add a file and let its path define its place in your CLI.',
  ],
  [
    'Keep arguments typed',
    'Use defineCommand to infer handler arguments from your Yargs builder. Keep the Yargs options and middleware you already use.',
  ],
  [
    'Load by command group',
    'Scan the tree once, then import command modules as users enter each group. Sibling groups stay unloaded.',
  ],
  [
    'Layer generated commands',
    'Merge multiple command directories. Later directories can replace generated commands while preserving the rest of the tree.',
  ],
  [
    'Describe your groups',
    'Give groups aliases, help text, shared options and middleware with a command.ts definition.',
  ],
  [
    'Catch mistakes in CI',
    'Run validateCommands in your tests to import every module and check positional argument declarations.',
  ],
];

export default function Home() {
  return (
    <Layout description="Build typed, file-based Yargs CLIs with nested commands, lazy loading and command overlays.">
      <header className="hero hero--primary">
        <div className="container hero-content">
          <p className="eyebrow">FILE-BASED COMMANDS FOR YARGS</p>
          <h1>Your files are your command tree.</h1>
          <p className="hero-subtitle">
            Build a CLI that grows with your codebase. Turn files into nested commands, keep arguments typed, and load
            only the groups your users need.
          </p>
          <div className="hero-actions">
            <Link className="button button--secondary button--lg" to="/docs/getting-started">
              Get started →
            </Link>
            <Link className="button button--outline button--secondary button--lg" to="/docs/api">
              Explore the API
            </Link>
          </div>
          <code className="install-command">npm install yargs-file-commands yargs</code>
        </div>
      </header>
      <main>
        <section className="container overview">
          <div>
            <p className="eyebrow">LESS REGISTRATION. MORE BUILDING.</p>
            <h2>A familiar structure for a growing CLI</h2>
            <p>
              Keep each command in its own module. Use folders for groups, dotted names for compact layouts, or combine
              both.
            </p>
            <Link to="/docs/file-conventions">Learn the file conventions →</Link>
          </div>
          <CodeBlock language="text" title="From files to commands">
            {
              'commands/\n├── db/\n│   ├── health.ts       → db health\n│   └── migration/\n│       └── command.ts  → db migration\n├── studio.start.ts    → studio start\n└── $default.ts        → default command'
            }
          </CodeBlock>
        </section>
        <section className="capabilities">
          <div className="container">
            <h2>Small helper. Room to grow.</h2>
            <div className="feature-grid">
              {features.map(([title, body]) => (
                <article key={title}>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="container overview">
          <div>
            <h2>Yargs, with a simpler entry point</h2>
            <p>
              Register the generated tree, then use the standard Yargs parser and help system. Existing command modules
              fit right in.
            </p>
            <Link className="button button--primary" to="/docs/getting-started">
              Build your first command
            </Link>
          </div>
          <CodeBlock language="typescript">
            {
              "import yargs from 'yargs';\nimport { hideBin } from 'yargs/helpers';\nimport { fileCommands } from 'yargs-file-commands';\n\nawait yargs(hideBin(process.argv))\n  .command(await fileCommands({\n    commandDirs: [import.meta.dirname + '/commands'],\n  }))\n  .help()\n  .parseAsync();"
            }
          </CodeBlock>
        </section>
      </main>
    </Layout>
  );
}
