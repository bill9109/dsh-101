import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
const checkout = process.env.DSH_CHECKOUT
if (checkout === undefined) throw new Error('DSH_CHECKOUT is required; run `pnpm run build`')
const { clientBundle } = await import(`${checkout}/packages/client/tsdown.client.ts`)
const host = {
  name: '@dsh-external/dsh-101',
  entry: {
    index: 'types/app/index.js',
    'app-invariant': 'types/app/invariant.js',
    core: 'types/core/index.js',
    'core-invariant': 'types/core/invariant.js',
    tutor: 'types/tutor/index.js',
    'tutor-invariant': 'types/tutor/invariant.js',
    invariant: 'types/invariant.js',
  },
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  fixedExtension: false,
  dts: false,
  clean: true,
}
const clientFace = clientBundle('@dsh-external/dsh-101', ['types/app/index.js'])
const resolved = clientFace({ env: {} })
const client = resolved[resolved.length - 1]
export default [host, client]
