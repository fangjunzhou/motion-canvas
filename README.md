<br/>
<p align="center">
  <a href="https://canvas-commons.github.io">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://canvas-commons.github.io/img/logo_dark.svg">
      <img width="180" alt="Canvas Commons logo" src="https://canvas-commons.github.io/img/logo.svg">
    </picture>
  </a>
</p>
<p align="center">
  <a href="https://pnpm.io"><img src="https://img.shields.io/badge/managed%20with-pnpm-f69220?style=for-the-badge" alt="managed with pnpm"></a>
  <a href="https://vitejs.dev"><img src="https://img.shields.io/badge/powered%20by-vite-646cff?style=for-the-badge" alt="powered by vite"></a>
  <a href="https://www.npmjs.com/package/@canvas-commons/core"><img src="https://img.shields.io/npm/v/@canvas-commons/core?style=for-the-badge" alt="npm package version"></a>
  <a href="https://chat.canvascommons.io"><img src="https://img.shields.io/discord/1396626525331132437?style=for-the-badge&logo=discord&logoColor=fff&color=404eed" alt="discord"></a>
</p>
<br/>

# Canvas Commons

Canvas Commons is two things:

- A TypeScript library that uses generators to program animations.
- An editor providing a real-time preview of said animations.

It's a specialized tool designed to create informative vector animations and
synchronize them with voice-overs.

Aside from providing the preview, the editor allows you to edit certain aspects
of the animation which could otherwise be tedious.

## Using Canvas Commons

Check out our [getting started][docs] guide to learn how to use Canvas Commons.

## Developing Canvas Commons locally

The project is maintained as one monorepo containing the following packages:

| Name          | Description                                                    |
| ------------- | -------------------------------------------------------------- |
| `2d`          | The default renderer for 2D motion graphics                    |
| `core`        | All logic related to running and rendering animations.         |
| `create`      | A package for bootstrapping new projects.                      |
| `docs`        | [Our documentation website.][docs]                             |
| `e2e`         | End-to-end tests.                                              |
| `editor`      | The user interface used for editing.                           |
| `examples`    | Animation examples used in documentation.                      |
| `ffmpeg`      | Vite plugin and exporter for FFmpeg-driven video rendering.    |
| `player`      | A custom element for displaying animations in a browser.       |
| `template`    | A template project included for developer's convenience.       |
| `vite-plugin` | A plugin for Vite used for developing and bundling animations. |

Node 20.19 or newer is required. After cloning the repo, run `pnpm install` in
the root of the project to install all necessary dependencies. Then run
`pnpm run build` to build all the packages.

### Developing with Nix

With [Nix](https://nixos.org/download/) and flakes enabled, enter the
development shell from the repository root:

```bash
nix develop
pnpm install --frozen-lockfile
pnpm run build
```

The shell provides Node 22 and Corepack's pnpm shims on Linux x86_64 and macOS
(Intel and Apple Silicon). Corepack uses the pnpm version pinned in
`package.json` and may download it on first use. Entering the shell does not
install project dependencies.

Intel macOS uses Nixpkgs 26.05 because the unstable branch no longer supports
that platform.

If you use [direnv](https://direnv.net/) with Nix integration, run
`direnv allow` once to load the shell automatically when entering the
repository. E2E tests continue to use the existing Playwright or Docker setup.

#### Static demo

Build the official homepage and documentation site, including the interactive
demos:

```bash
nix build .#doc
```

The `result/` directory contains the static site. Its sandboxed playground needs
CORS headers from the web server. To build and serve the demo with those headers
at <http://127.0.0.1:8000>, run:

```bash
nix run .#doc
```

The online editor demo is available at <http://127.0.0.1:8000/editor/>.

Pass a different port with `nix run .#doc -- 8080`. The demo is also the default
output, so `nix build` and `nix run` work without specifying `.#doc`.

### Deploying documentation to GitHub Pages

In your fork's **Settings → Pages**, select **GitHub Actions** as the build and
deployment source. Enable workflows in the **Actions** tab if GitHub has
disabled them for the fork.

The **Deploy Documentation to GitHub Pages** workflow deploys on pushes to
`main` and can also be run manually from the Actions tab. It publishes to the
current repository using `GITHUB_TOKEN`; no deploy key is required. For this
fork, the site is served at <https://fangjunzhou.github.io/motion-canvas/>.

The workflow obtains the site URL and base path from GitHub Pages and omits the
upstream custom domain. For a local build with the same paths, set
`DOCS_URL=https://fangjunzhou.github.io` and `DOCS_BASE_URL=/motion-canvas/`
when running the build commands above.

### Developing Editor

When developing the editor, run the following command:

```bash
pnpm run template:dev
```

It will start a vite server that watches the `core`, `2d`, `editor`, and
`vite-plugin` packages. The `template` package itself contains a simple
canvas-commons project that can be used during development.

### Developing Player

To develop the player, first build the template: `pnpm run template:build`.
Then, start `pnpm run player:dev`.

## Installing a local version of Canvas Commons in a project

It can be useful to install a local version of Canvas Commons in a standalone
project. For example, when you want to use your own fork with some custom-made
features to create your animations.

Let's assume the following project structure:

```
projects/
├── canvas-commons/ <- your local monorepo
└── my-project/ <- a bootstrapped project
    └── package.json
```

You can link the local packages from the monorepo by updating the `package.json`
of your project. Simply replace the version with a `file:` followed by a
relative path to the package you want to link:

```diff
  "dependencies": {
-   "@canvas-commons/core": "^0.2.0",
+   "@canvas-commons/core": "file:../canvas-commons/packages/core",
    // ...
  },
```

If you're linking the `editor` package, you'll also need to modify
`vite.config.ts` to allow vite to load external files:

```ts
import {defineConfig} from 'vite';
import canvasCommons from '@canvas-commons/vite-plugin';

export default defineConfig({
  server: {
    fs: {
      // let it load external files
      strict: false,
    },
  },
  plugins: [canvasCommons()],
});
```

This is necessary because the editor styles are loaded using the `/@fs/` prefix,
and since the linked `editor` package is outside the project, vite needs
permission to access it.

Then run `pnpm install` in to apply the changes and that's it.

You can use the same technique to test out any custom package you're working on.

## Contributing

Read through our [Contribution Guide](./CONTRIBUTING.md) to learn how you can
help make Canvas Commons better.

[authenticate]:
  https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-with-a-personal-access-token
[template]:
  https://github.com/canvas-commons/project-template#using-the-template
[discord]: https://chat.canvascommons.io
[docs]: https://canvascommons.io/docs/quickstart
