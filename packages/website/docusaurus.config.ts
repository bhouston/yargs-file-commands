import type { Config } from '@docusaurus/types';

const config: Config = {
  title: 'Yargs File Commands',
  tagline: 'Your files are your command tree.',
  favicon: 'img/logo.svg',
  url: 'https://bhouston.github.io',
  baseUrl: '/yargs-file-commands/',
  organizationName: 'bhouston',
  projectName: 'yargs-file-commands',
  trailingSlash: true,
  onBrokenLinks: 'throw',
  markdown: { format: 'md', hooks: { onBrokenMarkdownLinks: 'throw' } },
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
    navbar: {
      title: 'Yargs File Commands',
      logo: { alt: 'Command tree', src: 'img/logo.svg' },
      items: [
        { to: '/docs/getting-started', label: 'Guides', position: 'left' },
        { to: '/docs/api', label: 'API reference', position: 'left' },
        { href: 'https://www.npmjs.com/package/yargs-file-commands', label: 'npm', position: 'right' },
        { href: 'https://github.com/bhouston/yargs-file-commands', label: 'GitHub', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} Yargs File Commands · MIT · Created by <a href="https://ben3d.ca">Ben Houston</a> · Sponsored by <a href="https://landofassets.com">Land of Assets</a>`,
    },
    prism: { additionalLanguages: ['bash', 'typescript'] },
  },
};
export default config;
