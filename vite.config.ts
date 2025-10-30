import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
    historyApiFallback: true,
  },
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
}); 