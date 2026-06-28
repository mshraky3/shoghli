import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Lock } from 'lucide-react';

export default function AdminLoginPage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username || !password) {
            setError('يرجى إدخال اسم المستخدم وكلمة المرور');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const { data } = await api.post('/admin/login', { username, password });
            sessionStorage.setItem('adminToken', data.token);
            navigate('/admin');
        } catch (err) {
            setError(err.response?.data?.error || 'بيانات الدخول غير صحيحة');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page" style={{ background: '#0f172a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 360, padding: 24 }}>
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{ width: 60, height: 60, borderRadius: 16, background: '#1e293b', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Lock size={28} color="#60a5fa" />
                    </div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: 'white' }}>لوحة تحكم المشرف</h1>
                    <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 6 }}>دخول مخصص للمشرفين فقط</p>
                </div>

                {error && (
                    <div style={{ background: '#7f1d1d', color: '#fecaca', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14, textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="اسم المستخدم"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoFocus
                        dir="ltr"
                        style={inputStyle}
                    />
                    <input
                        type="password"
                        placeholder="كلمة المرور"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        dir="ltr"
                        style={{ ...inputStyle, marginTop: 12 }}
                    />
                    <button type="submit" disabled={loading}
                        style={{ width: '100%', marginTop: 20, padding: '12px', borderRadius: 8, border: 'none', background: '#2563eb', color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                        {loading ? 'جاري الدخول...' : 'دخول'}
                    </button>
                </form>
            </div>
        </div>
    );
}

const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 8,
    border: '1px solid #334155',
    background: '#1e293b',
    color: 'white',
    fontSize: 15,
    textAlign: 'left',
    boxSizing: 'border-box',
};
