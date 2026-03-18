import { build } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

try {
  await build({
    root: 'C:/PRODUCT/LID',
    plugins: [react()],
    build: {
      sourcemap: false,
      minify: 'esbuild',
      target: 'esnext',
      emptyOutDir: true
    },
    logLevel: 'info'
  });
  fs.writeFileSync('C:/PRODUCT/LID/build_result.txt', 'BUILD_SUCCESS\n');
} catch (e) {
  fs.writeFileSync('C:/PRODUCT/LID/build_result.txt', 'BUILD_FAILED\n' + e.stack + '\n');
}
process.exit(0);
