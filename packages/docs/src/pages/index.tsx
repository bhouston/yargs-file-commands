import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';

const guides = [
  {
    label: 'Start here',
    name: 'Getting started',
    href: '/docs/getting-started',
    body: 'Install the package, register the tree with Yargs and write your first typed command.',
  },
  {
    label: 'Naming',
    name: 'File conventions',
    href: '/docs/file-conventions',
    body: 'How directories, dotted names, $default.ts and command.ts become commands, plus scanning and lazy loading.',
  },
  {
    label: 'Structure',
    name: 'Groups and overlays',
    href: '/docs/groups-and-overlays',
    body: 'Describe groups, share typed options, and layer hand-written commands over generated ones.',
  },
  {
    label: 'Reference',
    name: 'API reference',
    href: '/docs/api',
    body: 'Generated from the TSDoc comments: fileCommands, defineCommand, validateCommands and their options.',
  },
];
const workflow = [
  ['Add a file', 'commands/db/health.ts'],
  ['Get a command', 'db health, no registration'],
  ['Describe groups', 'A command.ts per directory'],
  ['Validate in CI', 'One test checks the whole tree'],
];

export default function Home() {
  return (
    <Layout
      title="File-based commands for Yargs"
      description="Turn a directory of files into a typed, lazy-loading Yargs command tree with nested commands, overlays and test-time validation."
    >
      <header className="home-hero container">
        <div>
          <p className="eyebrow">Yargs · TypeScript · Open source</p>
          <h1>
            Your files are
            <br />
            <em>your command tree.</em>
          </h1>
          <p className="hero-description">
            Stop maintaining a central list of commands. Put each command in its own file, let the path define where it
            lives, and keep the Yargs options, middleware and help output you already use.
          </p>
          <div className="hero-actions">
            <Link className="button button--primary button--lg" to="/docs/getting-started">
              Get started <span aria-hidden>→</span>
            </Link>
            <Link className="button button--secondary button--lg" to="/docs/api">
              API reference
            </Link>
          </div>
        </div>
        <figure className="hero-preview">
          <figcaption className="hero-caption">src/cli.ts</figcaption>
          <pre>
            <code>{`import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { fileCommands } from 'yargs-file-commands';

await yargs(hideBin(process.argv))
  .command(
    await fileCommands({
      commandDirs: [import.meta.dirname + '/commands'],
    }),
  )
  .demandCommand(1)
  .help()
  .parseAsync();`}</code>
          </pre>
        </figure>
      </header>
      <main>
        <section className="workflow-band" aria-label="Workflow">
          <div className="container workflow-steps">
            {workflow.map(([title, detail], index) => (
              <div key={title}>
                <span className="workflow-number">0{index + 1}</span>
                <strong>{title}</strong>
                <p>{detail}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="container story-section" aria-labelledby="files-title">
          <div>
            <p className="eyebrow">Less registration. More building.</p>
            <h2 id="files-title">
              Add a file.
              <br />
              Get a command.
            </h2>
            <p>
              Folders become groups and dotted names keep small trees compact. <code>defineCommand</code> infers the
              handler arguments from your Yargs builder, so <code>argv.port</code> is a number without a cast.
            </p>
            <div className="story-links">
              <Link className="button button--primary" to="/docs/file-conventions">
                Learn the file conventions
              </Link>
            </div>
          </div>
          <pre className="story-code">
            <code>{`commands/
├── db/
│   ├── health.ts       → db health
│   └── migration/
│       └── command.ts  → db migration
├── studio.start.ts     → studio start
└── $default.ts         → default command

// studio.start.ts
export const command = defineCommand({
  describe: 'Start the studio',
  builder: (yargs) =>
    yargs.option('port', { type: 'number', default: 3000 }),
  handler: (argv) => console.log(argv.port),
});`}</code>
          </pre>
        </section>
        <section className="workflow-band">
          <div className="container story-section">
            <div>
              <p className="eyebrow">Built for CLIs that keep growing</p>
              <h2>
                Load what runs.
                <br />
                Test what ships.
              </h2>
              <p>
                The tree is scanned once, but a group imports its commands only when Yargs enters it. Because a broken
                module in an unvisited group would otherwise hide, <code>validateCommands</code> imports every command
                in a test and checks the positional arguments, without running a handler.
              </p>
              <div className="story-links">
                <Link className="button button--primary" to="/docs/validation">
                  Validate your tree
                </Link>
                <Link to="/docs/groups-and-overlays">Layer generated commands →</Link>
              </div>
            </div>
            <pre className="story-code">
              <code>{`import { validateCommands } from 'yargs-file-commands';

it('validates the complete command tree', async () => {
  await expect(
    validateCommands({
      commandDirs: [import.meta.dirname + '/commands'],
    }),
  ).resolves.toBeUndefined();
});`}</code>
            </pre>
          </div>
        </section>
        <section className="container package-section" aria-labelledby="guides-title">
          <div className="section-heading">
            <p className="eyebrow">Keep reading</p>
            <h2 id="guides-title">Find your way around.</h2>
            <p>Short guides for the conventions, plus an API reference generated from the library source.</p>
          </div>
          <div className="package-grid">
            {guides.map((guide) => (
              <Link key={guide.name} to={guide.href} className="package-card">
                <p className="package-label">{guide.label}</p>
                <h3>{guide.name}</h3>
                <p>{guide.body}</p>
                <span>Read more →</span>
              </Link>
            ))}
          </div>
        </section>
        <section className="container home-callout">
          <div>
            <p className="eyebrow">Install</p>
            <h2>From a folder of files to a working CLI.</h2>
            <pre>
              <code>npm install yargs-file-commands yargs</code>
            </pre>
            <p>ESM only. Requires Node.js 22 or newer and Yargs 18.</p>
          </div>
          <div className="hero-actions">
            <Link className="button button--primary button--lg" to="/docs/getting-started">
              Read the getting started guide
            </Link>
          </div>
        </section>
      </main>
    </Layout>
  );
}
