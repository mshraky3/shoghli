import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const BACKEND_URL = 'http://localhost:5000/';

export default defineConfig({
    define: {
        __BACKEND_URL__: JSON.stringify(BACKEND_URL),
    },
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: BACKEND_URL + '/',
                changeOrigin: true,
            },
        },
    },
});
