/** @typedef {import('@mdjs/core').Story} Story */

const mdx = require('@mdx-js/mdx');
const mdxToJsx = require('@mdx-js/mdx/mdx-hast-to-jsx');

/**
 * @param {string} markdown
 * @param {string} filepath
 * @returns {Promise<string>}
 */
function compileMdToJsx(markdown, filepath) {
  return mdx(
    `import { Story, Preview, Props } from 'storybook-prebuilt/addon-docs/blocks.js';\n\n${markdown}`,
    {
      compilers: [
        // custom mdx compiler which ensures mdx doesn't add a default export,
        // we don't need it because we are adding our own
        function mdxCompiler() {
          // @ts-ignore
          this.Compiler = tree => mdxToJsx.toJSX(tree, {}, { skipExport: true });
        },
      ],
      filepath,
    },
  );
}

/**
 * @param {Story[]} [stories]
 */
function createDocsPage(stories) {
  /** @type {Record<string, string>} */
  const storyNameToKey = {};

  if (stories) {
    for (const { key, name } of stories) {
      storyNameToKey[name || key] = key;
    }
  }

  return `import * as React from 'storybook-prebuilt/react.js';
import { mdx, AddContext } from 'storybook-prebuilt/addon-docs/blocks.js';

// Setup docs page
const mdxStoryNameToKey = ${JSON.stringify(storyNameToKey)};
__export_default__.parameters = __export_default__.parameters || {};
__export_default__.parameters.docs = __export_default__.parameters.docs || {};
__export_default__.parameters.docs.page = () => <AddContext
  mdxStoryNameToKey={mdxStoryNameToKey}
  mdxComponentMeta={__export_default__}><MDXContent
/></AddContext>;
${
  !stories || stories.length === 0
    ? `
export const __page = () => {
  throw new Error("Docs-only story");
};
__page.story = {
  parameters: {
    docsOnly: true
  }
};
`
    : ''
}

export default __export_default__;`;
}

/**
 * Turns MD into JSX using the MDX compiler. This is necessary because most of the
 * regular storybook docs functionality relies on JSX and MDX specifics
 *
 * @param {string} markdown
 * @param {string} filepath
 * @param {Story[]} [stories]
 * @returns {Promise<string>}
 */
async function mdToJsx(markdown, filepath, stories) {
  return `/**
 *
 * The code below is generated by storybook docs.
 *
 */

${createDocsPage(stories)}

// The docs page, markdown turned into using jsx for storybook
${await compileMdToJsx(markdown, filepath)}`;
}

module.exports = {
  mdToJsx,
  // export for testing
  createDocsPage,
  compileMdToJsx,
};
