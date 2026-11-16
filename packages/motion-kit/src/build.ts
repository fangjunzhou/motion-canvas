import {mkdir, readFile, realpath, rm, writeFile} from 'node:fs/promises';
import {
  dirname,
  isAbsolute,
  join,
  posix,
  relative,
  resolve,
  sep,
} from 'node:path';
import ts from 'typescript';
import {build} from 'vite';
import type {
  CatalogDefinition,
  CatalogFile,
  CatalogItem,
  RegistryItem,
} from './types';

interface LoadedItem {
  item: CatalogItem;
  sources: ReadonlyMap<string, string>;
  example: string;
  documentation: string;
}

/** Generated registry, documentation, and self-contained preview locations. */
export interface CatalogBuild {
  readonly directory: string;
  readonly previews: readonly string[];
}

function checkPath(path: string): void {
  if (
    !/^[\w./-]+$/.test(path) ||
    isAbsolute(path) ||
    path !== posix.normalize(path) ||
    path === '..' ||
    path.startsWith('../')
  ) {
    throw new Error(`Expected a relative catalog path: ${path}`);
  }
}

async function readSource(root: string, path: string): Promise<string> {
  checkPath(path);
  const actual = await realpath(resolve(root, path));
  const local = relative(root, actual);
  if (isAbsolute(local) || local === '..' || local.startsWith(`..${sep}`)) {
    throw new Error(`Catalog source is outside its root: ${path}`);
  }
  return readFile(actual, 'utf8');
}

