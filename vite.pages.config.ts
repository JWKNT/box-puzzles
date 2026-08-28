import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/box-puzzles/',
  plugins: [react()],
  build: { outDir: 'pages-dist', emptyOutDir: true },
});
