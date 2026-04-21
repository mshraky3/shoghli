import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const DEV_BACKEND_URL = 'http://localhost:3000';
const PROD_BACKEND_URL = 'https://shoghli-backend.vercel.app';

// Auth mode: 'otp' = Firebase OTP verification, 'direct' = login by phone number only (no OTP)
const AUTH_MODE = 'direct';

export default defineConfig({
    define: {
        __BACKEND_URL__: JSON.stringify(PROD_BACKEND_URL),
        __AUTH_MODE__: JSON.stringify(AUTH_MODE),
    },
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: DEV_BACKEND_URL,
                changeOrigin: true,
            },
        },
    },
});
