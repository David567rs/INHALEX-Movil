/* global __dirname */
// Node's built-in test runner, with the TypeScript dependency already used by Expo.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const sourceRoots = [
  '../src/features/accountDeletion/domain',
  '../src/features/accountDeletion/data',
  '../src/features/accountDeletion/presentation/state',
  '../src/core',
  '../src/shared/data',
  '../src/features/more/domain',
  '../src/features/more/data',
  '../src/features/auth/domain',
  '../src/features/auth/data',
  '../src/features/catalog/domain',
  '../src/features/catalog/data',
  '../src/features/catalog/presentation/state',
  '../src/features/home/presentation/state',
  '../src/features/productLines/domain',
  '../src/features/productLines/data',
  '../src/features/productLines/presentation/state',
  '../src/features/productDetail/domain',
  '../src/features/productDetail/data',
  '../src/features/productDetail/presentation/state',
  '../src/features/productSearch/domain',
  '../src/features/productSearch/data',
  '../src/features/productSearch/presentation/state',
  '../src/features/favorites/domain',
  '../src/features/favorites/data',
  '../src/features/favorites/presentation/state',
  '../src/features/cart/domain',
  '../src/features/cart/data',
  '../src/features/cart/presentation/state',
  '../src/features/profile/domain',
  '../src/features/profile/data',
  '../src/features/profile/presentation/state',
  '../src/features/shippingAddresses/domain',
  '../src/features/shippingAddresses/data',
  '../src/features/shippingAddresses/presentation/state',
  '../src/features/orderCreation/domain',
  '../src/features/orderCreation/data',
  '../src/features/orderCreation/presentation/state',
  '../src/features/orderHistory/domain',
  '../src/features/orderHistory/data',
  '../src/features/orderHistory/presentation/state',
  '../src/features/orderTracking/domain',
  '../src/features/orderTracking/data',
  '../src/features/orderTracking/presentation/state',
  '../src/features/notices/domain',
  '../src/features/notices/data',
  '../src/features/notices/presentation/state',
  '../src/features/orderReceipt/domain',
  '../src/features/orderReceipt/data',
  '../src/features/orderReceipt/presentation/state',
  '../src/features/reviews/domain',
  '../src/features/reviews/data',
  '../src/features/reviews/presentation/state',
].map((directory) => fs.realpathSync(path.resolve(__dirname, directory)) + path.sep);
require.extensions['.ts'] = (module, filename) => {
  const sourceFile = fs.realpathSync(filename);
  if (!sourceRoots.some((directory) => sourceFile.startsWith(directory))) {
    throw new Error('The test loader only compiles allowed application TypeScript files.');
  }
  const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023 },
  });
  module._compile(result.outputText, filename);
};
