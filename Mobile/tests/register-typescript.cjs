/* global __dirname */
// Node's built-in test runner, with the TypeScript dependency already used by Expo.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const sourceRoots = [
  '../src/core',
  '../src/features/auth/domain',
  '../src/features/auth/data',
].map((directory) => fs.realpathSync(path.resolve(__dirname, directory)) + path.sep);
require.extensions['.ts'] = (module, filename) => {
  const sourceFile = fs.realpathSync(filename);
  if (!sourceRoots.some((directory) => sourceFile.startsWith(directory))) {
    throw new Error('The test loader only compiles allowed core, auth domain and auth data TypeScript files.');
  }
  const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023 },
  });
  module._compile(result.outputText, filename);
};
