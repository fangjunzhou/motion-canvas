import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
import {afterEach, describe, expect, it} from 'vitest';
import {buildCatalog} from './build';
import {catalog} from './catalog';
import type {CatalogDefinition} from './types';

const PackageRoot = fileURLToPath(new URL('../', import.meta.url));
const TemporaryRoots: string[] = [];

async function fixture(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'motion-kit-'));
  TemporaryRoots.push(root);
  await Promise.all(
    ['registry', 'documentation', 'examples', 'templates'].map(path =>
      cp(join(PackageRoot, path), join(root, path), {recursive: true}),
    ),
  );
  return root;
}

afterEach(async () => {
  await Promise.all(
    TemporaryRoots.splice(0).map(root =>
      rm(root, {recursive: true, force: true}),
    ),
  );
});

describe('catalog distribution', () => {
  it('keeps registry source, documentation, and previews tied to the canonical files', async () => {
    const root = await fixture();
    const path = 'registry/foundations/theme.ts';
    const original = await readFile(join(root, path), 'utf8');
    const source = original.replace("mauve: '#cba6f7'", "accent: '#f97316'");
    await writeFile(join(root, path), source);
    const result = await buildCatalog(catalog, root);

    const payload: unknown = JSON.parse(
      await readFile(
        join(result.directory, 'static/r/motion-kit/theme.json'),
        'utf8',
      ),
    );
    expect(payload).toMatchObject({
      $schema: 'https://ui.shadcn.com/schema/registry-item.json',
      type: 'registry:lib',
      dependencies: ['@canvas-commons/core@^0.4.0'],
      files: [
        {
          path,
          target: '~/src/components/motion/foundations/theme.ts',
          type: 'registry:file',
          content: source,
        },
      ],
    });
    const docs = await readFile(
      join(result.directory, 'docs/theme.mdx'),
      'utf8',
    );
    expect(docs).toContain(source.trimEnd());
    expect(docs).toContain('../components/motion/foundations/theme');
    expect(docs).not.toContain("from '../registry/");
    expect(docs).toContain('<Fiddle mode="preview" ratio="16/9" width="1920"');
    expect(docs).toContain('scrubbable showSource={false}');
    const preview = await readFile(result.previews[0], 'utf8');
    expect(preview).toContain('#f97316');
    expect(preview).not.toContain('../registry/');
    expect(preview).not.toContain('@canvas-commons/motion-kit');

    await writeFile(join(result.directory, 'docs/removed-item.mdx'), 'stale');
    await buildCatalog(catalog, root);
    await expect(
      readFile(join(result.directory, 'docs/removed-item.mdx')),
    ).rejects.toMatchObject({code: 'ENOENT'});
  });

  it('type-checks the documented examples against only the copied source and framework packages', async () => {
    const root = await fixture();
    const result = await buildCatalog(catalog, root);
    const consumer = join(root, 'consumer');
    await mkdir(join(consumer, 'src/scenes'), {recursive: true});
    await symlink(
      join(PackageRoot, 'node_modules'),
      join(consumer, 'node_modules'),
      'dir',
    );
    const rootNames: string[] = [];
    for (const item of catalog.items) {
      for (const file of item.files) {
        const destination = join(consumer, file.target);
        await mkdir(dirname(destination), {recursive: true});
        await cp(join(root, file.path), destination);
        rootNames.push(destination);
      }
      const filename = `${item.name}.${item.preview ? 'tsx' : 'ts'}`;
      const destination = join(consumer, 'src/scenes', filename);
      await cp(join(result.directory, 'usage', filename), destination);
      rootNames.push(destination);
    }
    const program = ts.createProgram(rootNames, {
      noEmit: true,
      strict: true,
      skipLibCheck: true,
      types: [],
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      experimentalDecorators: true,
      jsx: ts.JsxEmit.ReactJSX,
      jsxImportSource: '@canvas-commons/2d',
    });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    expect(
      diagnostics.map(
        diagnostic =>
          `${diagnostic.file?.fileName}:${diagnostic.start}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`,
      ),
    ).toEqual([]);
  });

  it('distributes local dependency addresses and preserves installed relative imports', async () => {
    const root = await fixture();
    await writeFile(
      join(root, 'registry/components/example.ts'),
      "import {defaultTheme} from '../foundations/theme';\nexport const accent = defaultTheme.colors.accent;\n",
    );
    const definition: CatalogDefinition = {
      ...catalog,
      items: [
        ...catalog.items,
        {
          name: 'example',
          title: 'Example',
          description: 'Dependency fixture',
          layer: 'components',
          files: [
            {
              path: 'registry/components/example.ts',
              target: 'src/components/motion/components/example.ts',
            },
          ],
          requires: ['theme'],
          documentation: 'documentation/theme.md',
          example: 'examples/theme.tsx',
          preview: true,
        },
      ],
    };
    const result = await buildCatalog(definition, root);
    const payload: unknown = JSON.parse(
      await readFile(
        join(result.directory, 'static/r/motion-kit/example.json'),
        'utf8',
      ),
    );
    expect(payload).toMatchObject({registryDependencies: ['./theme.json']});

    const broken: CatalogDefinition = {
      ...definition,
      items: definition.items.map(item =>
        item.name === 'example'
          ? {
              ...item,
              files: [
                {
                  path: 'registry/components/example.ts',
                  target: 'src/example.ts',
                },
              ],
            }
          : item,
      ),
    };
    await expect(buildCatalog(broken, root)).rejects.toThrow(
      /Missing catalog dependency/,
    );
  });

  it('rejects incomplete dependency graphs before replacing the previous build', async () => {
    const root = await fixture();
    const result = await buildCatalog(catalog, root);
    const original = await readFile(
      join(result.directory, 'docs/theme.mdx'),
      'utf8',
    );
    const missing: CatalogDefinition = {
      ...catalog,
      items: catalog.items.map(item => ({...item, requires: ['absent']})),
    };
    await expect(buildCatalog(missing, root)).rejects.toThrow(
      'Unknown dependency absent',
    );
    expect(
      await readFile(join(result.directory, 'docs/theme.mdx'), 'utf8'),
    ).toBe(original);
    const circular: CatalogDefinition = {
      ...catalog,
      items: catalog.items.map(item => ({
        ...item,
        requires: [item.name === 'theme' ? 'motion' : 'theme'],
      })),
    };
    await expect(buildCatalog(circular, root)).rejects.toThrow(
      /Circular catalog dependency/,
    );
  });

  it('rejects undeclared packages and missing distributed source', async () => {
    const root = await fixture();
    await writeFile(
      join(root, 'registry/foundations/theme.ts'),
      "export {value} from 'unlisted-package';\n",
    );
    await expect(buildCatalog(catalog, root)).rejects.toThrow(
      /Undeclared package/,
    );
    await writeFile(
      join(root, 'registry/foundations/theme.ts'),
      "export {value} from './absent';\n",
    );
    await expect(buildCatalog(catalog, root)).rejects.toThrow(
      /Missing catalog dependency/,
    );
  });

  it('requires previews for components and unique install destinations', async () => {
    const root = await fixture();
    const withoutPreview: CatalogDefinition = {
      ...catalog,
      items: catalog.items.map(item => ({
        ...item,
        layer: 'components',
        preview: false,
      })),
    };
    await expect(buildCatalog(withoutPreview, root)).rejects.toThrow(
      /require a playable preview/,
    );
    const repeated: CatalogDefinition = {
      ...catalog,
      items: [...catalog.items, ...catalog.items],
    };
    await expect(buildCatalog(repeated, root)).rejects.toThrow(
      /Duplicate catalog item/,
    );
    const collision: CatalogDefinition = {
      ...catalog,
      items: catalog.items.map(item => ({
        ...item,
        files: item.files.map(file => ({...file, target: 'src/same.ts'})),
      })),
    };
    await expect(buildCatalog(collision, root)).rejects.toThrow(
      /Duplicate install destination/,
    );
  });
});
