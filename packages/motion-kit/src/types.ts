/** The layer that owns a catalog item. */
export type CatalogLayer = 'foundations' | 'motion' | 'components' | 'blocks';

/** A canonical source file and its destination in a consuming project. */
export interface CatalogFile {
  readonly path: string;
  readonly target: string;
}

/**
 * An editable source item, its dependencies, and its documentation inputs.
 *
 * @example
 * ```ts
 * const item: CatalogItem = {
 *   name: 'theme',
 *   title: 'Theme',
 *   description: 'Shared design tokens.',
 *   layer: 'foundations',
 *   files: [{path: 'registry/foundations/theme.ts', target: 'src/components/motion/foundations/theme.ts'}],
 *   dependencies: ['@canvas-commons/core@^0.4.0'],
 *   documentation: 'documentation/theme.md',
 *   example: 'examples/theme.tsx',
 *   preview: true,
 * };
 * ```
 */
export interface CatalogItem {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly layer: CatalogLayer;
  readonly files: readonly CatalogFile[];
  readonly dependencies?: readonly string[];
  readonly requires?: readonly string[];
  readonly documentation: string;
  readonly example: string;
  readonly preview?: boolean;
}

/** The source catalog. Its items become shadcn-compatible registry payloads. */
export interface CatalogDefinition {
  readonly name: string;
  readonly homepage: string;
  readonly items: readonly CatalogItem[];
}

/** A generated source file using shadcn's generic file distribution format. */
export interface RegistryFile extends CatalogFile {
  readonly type: 'registry:file';
  readonly content: string;
}

/** The subset of the shadcn registry-item schema used by Motion Kit. */
export interface RegistryItem {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly type: 'registry:lib' | 'registry:component' | 'registry:block';
  readonly files: readonly RegistryFile[];
  readonly dependencies: readonly string[];
  readonly registryDependencies: readonly string[];
  readonly meta: {readonly layer: CatalogLayer};
}
