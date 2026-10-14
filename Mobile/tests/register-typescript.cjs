/* global __dirname */
// Node's built-in test runner, with the TypeScript dependency already used by Expo.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const sourceRoot = path.resolve(__dirname, '../src/core') + path.sep;
require.extensions['.ts'] = (module, filename) => {
  if (!path.resolve(filename).startsWith(sourceRoot)) {
    throw new Error('The test loader only compiles this project\'s core TypeScript files.');
  }
  const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023 },
  });
  module._compile(result.outputText, filename);
};
