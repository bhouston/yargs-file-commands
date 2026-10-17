# Documentation website

From the repository root:

```sh
pnpm docs:dev
pnpm docs:build
```

The build regenerates `docs/api/` from the library's public TypeScript entry point and JSDoc using TypeDoc and typedoc-plugin-markdown. Edit API comments in the library source, not generated Markdown. Generated files and Docusaurus outputs are ignored.

Hand-written guides live in `docs/`. Markdown is parsed as standard Markdown so generated TypeScript signatures do not need MDX escaping. Broken links fail production builds.

The Pages workflow builds pull requests and deploys main using an uploaded GitHub Pages artifact. The repository must have Pages enabled with **GitHub Actions** as its build source. The configured production URL is https://bhouston.github.io/yargs-file-commands/.
