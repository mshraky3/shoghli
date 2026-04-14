import axios from 'axios';

/* global __BACKEND_URL__ */
const API_BASE_URL = import.meta.env.DEV ? '/api' : `${__BACKEND_URL__}/api`;

console.log('[api] mode:', import.meta.env.MODE);
console.log('[api] baseURL:', API_BASE_URL);

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
    console.log('[api:req]', {
        method: config.method,
        url: `${config.baseURL || ''}${config.url || ''}`,
        data: config.data,
    });
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 — try refresh token
api.interceptors.response.use(
    (res) => {
        console.log('[api:res]', {
            url: `${res.config?.baseURL || ''}${res.config?.url || ''}`,
            status: res.status,
            data: res.data,
        });
        return res;
    },
    async (error) => {
        console.error('[api:error]', {
            message: error.message,
            code: error.code,
            status: error.response?.status,
            response: error.response?.data,
            requestUrl: `${error.config?.baseURL || ''}${error.config?.url || ''}`,
            origin: window.location.origin,
        });
        const original = error.config;
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
                    localStorage.setItem('token', data.token);
                    original.headers.Authorization = `Bearer ${data.token}`;
                    return api(original);
                } catch {
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/auth';
                }
            }
        }
        return Promise.reject(error);
    }
);

export { API_BASE_URL };
export default api;
