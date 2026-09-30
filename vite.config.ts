import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const packageJson = JSON.parse(readFileSync(resolve(import.meta.dirname, 'package.json'), 'utf-8')) as { version: string };

export default defineConfig(() => {
  return {
    base: './',
    define: {
      __APP_VERSION__: JSON.stringify(packageJson.version),
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg'],
        devOptions: { enabled: false },
        manifest: {
          name: 'Resume Craft - Markdown Resume Builder',
          short_name: 'Resume Craft',
          description: 'A local-first Markdown resume builder with live A4 preview, ATS checks, and PDF export.',
          theme_color: '#4F46E5',
          background_color: '#070a13',
          display: 'standalone',
          start_url: './',
          scope: './',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: { globPatterns: ['**/*.{js,mjs,css,html,ico,png,svg,woff,woff2}'] },
      }),
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('html2canvas') || id.includes('jspdf') || id.includes('html2pdf')) return 'pdf-vendor';
              if (id.includes('react-markdown') || id.includes('remark-gfm') || id.includes('unified') || id.includes('mdast')) return 'markdown-vendor';
              if (id.includes('lucide-react')) return 'icons-vendor';
              if (id.includes('motion') || id.includes('framer-motion')) return 'motion-vendor';
              if (id.includes('react') || id.includes('react-dom')) return 'react-core';
              return 'vendor';
            }
          },
        },
      },
    },
    resolve: { alias: { '@': resolve(import.meta.dirname, '.') } },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
