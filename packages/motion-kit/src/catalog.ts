import type {CatalogDefinition} from './types';

/**
 * The canonical catalog. Components and blocks are added as real scenes need them.
 *
 * @example
 * ```ts
 * const foundationItems = catalog.items.filter(item => item.layer === 'foundations');
 * ```
 */
export const catalog: CatalogDefinition = {
  name: 'motion-kit',
  homepage: 'https://canvascommons.io/motion-kit',
  items: [
    {
      name: 'theme',
      title: 'Theme',
      description:
        'Four Catppuccin color schemes with immutable local overrides.',
      layer: 'foundations',
      files: [
        {
          path: 'registry/foundations/theme.ts',
          target: 'src/components/motion/foundations/theme.ts',
        },
      ],
      dependencies: ['@canvas-commons/core@^0.4.0'],
      documentation: 'documentation/theme.md',
      example: 'examples/theme.tsx',
      preview: true,
    },
    {
      name: 'motion',
      title: 'Motion contracts',
      description:
        'Optional animation methods controlled by the calling scene.',
      layer: 'motion',
      files: [
        {
          path: 'registry/motion/contracts.ts',
          target: 'src/components/motion/motion/contracts.ts',
        },
      ],
      dependencies: ['@canvas-commons/core@^0.4.0'],
      documentation: 'documentation/motion.md',
      example: 'examples/motion.ts',
    },
    {
      name: 'card',
      title: 'Card',
      description:
        'Composable native cards with animated images, text, and footers.',
      layer: 'components',
      files: [
        {
          path: 'registry/components/Card.ts',
          target: 'src/components/motion/components/Card.ts',
        },
      ],
      dependencies: ['@canvas-commons/2d@^0.4.0'],
      requires: ['theme'],
      documentation: 'documentation/card.md',
      example: 'examples/card.tsx',
      preview: true,
    },
    {
      name: 'badge',
      title: 'Badge',
      description:
        'Compact native labels with reactive text and six visual variants.',
      layer: 'components',
      files: [
        {
          path: 'registry/components/Badge.ts',
          target: 'src/components/motion/components/Badge.ts',
        },
      ],
      dependencies: ['@canvas-commons/2d@^0.4.0'],
      requires: ['theme'],
      documentation: 'documentation/badge.md',
      example: 'examples/badge.tsx',
      preview: true,
    },
    {
      name: 'progress',
      title: 'Progress',
      description:
        'A reactive progress track with bounded values and themed colors.',
      layer: 'components',
      files: [
        {
          path: 'registry/components/Progress.ts',
          target: 'src/components/motion/components/Progress.ts',
        },
      ],
      dependencies: ['@canvas-commons/2d@^0.4.0'],
      requires: ['theme'],
      documentation: 'documentation/progress.md',
      example: 'examples/progress.tsx',
      preview: true,
    },
    {
      name: 'slide',
      title: 'Presentation slides',
      description:
        'Widescreen title, content, section, and blank layouts for animated presentations.',
      layer: 'components',
      files: [
        {
          path: 'registry/components/Slide.ts',
          target: 'src/components/motion/components/Slide.ts',
        },
      ],
      dependencies: ['@canvas-commons/2d@^0.4.0'],
      requires: ['theme'],
      documentation: 'documentation/slide.md',
      example: 'examples/slide.tsx',
      preview: true,
    },
    {
      name: 'highlight',
      title: 'Text Highlight',
      description: 'A seeded marker that draws behind selected, wrapping text.',
      layer: 'components',
      files: [
        {
          path: 'registry/components/Highlight.ts',
          target: 'src/components/motion/components/Highlight.ts',
        },
      ],
      dependencies: ['@canvas-commons/2d@^0.4.0'],
      requires: ['theme'],
      documentation: 'documentation/highlight.md',
      example: 'examples/highlight.tsx',
      preview: true,
    },
  ],
};
