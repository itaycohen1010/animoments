// Separate build for the ADMIN app only — kept OUT of the customer site.
// Build with:  npm run build:admin   → outputs to dist-admin/
// Deploy dist-admin/ to a PRIVATE location (separate Vercel project or a
// subdomain like admin.animoment.co.il), NOT to the customer site.
// For day-to-day use you can also just run `npm run dev` and open /admin.html locally.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist-admin',
    rollupOptions: {
      input: { admin: resolve(__dirname, 'admin.html') }
    }
  }
});
