import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import SyriaFlag from '../components/SyriaFlag';

export default function AuthPage() {
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const formatPhone = (value) => {
        let digits = value.replace(/\D/g, '');
        if (digits.startsWith('0')) digits = digits.slice(1);
        if (digits.startsWith('963')) digits = digits.slice(3);
        return digits.slice(0, 9);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (phone.length < 7) {
            setError('أدخل رقم هاتف صحيح');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const fullPhone = `+963${phone}`;
            await api.post('/auth/send-otp', { phone: fullPhone });
            const { data } = await api.post('/auth/verify-otp', { phone: fullPhone, code: '000000' });
            login(data.token, data.refreshToken, data.user);
            if (!data.user.role) navigate('/onboarding/role');
            else if (!data.user.onboarding_completed) navigate(`/onboarding/${data.user.role}`);
            else navigate('/dashboard');
        } catch (err) {
            if (!err.response) {
                setError('تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.');
            } else {
                setError(err.response?.data?.error || 'حدث خطأ، حاول مجدداً');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page" style={{ background: 'white' }}>
            <div className="container" style={{ paddingTop: '60px' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <img
                        src="/imges/logo.ico"
                        alt="شعار شغلي"
                        style={{
                            width: 80,
                            height: 80,
                            borderRadius: 20,
                            objectFit: 'cover',
                            display: 'block',
                            margin: '0 auto 16px',
                            boxShadow: '0 8px 22px rgba(37, 99, 235, 0.25)',
                        }}
                    />
                    <p style={{ color: 'var(--gray-500)', marginTop: 4 }}>ابحث عن عمل قريب منك</p>
                </div>

                {/* Syria-only banner */}
                <div style={{
                    background: '#fef3c7', border: '1px solid #f59e0b',
                    borderRadius: 8, padding: '10px 14px', marginBottom: 24,
                    fontSize: 14, textAlign: 'center', color: '#92400e',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                    <SyriaFlag size={20} />
                    هذه المنصة متاحة حالياً في سوريا فقط
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleLogin}>
                    <label className="input-label">رقم الهاتف</label>
                    <div style={{ display: 'flex', gap: 8, direction: 'ltr' }}>
                        <div style={{
                            padding: '12px 14px', background: 'var(--gray-100)',
                            borderRadius: 'var(--radius-sm)', fontWeight: 500,
                            whiteSpace: 'nowrap', border: '2px solid var(--gray-200)',
                        }}>
                            +963
                        </div>
                        <input
                            className="input"
                            type="tel"
                            placeholder="9XXXXXXXX"
                            value={phone}
                            onChange={(e) => setPhone(formatPhone(e.target.value))}
                            style={{ direction: 'ltr', textAlign: 'left' }}
                            autoFocus
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary btn-block btn-lg"
                        style={{ marginTop: 24 }}
                        disabled={loading || phone.length < 7}
                    >
                        {loading ? 'جاري الدخول...' : 'دخول'}
                    </button>
                </form>
            </div>
        </div>
    );
}
