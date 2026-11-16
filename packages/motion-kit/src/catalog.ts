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
  ],
};
