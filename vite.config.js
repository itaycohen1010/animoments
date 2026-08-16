import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        // standalone photo re-upload page (sent to a customer whose upload failed)
        reupload: resolve(__dirname, 'reupload.html')
      }
    }
  }
});
