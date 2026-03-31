import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function AuthPage() {
    const [step, setStep] = useState('phone'); // phone | otp
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [devOtp, setDevOtp] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    // DEV: Skip auth entirely
    const devSkipAuth = async () => {
        setError('');
        setLoading(true);
        try {
            const testPhone = '+963999999999';
            await api.post('/auth/send-otp', { phone: testPhone });
            const { data } = await api.post('/auth/verify-otp', { phone: testPhone, code: '000000' });
            login(data.token, data.refreshToken, data.user);
            if (!data.user.role) navigate('/onboarding/role');
            else if (!data.user.onboarding_completed) navigate(`/onboarding/${data.user.role}`);
            else navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'خطأ في الاتصال بالخادم');
        } finally {
            setLoading(false);
        }
    };

    const formatPhone = (value) => {
        // Remove non-digits
        let digits = value.replace(/\D/g, '');
        // If starts with 0, convert
        if (digits.startsWith('0')) digits = digits.slice(1);
        // If starts with 963, keep
        if (digits.startsWith('963')) digits = digits.slice(3);
        return digits.slice(0, 9);
    };

    const getFullPhone = () => `+963${phone}`;

    const sendOTP = async (e) => {
        e.preventDefault();
        if (phone.length < 8) {
            setError('أدخل رقم هاتف صحيح');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const { data } = await api.post('/auth/send-otp', { phone: getFullPhone() });
            if (data.otp) setDevOtp(data.otp); // Dev mode only
            setStep('otp');
        } catch (err) {
            setError(err.response?.data?.error || 'حدث خطأ في إرسال الرمز');
        } finally {
            setLoading(false);
        }
    };

    const verifyOTP = async (e) => {
        e.preventDefault();
        if (code.length !== 6) {
            setError('أدخل رمز التحقق المكون من 6 أرقام');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const { data } = await api.post('/auth/verify-otp', {
                phone: getFullPhone(),
                code,
            });
            login(data.token, data.refreshToken, data.user);

            if (!data.user.role) {
                navigate('/onboarding/role');
            } else if (!data.user.onboarding_completed) {
                navigate(`/onboarding/${data.user.role}`);
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'رمز التحقق غير صحيح');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page" style={{ background: 'white' }}>
            <div className="container" style={{ paddingTop: '60px' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: 20,
                        background: 'var(--primary)', margin: '0 auto 16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 36, color: 'white', fontWeight: 800,
                    }}>
                        شغلي
                    </div>
                    <h1 style={{ fontSize: 28, fontWeight: 800 }}>شغلي</h1>
                    <p style={{ color: 'var(--gray-500)', marginTop: 4 }}>ابحث عن عمل قريب منك</p>
                </div>

                {/* Syria-only banner */}
                <div style={{
                    background: '#fef3c7', border: '1px solid #f59e0b',
                    borderRadius: 8, padding: '10px 14px', marginBottom: 16,
                    fontSize: 14, textAlign: 'center', color: '#92400e',
                }}>
                    🇸🇾 هذه المنصة متاحة حالياً في سوريا فقط
                </div>

                {/* DEV: Skip auth button */}
                <button
                    onClick={devSkipAuth}
                    className="btn btn-block btn-lg"
                    style={{ marginBottom: 20, background: '#f59e0b', color: 'white', border: 'none', fontWeight: 700 }}
                    disabled={loading}
                >
                    {loading ? 'جاري الدخول...' : '🧪 دخول تجريبي (بدون تحقق)'}
                </button>

                {error && <div className="alert alert-error">{error}</div>}

                {step === 'phone' ? (
                    <form onSubmit={sendOTP}>
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
                        <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 8 }}>
                            سنرسل لك رمز تحقق عبر SMS
                        </p>
                        <button
                            type="submit"
                            className="btn btn-primary btn-block btn-lg"
                            style={{ marginTop: 24 }}
                            disabled={loading || phone.length < 8}
                        >
                            {loading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={verifyOTP}>
                        <p style={{ marginBottom: 16, color: 'var(--gray-600)' }}>
                            أدخل الرمز المرسل إلى <strong style={{ direction: 'ltr', display: 'inline-block' }}>+963{phone}</strong>
                        </p>

                        {devOtp && (
                            <div className="alert alert-success" style={{ direction: 'ltr', textAlign: 'center' }}>
                                [Dev] OTP: <strong>{devOtp}</strong>
                            </div>
                        )}

                        <input
                            className="input"
                            type="tel"
                            placeholder="------"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            style={{ textAlign: 'center', letterSpacing: '8px', fontSize: 24, fontWeight: 700, direction: 'ltr' }}
                            autoFocus
                        />

                        <button
                            type="submit"
                            className="btn btn-primary btn-block btn-lg"
                            style={{ marginTop: 24 }}
                            disabled={loading || code.length !== 6}
                        >
                            {loading ? 'جاري التحقق...' : 'تحقق'}
                        </button>

                        <button
                            type="button"
                            className="btn btn-secondary btn-block"
                            style={{ marginTop: 12 }}
                            onClick={() => { setStep('phone'); setCode(''); setError(''); setDevOtp(''); }}
                        >
                            تغيير الرقم
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
