import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // This is a staging app; do not publish it over the existing site until
  // legacy order/admin routes and Firebase/Supabase settings are verified.
  base: '/',
  build: { outDir: 'dist', emptyOutDir: true }
});
