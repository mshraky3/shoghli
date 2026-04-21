import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://shoghli-backend.vercel.app/
//http://localhost:3000/

const BACKEND_URL = 'https://shoghli-backend.vercel.app/';

// Auth mode: 'otp' = Firebase OTP verification, 'direct' = login by phone number only (no OTP)
const AUTH_MODE = 'direct';

export default defineConfig({
    define: {
        __BACKEND_URL__: JSON.stringify(BACKEND_URL),
        __AUTH_MODE__: JSON.stringify(AUTH_MODE),
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
