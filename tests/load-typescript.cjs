/* eslint-disable @typescript-eslint/no-require-imports */
// Executes only source helpers, without Next transforms, providers or network access.
// This is not a substitute for the production build or browser verification.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const sourceRoot = path.resolve(__dirname, '../src');

function loadTypeScript(entry, { mocks = {}, env = {}, fetch, globals = {} } = {}) {
  const cache = new Map();
  const context = vm.createContext({
    FormData, URL, URLSearchParams, AbortSignal, console,
    process: { env: { ...env } },
    fetch: fetch ?? (() => { throw new Error('Network is disabled in contract tests'); }),
    ...globals,
  });

  function load(filename) {
    if (cache.has(filename)) return cache.get(filename).exports;
    const loadedModule = { exports: {} };
    cache.set(filename, loadedModule);
    const localRequire = (specifier) => {
      if (Object.hasOwn(mocks, specifier)) return mocks[specifier];
      if (specifier === 'server-only') return {};
      if (specifier === 'zod' || specifier === 'node:crypto' || specifier === 'node:buffer') return require(specifier);
      const resolved = specifier.startsWith('@/')
        ? path.resolve(sourceRoot, specifier.slice(2))
        : specifier.startsWith('.') ? path.resolve(path.dirname(filename), specifier) : null;
      if (!resolved || !resolved.startsWith(`${sourceRoot}${path.sep}`)) {
        throw new Error(`Unmocked test dependency: ${specifier}`);
      }
      return load(resolved.endsWith('.ts') ? resolved : `${resolved}.ts`);
    };
    const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      fileName: filename,
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    });
    const execute = new vm.Script(`(function(require, module, exports) {\n${outputText}\n})`, { filename }).runInContext(context);
    execute(localRequire, loadedModule, loadedModule.exports);
    return loadedModule.exports;
  }

  return load(path.resolve(sourceRoot, entry));
}

module.exports = { loadTypeScript };
