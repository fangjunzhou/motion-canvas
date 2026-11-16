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
      requires: ['theme', 'effects'],
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
      requires: ['theme', 'effects'],
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
    {
      name: 'ink-arrow',
      title: 'Ink Arrow',
      description:
        'A seeded, tapered arrow with stop-motion shaft and head reveals.',
      layer: 'components',
      files: [
        {
          path: 'registry/components/InkArrow.ts',
          target: 'src/components/motion/components/InkArrow.ts',
        },
      ],
      dependencies: ['@canvas-commons/2d@^0.4.0'],
      requires: ['theme'],
      documentation: 'documentation/ink-arrow.md',
      example: 'examples/ink-arrow.tsx',
      preview: true,
    },
    {
      name: 'effects',
      title: 'Motion Effects',
      description: 'Push, flicker, wipe, and transform native scene nodes.',
      layer: 'motion',
      files: [
        {
          path: 'registry/motion/effects.ts',
          target: 'src/components/motion/motion/effects.ts',
        },
      ],
      dependencies: ['@canvas-commons/2d@^0.4.0'],
      requires: ['theme'],
      documentation: 'documentation/effects.md',
      example: 'examples/effects.tsx',
      preview: true,
    },
    {
      name: 'region-highlight',
      title: 'Region Highlight',
      description:
        'Reveal a marker over source coordinates in an image or document.',
      layer: 'components',
      files: [
        {
          path: 'registry/components/RegionHighlight.ts',
          target: 'src/components/motion/components/RegionHighlight.ts',
        },
        {
          path: 'registry/assets/transformer-paper.ts',
          target: 'src/components/motion/assets/transformer-paper.ts',
        },
      ],
      dependencies: ['@canvas-commons/2d@^0.4.0'],
      requires: ['theme'],
      documentation: 'documentation/region-highlight.md',
      example: 'examples/region-highlight.tsx',
      preview: true,
    },
    {
      name: 'paper-stack',
      title: 'Paper Stack',
      description: 'Layer cards and images with an animated page focus window.',
      layer: 'components',
      files: [
        {
          path: 'registry/components/PaperStack.ts',
          target: 'src/components/motion/components/PaperStack.ts',
        },
      ],
      dependencies: ['@canvas-commons/2d@^0.4.0'],
      requires: ['card'],
      documentation: 'documentation/paper-stack.md',
      example: 'examples/paper-stack.tsx',
      preview: true,
    },
    {
      name: 'chart',
      title: 'Chart',
      description:
        'Compose reactive axes and clipped data lines in a plot frame.',
      layer: 'components',
      files: [
        {
          path: 'registry/components/Chart.ts',
          target: 'src/components/motion/components/Chart.ts',
        },
      ],
      dependencies: ['@canvas-commons/2d@^0.4.0'],
      requires: ['theme'],
      documentation: 'documentation/chart.md',
      example: 'examples/chart.tsx',
      preview: true,
    },
    {
      name: 'table',
      title: 'Table',
      description:
        'Composable themed rows and weighted cells with row and column reveals.',
      layer: 'components',
      files: [
        {
          path: 'registry/components/Table.ts',
          target: 'src/components/motion/components/Table.ts',
        },
      ],
      dependencies: ['@canvas-commons/2d@^0.4.0'],
      requires: ['card', 'highlight'],
      documentation: 'documentation/table.md',
      example: 'examples/table.tsx',
      preview: true,
    },
    {
      name: 'list',
      title: 'List',
      description:
        'Shape-marked lists with wrapping labels and staggered native entrances.',
      layer: 'components',
      files: [
        {
          path: 'registry/components/List.ts',
          target: 'src/components/motion/components/List.ts',
        },
      ],
      dependencies: ['@canvas-commons/2d@^0.4.0'],
      requires: ['theme', 'effects'],
      documentation: 'documentation/list.md',
      example: 'examples/list.tsx',
      preview: true,
    },
    {
      name: 'video-card',
      title: 'Video Card',
      description:
        'Aspect-preserving video covers, clip changes, and post-intro loops.',
      layer: 'components',
      files: [
        {
          path: 'registry/components/VideoCard.ts',
          target: 'src/components/motion/components/VideoCard.ts',
        },
      ],
      dependencies: ['@canvas-commons/2d@^0.4.0'],
      requires: ['card'],
      documentation: 'documentation/video-card.md',
      example: 'examples/video-card.tsx',
      preview: true,
    },
    {
      name: 'flow',
      title: 'Flow',
      description:
        'Sequences of cards with animated, optionally labeled connectors.',
      layer: 'components',
      files: [
        {
          path: 'registry/components/Flow.ts',
          target: 'src/components/motion/components/Flow.ts',
        },
      ],
      dependencies: ['@canvas-commons/2d@^0.4.0'],
      requires: ['card'],
      documentation: 'documentation/flow.md',
      example: 'examples/flow.tsx',
      preview: true,
    },
  ],
};
