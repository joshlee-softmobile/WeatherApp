import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load env variables based on current mode (e.g. development, production)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: 3000,
      strictPort: true,
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8787',
          changeOrigin: true,
        }
      }
    },
    build: {
      sourcemap: true,
    }
  };
});

