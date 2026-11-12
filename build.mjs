import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire('D:/soft/deepseek-harness-plugins/dsh-literature/package.json')
const { build } = require('esbuild')

const root = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(root, 'lib')
mkdirSync(outDir, { recursive: true })

const PLUGIN_ID = 'dsh-split-view'

const HOST_PROVIDED = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
]

await build({
  entryPoints: [resolve(root, 'src/node/index.js')],
  outfile: resolve(outDir, 'index.js'),
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  sourcemap: false,
  logLevel: 'info',
  external: ['@deepseek-ai/*'],
})

const banner = `window.__ModuleLoader__.load({
  id: ${JSON.stringify(PLUGIN_ID)},
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
`
const footer = `
    return module.exports;
  }
});
`

await build({
  entryPoints: [resolve(root, 'src/client/index.cjs')],
  outfile: resolve(outDir, 'client.js'),
  bundle: true,
  platform: 'browser',
  target: 'es2020',
  format: 'cjs',
  minify: false,
  sourcemap: false,
  logLevel: 'info',
  external: HOST_PROVIDED,
  banner: { js: banner },
  footer: { js: footer },
})

console.log('[dsh-split-view] built lib/index.js and lib/client.js')
