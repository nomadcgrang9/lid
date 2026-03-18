import { build } from 'vite'
import react from '@vitejs/plugin-react'

try {
  await build({
    plugins: [react()],
    build: {
      sourcemap: false,
      minify: 'esbuild',
      target: 'esnext',
      emptyOutDir: true
    }
  })
  console.log('BUILD_COMPLETE')
} catch (e) {
  console.error('BUILD_ERROR:', e.message)
  process.exit(1)
}
