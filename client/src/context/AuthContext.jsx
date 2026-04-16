import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        if (token) {
            api.get('/auth/me')
                .then(({ data }) => setUser(data.user))
                .catch(() => {
                    sessionStorage.removeItem('token');
                    sessionStorage.removeItem('refreshToken');
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = (token, refreshToken, userData) => {
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('refreshToken', refreshToken);
        setUser(userData);
    };

    const logout = () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('refreshToken');
        setUser(null);
    };

    const updateUser = (updates) => {
        setUser(prev => ({ ...prev, ...updates }));
    };

    const refreshUser = async () => {
        try {
            const { data } = await api.get('/auth/me');
            setUser(data.user);
        } catch (err) {
            console.error('Failed to refresh user:', err);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, updateUser, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
