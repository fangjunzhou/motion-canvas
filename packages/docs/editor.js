const fs = require('fs');

module.exports = (context, options) => ({
  name: 'docusaurus-editor-plugin',
  async loadContent() {
    const baseUrl = context.siteConfig.baseUrl;
    const editorFile = await fs.promises.readFile('../editor/editor.html');
    const html = editorFile
      .toString()
      .replace('{{style}}', `${baseUrl}editor/style.css`)
      .replace('{{source}}', './project.js');

    const examples = options.examples ?? [];
    for (const {fileName, source = `examples/${fileName}.js`} of examples) {
      const dir = `./static/editor/${fileName}`;
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {recursive: true});
      }

      await fs.promises.writeFile(`${dir}/index.html`, html);
      await fs.promises.writeFile(
        `${dir}/project.js`,
        `import project from '${baseUrl}${source}';` +
          `import {editor} from '${baseUrl}editor/main.js';` +
          `editor(project);`,
      );
    }

    await fs.promises.writeFile(`./static/editor/index.html`, html);
    await fs.promises.writeFile(
      `./static/editor/project.js`,
      `import {index} from '${baseUrl}editor/main.js';` +
        `index(${JSON.stringify(examples)});`,
    );
  },
});
