import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - cached separately from app code
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-web3': ['wagmi', 'viem', '@rainbow-me/rainbowkit'],
          'vendor-apollo': ['@apollo/client', 'graphql'],
          'vendor-utils': ['zod', 'react-hook-form', '@hookform/resolvers'],
        },
      },
    },
    // Increase chunk size warning limit (web3 libs are large)
    chunkSizeWarningLimit: 600,
    // Enable source maps for production debugging (optional - disable for smaller builds)
    sourcemap: false,
    // Minification settings
    minify: 'esbuild',
    // Target modern browsers for smaller bundle
    target: 'es2020',
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'wagmi',
      'viem',
      '@rainbow-me/rainbowkit',
      '@apollo/client',
    ],
  },
})
