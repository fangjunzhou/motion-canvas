# Motion Kit

A private source catalog for personal Canvas Commons animations. The initial
toolkit establishes foundations, a motion contract, registry generation, and
documentation. The component catalog includes Card, Badge, Progress, and
presentation slides. Further components and blocks are added when real
animations establish their requirements.

## Working locally

Run these commands from the monorepo root:

```sh
pnpm motion-kit:dev
pnpm motion-kit:build
pnpm motion-kit:test
pnpm --filter @canvas-commons/motion-kit run typecheck
pnpm docs:dev
```

The gallery lives at `/motion-kit` on the documentation server. `docs:dev` and
`docs:build` generate the catalog first. Build the runtime packages with
`pnpm build` before starting either command in a fresh checkout. The other
documentation examples still use the repository's `pnpm examples:build` command.

The **Motion Kit Showcase** is the first project under **Try the editor** at
`/editor/`, with a direct route at `/editor/motion-kit-showcase/`. An opening
title slide introduces the demo. The following three scenes use Cards to present
the four Catppuccin palettes, demonstrate shared signals and scene timing, and
explain two animation principles. The project lives in
`packages/motion-kit/demo/motion-kit-showcase.ts` and imports the canonical
registry source directly. Run `pnpm motion-kit:dev` to open its own editor
locally. `pnpm motion-kit:demo:build` bundles the demo into `dist/static/demos`;
the docs development and build commands run this automatically after generating
the registry. The demo scenes live under `demo/`; their shared presentation
frame is the registry's `ContentSlide` component.

The Card scene demonstrates the composable `CardHeader`, `CardTitle`,
`CardDescription`, `CardContent`, and `CardFooter` nodes. It reveals the text in
order, shows and hides the footer, then resizes before replacing the content. It
also shows and hides a Cornell box cover, then changes it to a square Stanford
bunny image. Image credits and licenses are in `demo/assets/README.md`. Copy the
`card` registry item with its `theme` dependency to use these parts in your own
scenes.

The `slide` registry item includes `TitleSlide`, `ContentSlide`, `SectionSlide`,
and `BlankSlide`. Their default canvas is 1920 × 1080, with presentation title
sizes based on Keynote’s White widescreen template. Use a slide’s `theme` prop
to customize its typography, padding, and gaps.

## Layers

| Directory              | Purpose                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| `registry/foundations` | Semantic theme tokens, immutable local overrides, motion defaults |
| `registry/motion`      | Optional animation capabilities using core generators             |
| `registry/components`  | Native scene objects, added as needed                             |
| `registry/blocks`      | Compositions of components, added as needed                       |
| `examples`             | Canonical usage examples and playable scenes                      |
| `demo`                 | Standalone showcase project, scenes, and presentation layout      |
| `documentation`        | Authored API explanations                                         |
| `templates`            | Shared documentation and catalog templates                        |
| `src`                  | Typed catalog and build tooling                                   |

Scene files inherit the `@canvas-commons/2d` JSX runtime and legacy decorator
configuration. The catalog's TypeScript configuration additionally enables
strict type checks. React and Preact do not belong in distributed scene source.

## Catppuccin color schemes

The built-in schemes are Latte, Frappé, Macchiato, and Mocha, using the
[official Catppuccin palette](https://catppuccin.com/palette/). Mocha is the
default. Every flavor exposes all 26 exact official colors through
`catppuccinPalettes` and `theme.colors`, including `rosewater`, `blue`,
`surface0`, `base`, `mantle`, and `crust`. Semantic tokens such as `accent` are
aliases of those colors. Select a flavor and optionally override individual
tokens:

```ts
const theme = createTheme({flavor: 'latte', spacing: {medium: 40}});
```

`catppuccinThemes.latte`, `.frappe`, `.macchiato`, and `.mocha` expose the
frozen presets directly. `createTheme()` and existing override-only calls use
Mocha.

Typography roles cover presentation titles, slide headings, subtitles, component
titles, body text, labels, and captions. The `padding` scale controls container
insets; `spacing` controls layout gaps. Both offer `small`, `medium`, and
`large` sizes. Components use these defaults, so scenes only need styling props
when they differ from the theme.

## Source ownership

The toolkit is an authoring workspace, not an animation runtime dependency. Copy
an item's source into the documented destination in your animation project. Use
the Canvas Commons package versions already supported by that project; the
initial registry declares compatibility with the `0.4` release line.

For example, `theme` installs at:

```text
src/components/motion/foundations/theme.ts
```

Scenes import that local file. Edit it freely and commit changes in the
consuming project. To update, compare a newer registry payload with your copy
and apply the changes you want. Nothing here overwrites installed copies.

## Canonical source and generated output

`src/catalog.ts` declares items, layers, source paths, install destinations, npm
dependencies, required catalog items, documentation, and examples. Each source
file has exactly one owner; use `requires` to share it with another item.
External imports must be declared in the item's dependency closure, and relative
imports must resolve both in the source tree and at their install destinations.

`pnpm motion-kit:build` generates ignored artifacts:

```text
lib/                         Node build tooling and declarations
dist/docs/                   Documentation pages
dist/previews/               Self-contained preview modules for the playground
dist/usage/                  Usage examples with consuming-project imports
dist/static/r/motion-kit/    Registry catalog and individual JSON payloads
```

The JSON follows shadcn's
[registry schema](https://ui.shadcn.com/docs/registry). TypeScript themes use
`registry:lib`; their files use the generic `registry:file` type with explicit
targets. Local catalog dependencies become relative item JSON addresses. There
is no CSS or Tailwind configuration in the registry.

Installation starts with copying source. Direct use of the shadcn installer has
not been validated for this runtime. This package has no installer or publishing
command and is excluded from the shared release group.

The docs website serves the generated JSON under `/r/motion-kit`. Each gallery
entry reads its source and example during the same catalog build. Vite bundles
the canonical example with its local source for the existing sandboxed
playground, while keeping the Canvas Commons runtime external. Gallery previews
support replay and scrubbing, and their source remains available in the usage
section.

## Adding a component

1. Implement it under `registry/components`, extending the nearest native node.
2. Preserve inherited layout props and bind reactive child properties to
   signals.
3. Document a content area for containers and keep internal references private.
4. Add a scene under `examples` and API notes under `documentation`.
5. Register the source files, install destinations, dependencies, and example in
   `src/catalog.ts`. Set `preview: true` for components and blocks.
6. Run the package checks and inspect the generated gallery.

The `templates/entry.mdx` template covers preview, installation, dependencies,
usage, API notes, source, and updates. Examples must have a default scene export
when used as a preview. Their local imports are rewritten only in generated
usage snippets, to match installation under `src/scenes`.

Meaningful `enter`, `exit`, and `emphasize` methods accept duration in seconds
and a core `TimingFunction`, and return a `ThreadGenerator`. The caller
schedules them. Define and document their initial state, final state,
repetition, and zero-duration behavior. Do not start animation threads in
constructors.

Before accepting a component, verify fresh-project copying, reactive updates,
independent instances, layout composition, reset/replay/seeking, cloning when
supported, and agreement between the preview and documentation. Runtime
components and distribution changes still follow the repository's contribution
and changeset rules if they later become public.
