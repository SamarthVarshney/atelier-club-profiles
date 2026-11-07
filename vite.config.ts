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
});
