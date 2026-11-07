import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createClubApiMiddleware } from './server/api.mjs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'atelier-club-api',
      configureServer(server) {
        server.middlewares.use(createClubApiMiddleware());
      },
      configurePreviewServer(server) {
        server.middlewares.use(createClubApiMiddleware());
      },
    },
  ],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
  },
  preview: {
    host: true,
    port: 5173,
    allowedHosts: true,
  },
});
