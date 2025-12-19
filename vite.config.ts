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
    // Optimisations de build
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Supprimer console.log en production
        drop_debugger: true,
      },
    },
    // Fallback si terser n'est pas disponible
    commonjsOptions: {
      include: [/node_modules/],
    },
    // Code splitting optimisé
    rollupOptions: {
      output: {
        manualChunks: {
          // Séparer les vendors
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Séparer les pages lourdes
          'cms-pages': [
            './src/CMSManagementPage',
            './src/ManagePage',
            './src/UserManagementPage',
            './src/PartnerManagementPage',
          ],
          'admin-pages': [
            './src/pages/GestionComptabilitePage',
            './src/pages/AdminLoginPage',
          ],
        },
        // Optimisation des noms de chunks
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Augmenter la limite de chunk size warning
    chunkSizeWarningLimit: 1000,
    // Source maps pour le debug (désactivé en production pour la performance)
    sourcemap: process.env.NODE_ENV === 'development',
  },
  // Optimisations de développement
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
}); 