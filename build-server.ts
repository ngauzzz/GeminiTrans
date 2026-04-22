import { build } from 'esbuild';

build({
  entryPoints: ['server.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: 'server.js',
  format: 'esm',
  external: ['express', 'multer', 'vite', '@google/genai'],
}).catch(() => process.exit(1));
