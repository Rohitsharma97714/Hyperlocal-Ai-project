// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Export the Vite configuration
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': (process.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace('/api', '')
    }
  }
});
