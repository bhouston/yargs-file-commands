import type { Config } from '@docusaurus/types';

const url = process.env.SITE_URL ?? 'https://yargs-file-commands.ben3d.ca';
const baseUrl = process.env.BASE_URL ?? '/';
const description = 'Turn a directory of files into a typed, lazy-loading Yargs command tree.';

const link = (attributes: Record<string, string>) => ({ tagName: 'link', attributes });
// Raw head tags: `themeConfig.metadata` goes through Helmet, which keeps one tag per name and would drop a theme-color.
const themeColor = (content: string, scheme: string) => ({
  tagName: 'meta',
  attributes: { name: 'theme-color', content, media: `(prefers-color-scheme: ${scheme})` },
});

const config: Config = {
  title: 'Yargs File Commands',
  tagline: 'Your files are your command tree.',
  url,
  baseUrl,
  favicon: 'img/logo.svg',
  headTags: [
    link({ rel: 'icon', type: 'image/png', sizes: '32x32', href: `${baseUrl}img/favicon-32x32.png` }),
    link({ rel: 'apple-touch-icon', sizes: '180x180', href: `${baseUrl}img/apple-touch-icon.png` }),
    link({ rel: 'manifest', href: `${baseUrl}site.webmanifest` }),
    themeColor('#ffffff', 'light'),
    themeColor('#11151d', 'dark'),
    {
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Yargs File Commands',
        url: new URL(baseUrl, url).href,
        description,
      }),
    },
  ],
  organizationName: 'bhouston',
  projectName: 'yargs-file-commands',
  trailingSlash: true,
  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',
  markdown: { format: 'detect', hooks: { onBrokenMarkdownLinks: 'throw' } },
  presets: [
    [
      'classic',
      {
        docs: { sidebarPath: './sidebars.ts' },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      },
    ],
  ],
  themeConfig: {
    image: 'img/social-card.png',
    metadata: [
      { property: 'og:site_name', content: 'Yargs File Commands' },
      { name: 'twitter:site', content: '@BenHouston3D' },
    ],
    colorMode: { defaultMode: 'light', disableSwitch: true, respectPrefersColorScheme: true },
    navbar: {
      title: 'Yargs File Commands',
      logo: { alt: 'Command tree', src: 'img/logo.svg' },
      items: [
        { to: '/docs/getting-started', label: 'Guides', position: 'left' },
        { to: '/docs/file-conventions', label: 'File conventions', position: 'left' },
        { to: '/docs/api', label: 'API reference', position: 'left' },
        {
          href: 'https://github.com/bhouston/yargs-file-commands',
          html: '<span class="navbar-github-icon" aria-hidden="true"></span>',
          'aria-label': 'GitHub repository',
          title: 'GitHub repository',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Learn',
          items: [
            { label: 'Getting started', to: '/docs/getting-started' },
            { label: 'File conventions', to: '/docs/file-conventions' },
            { label: 'Validation and troubleshooting', to: '/docs/validation' },
          ],
        },
        {
          title: 'Build',
          items: [
            { label: 'Groups and overlays', to: '/docs/groups-and-overlays' },
            { label: 'API reference', to: '/docs/api' },
          ],
        },
        {
          title: 'Project',
          items: [
            { label: 'GitHub', href: 'https://github.com/bhouston/yargs-file-commands' },
            { label: 'npm', href: 'https://www.npmjs.com/package/yargs-file-commands' },
            { label: 'Report an issue', href: 'https://github.com/bhouston/yargs-file-commands/issues' },
            { label: 'Discord', href: 'https://discord.gg/fwupDN493R' },
          ],
        },
      ],
      copyright:
        'Made with ❤️ by <a href="https://ben3d.ca">Ben Houston</a>. Sponsored by <a href="https://landofassets.com">Land of Assets</a>',
    },
    prism: { additionalLanguages: ['bash', 'typescript'] },
  },
};
export default config;