function moduleSpecifiers(
  source: string,
  filename: string,
): ts.StringLiteral[] {
  const file = ts.createSourceFile(
    filename,
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  const specifiers: ts.StringLiteral[] = [];
  function visit(node: ts.Node): void {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier);
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      specifiers.push(node.arguments[0]);
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return specifiers;
}

function resolveImport(
  filename: string,
  specifier: string,
  files: readonly CatalogFile[],
): CatalogFile {
  const path = posix.normalize(posix.join(posix.dirname(filename), specifier));
  const stem = path.replace(/\.jsx?$/, '');
  const candidates = [
    path,
    `${stem}.ts`,
    `${stem}.tsx`,
    `${path}/index.ts`,
    `${path}/index.tsx`,
  ];
  const file = files.find(candidate => candidates.includes(candidate.path));
  if (!file) {
    throw new Error(
      `Missing catalog dependency: ${filename} imports ${specifier}`,
    );
  }
  return file;
}

function packageName(specifier: string): string {
  const parts = specifier.split('/');
  return (
    specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
  ).replace(/@[^@/]+$/, '');
}

function dependenciesOf(
  item: CatalogItem,
  items: ReadonlyMap<string, CatalogItem>,
  stack: readonly string[] = [],
): CatalogItem[] {
  if (stack.includes(item.name)) {
    throw new Error(
      `Circular catalog dependency: ${[...stack, item.name].join(' -> ')}`,
    );
  }
  const dependencies = (item.requires ?? []).flatMap(name => {
    const dependency = items.get(name);
    if (!dependency) {
      throw new Error(`Unknown dependency ${name} in ${item.name}`);
    }
    return dependenciesOf(dependency, items, [...stack, item.name]);
  });
  return [...new Set([...dependencies, item])];
}

function validateImports(
  source: string,
  filename: string,
  dependencies: readonly CatalogItem[],
  destination?: string,
): void {
  const files = dependencies.flatMap(item => item.files);
  const packages = new Set(
    dependencies.flatMap(item => item.dependencies ?? []).map(packageName),
  );
  for (const specifier of moduleSpecifiers(source, filename)) {
    if (!specifier.text.startsWith('.')) {
      if (!packages.has(packageName(specifier.text))) {
        throw new Error(
          `Undeclared package: ${filename} imports ${specifier.text}`,
        );
      }
      continue;
    }
    const dependency = resolveImport(filename, specifier.text, files);
    if (destination) {
      const installed = resolveImport(
        destination,
        specifier.text,
        files.map(file => ({path: file.target, target: file.target})),
      );
      if (installed.path !== dependency.target) {
        throw new Error(
          `Import destination does not match ${filename}: ${specifier.text}`,
        );
      }
    }
  }
}

function installedExample(
  loaded: LoadedItem,
  dependencies: readonly CatalogItem[],
): string {
  let result = loaded.example;
  const filename = loaded.item.example;
  const files = dependencies.flatMap(item => item.files);
  const destination = `src/scenes/${loaded.item.name}.tsx`;
  for (const specifier of moduleSpecifiers(result, filename).reverse()) {
    if (!specifier.text.startsWith('.')) continue;
    const file = resolveImport(filename, specifier.text, files);
    let path = posix
      .relative(posix.dirname(destination), file.target)
      .replace(/\.tsx?$/, '');
    if (!path.startsWith('.')) path = `./${path}`;
    result =
      result.slice(0, specifier.getStart()) +
      JSON.stringify(path) +
      result.slice(specifier.end);
  }
  return result;
}

function fence(source: string, language: string): string {
  const length =
    Math.max(2, ...(source.match(/`+/g) ?? []).map(value => value.length)) + 1;
  const marker = '`'.repeat(length);
  return `${marker}${language}\n${source.trimEnd()}\n${marker}`;
}

function renderTemplate(
  template: string,
  values: Readonly<Record<string, string>>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = values[key];
    if (value === undefined) {
      throw new Error(`Unknown documentation placeholder: ${key}`);
    }
    return value;
  });
}

async function buildPreview(root: string, item: CatalogItem): Promise<string> {
  const output = await build({
    configFile: false,
    root,
    logLevel: 'error',
    oxc: {
      jsx: {
        runtime: 'automatic',
        importSource: '@canvas-commons/2d',
        development: false,
      },
    },
    build: {
      write: false,
      minify: false,
      target: 'es2022',
      lib: {entry: resolve(root, item.example), formats: ['es']},
      rollupOptions: {
        external: /^@canvas-commons\/(core|2d)(\/.*)?$/,
      },
    },
  });
  const outputs = Array.isArray(output) ? output : [output];
  for (const result of outputs) {
    if (!('output' in result)) continue;
    for (const chunk of result.output) {
      if (chunk.type !== 'chunk' || !chunk.isEntry) continue;
      const allowed = new Set([
        '@canvas-commons/core',
        '@canvas-commons/2d',
        '@canvas-commons/2d/jsx-runtime',
      ]);
      for (const specifier of moduleSpecifiers(chunk.code, `${item.name}.js`)) {
        if (!allowed.has(specifier.text)) {
          throw new Error(
            `Unsupported sandbox import in ${item.name}: ${specifier.text}`,
          );
        }
      }
      return chunk.code;
    }
  }
  throw new Error(`No preview module was built for ${item.name}`);
}

/**
 * Build source-owned registry items, documentation, and sandboxed previews.
 * All generated output is confined to the catalog's `dist` directory.
 *
 * @example
 * ```ts
 * await buildCatalog(catalog, '/path/to/packages/motion-kit');
 * ```
 */
export async function buildCatalog(
  catalog: CatalogDefinition,
  rootDirectory: string,
): Promise<CatalogBuild> {
  const root = await realpath(rootDirectory);
  const items = new Map<string, CatalogItem>();
  const targets = new Set<string>();
  const sources = new Set<string>();
  for (const item of catalog.items) {
    if (
      !/^[a-z][a-z0-9-]*$/.test(item.name) ||
      ['index', 'registry'].includes(item.name)
    ) {
      throw new Error(`Invalid catalog item name: ${item.name}`);
    }
    if (items.has(item.name)) {
      throw new Error(`Duplicate catalog item: ${item.name}`);
    }
    if (['components', 'blocks'].includes(item.layer) && !item.preview) {
      throw new Error(
        `Component and block items require a playable preview: ${item.name}`,
      );
    }
    for (const file of item.files) {
      checkPath(file.path);
      checkPath(file.target);
      if (sources.has(file.path)) {
        throw new Error(`Source has multiple catalog owners: ${file.path}`);
      }
      sources.add(file.path);
      if (targets.has(file.target)) {
        throw new Error(`Duplicate install destination: ${file.target}`);
      }
      targets.add(file.target);
    }
    items.set(item.name, item);
  }

  const loaded = await Promise.all(
    catalog.items.map(async item => {
      const sources = new Map(
        await Promise.all(
          item.files.map(
            async file =>
              [file.path, await readSource(root, file.path)] as const,
          ),
        ),
      );
      const [example, documentation] = await Promise.all([
        readSource(root, item.example),
        readSource(root, item.documentation),
      ]);
      const dependencies = dependenciesOf(item, items);
      for (const file of item.files) {
        const source = sources.get(file.path);
        if (source === undefined) {
          throw new Error(`Missing source: ${file.path}`);
        }
        if (/\.tsx?$/.test(file.path)) {
          validateImports(source, file.path, dependencies, file.target);
        }
      }
      // Preview scenes use the 2D runtime even when the distributed item is type-only.
      validateImports(example, item.example, [
        ...dependencies,
        {
          ...item,
          files: [],
          dependencies: ['@canvas-commons/2d', '@canvas-commons/core'],
        },
      ]);
      return {item, sources, example, documentation};
    }),
  );
  const [entryTemplate, overviewTemplate] = await Promise.all([
    readSource(root, 'templates/entry.mdx'),
    readSource(root, 'templates/index.mdx'),
  ]);
  const artifacts = new Map<string, string>();
  const registryItems: RegistryItem[] = [];
  const previews: string[] = [];
  for (const entry of loaded) {
    const {item, sources} = entry;
    const registryItem: RegistryItem = {
      name: item.name,
      title: item.title,
      description: item.description,
      type:
        item.layer === 'blocks'
          ? 'registry:block'
          : item.layer === 'components'
            ? 'registry:component'
            : 'registry:lib',
      files: item.files.map(file => {
        const content = sources.get(file.path);
        if (content === undefined) {
          throw new Error(`Missing source: ${file.path}`);
        }
        return {
          ...file,
          target: `~/${file.target}`,
          type: 'registry:file',
          content,
        };
      }),
      dependencies: [...(item.dependencies ?? [])],
      registryDependencies: (item.requires ?? []).map(name => `./${name}.json`),
      meta: {layer: item.layer},
    };
    registryItems.push(registryItem);
    artifacts.set(
      `static/r/motion-kit/${item.name}.json`,
      JSON.stringify(
        {
          $schema: 'https://ui.shadcn.com/schema/registry-item.json',
          ...registryItem,
        },
        null,
        2,
      ) + '\n',
    );
    const example = installedExample(entry, dependenciesOf(item, items));
    artifacts.set(`usage/${item.name}.${item.preview ? 'tsx' : 'ts'}`, example);
    const dependencies = dependenciesOf(item, items).filter(
      dependency => dependency !== item,
    );
    const preview = item.preview ? await buildPreview(root, item) : undefined;
    artifacts.set(
      `docs/${item.name}.mdx`,
      renderTemplate(entryTemplate, {
        title: JSON.stringify(item.title),
        name: item.name,
        description: item.description,
        preview: preview
          ? `<Fiddle mode="preview" ratio="16/9" width="1920" scrubbable showSource={false}>\n{${JSON.stringify(preview)}}\n</Fiddle>`
          : 'This item defines TypeScript contracts and has no visual preview.',
        dependencies:
          dependencies
            .map(
              dependency => `- [${dependency.title}](./${dependency.name}.mdx)`,
            )
            .join('\n') || 'No other catalog items are required.',
        files: registryItem.files
          .map(
            file =>
              `- Copy \`${file.path}\` to \`${file.target.replace(/^~\//, '')}\`.`,
          )
          .join('\n'),
        usage: fence(example, item.preview ? 'tsx' : 'ts'),
        documentation: entry.documentation.trim(),
        sources: registryItem.files
          .map(
            file =>
              `### ${posix.basename(file.path)}\n\n${fence(file.content, posix.extname(file.path).slice(1))}`,
          )
          .join('\n\n'),
      }),
    );
    if (preview) {
      const path = `previews/${item.name}.js`;
      previews.push(path);
      artifacts.set(path, preview);
    }
  }
  artifacts.set(
    'static/r/motion-kit/registry.json',
    JSON.stringify(
      {
        $schema: 'https://ui.shadcn.com/schema/registry.json',
        name: catalog.name,
        homepage: catalog.homepage,
        items: registryItems,
      },
      null,
      2,
    ) + '\n',
  );
  artifacts.set(
    'docs/index.mdx',
    renderTemplate(overviewTemplate, {
      items: catalog.items
        .map(
          item =>
            `| [${item.title}](./${item.name}.mdx) | ${item.layer} | ${item.description} |`,
        )
        .join('\n'),
    }),
  );
  const directory = join(root, 'dist');
  await rm(directory, {recursive: true, force: true});
  await Promise.all(
    [...artifacts].map(async ([path, content]) => {
      const destination = join(directory, path);
      await mkdir(dirname(destination), {recursive: true});
      await writeFile(destination, content);
    }),
  );
  return {directory, previews: previews.map(path => join(directory, path))};
}
