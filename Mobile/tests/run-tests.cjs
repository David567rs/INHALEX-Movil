/* global __dirname */
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const result = spawnSync(process.execPath, [
  '--test',
  '--require', path.join(__dirname, 'register-typescript.cjs'),
  path.join(__dirname, 'resolveApiUrl.test.cjs'),
  path.join(__dirname, 'HttpClient.test.cjs'),
  path.join(__dirname, 'RegistrationValidation.test.cjs'),
  path.join(__dirname, 'LoginValidation.test.cjs'),
  path.join(__dirname, 'LoginRepository.test.cjs'),
  path.join(__dirname, 'LoginUseCase.test.cjs'),
  path.join(__dirname, 'AuthSession.test.cjs'),
  path.join(__dirname, 'SessionRestoration.test.cjs'),
  path.join(__dirname, 'SessionRepository.test.cjs'),
  path.join(__dirname, 'SessionVerification.test.cjs'),
  path.join(__dirname, 'SecureSessionTokenStore.test.cjs'),
  path.join(__dirname, 'RegistrationRepository.test.cjs'),
  path.join(__dirname, 'RegistrationUseCase.test.cjs'),
  path.join(__dirname, 'CatalogRepository.test.cjs'),
  path.join(__dirname, 'CatalogUseCase.test.cjs'),
  path.join(__dirname, 'CatalogController.test.cjs'),
  path.join(__dirname, 'ProductLinesRepository.test.cjs'),
  path.join(__dirname, 'ProductLinesController.test.cjs'),
  path.join(__dirname, 'ProductDetailRepository.test.cjs'),
  path.join(__dirname, 'ProductDetailUseCase.test.cjs'),
  path.join(__dirname, 'ProductDetailController.test.cjs'),
  path.join(__dirname, 'ProductSearchRepository.test.cjs'),
  path.join(__dirname, 'ProductSearchUseCase.test.cjs'),
  path.join(__dirname, 'ProductSearchController.test.cjs'),
], { stdio: 'inherit' });

if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
