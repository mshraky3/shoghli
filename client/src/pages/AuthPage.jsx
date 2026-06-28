import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { employerHome } from '../App';
import api from '../services/api';

const COUNTRY_CODES = [
    { code: '+963', label: '🇸🇾 +963', country: 'سوريا' },
    { code: '+90', label: '🇹🇷 +90', country: 'تركيا' },
    { code: '+961', label: '🇱🇧 +961', country: 'لبنان' },
    { code: '+962', label: '🇯🇴 +962', country: 'الأردن' },
    { code: '+964', label: '🇮🇶 +964', country: 'العراق' },
    { code: '+49', label: '🇩🇪 +49', country: 'ألمانيا' },
    { code: '+20', label: '🇪🇬 +20', country: 'مصر' },
    { code: '+966', label: '🇸🇦 +966', country: 'السعودية' },
    { code: '+971', label: '🇦🇪 +971', country: 'الإمارات' },
];

export default function AuthPage() {
    const [tab, setTab] = useState('login');   // 'login' | 'register'
    const [step, setStep] = useState('form');  // 'form' | 'otp'

    // register fields
    const [regName, setRegName] = useState('');
    const [regCompany, setRegCompany] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPhone, setRegPhone] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regCountry, setRegCountry] = useState('+963');
    const [showRegCountry, setShowRegCountry] = useState(false);

    // login fields
    const [loginId, setLoginId] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // OTP
    const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
    const otpRefs = useRef([]);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const regCountryRef = useRef(null);

    const formatPhone = (v) => v.replace(/\D/g, '').replace(/^0/, '').slice(0, 15);

    const selectedRegCountry = COUNTRY_CODES.find(c => c.code === regCountry) || COUNTRY_CODES[0];

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        if (!regEmail || !regPhone || !regPassword) {
            setError('يرجى ملء جميع الحقول المطلوبة');
            return;
        }
        if (regPassword.length < 8) {
            setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
            return;
        }
        setLoading(true);
        try {
            await api.post('/auth/send-otp', { email: regEmail });
            setOtpDigits(['', '', '', '']);
            setStep('otp');
        } catch (err) {
            setError(err.response?.data?.error || 'حدث خطأ. حاول مجدداً.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        if (!loginId || !loginPassword) {
            setError('يرجى ملء جميع الحقول');
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', {
                identifier: loginId,
                password: loginPassword,
            });
            login(data.token, data.refreshToken, data.user);
            navigate(employerHome(data.user));
        } catch (err) {
            setError(err.response?.data?.error || 'حدث خطأ. حاول مجدداً.');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const newDigits = [...otpDigits];
        newDigits[index] = value.slice(-1);
        setOtpDigits(newDigits);
        if (value && index < 3) otpRefs.current[index + 1]?.focus();
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleConfirmOtp = async () => {
        const otp = otpDigits.join('');
        if (otp.length < 4) return;
        setError('');
        setLoading(true);
        try {
            const fullPhone = regCountry + regPhone;
            const { data } = await api.post('/auth/register', {
                email: regEmail,
                phone: fullPhone,
                password: regPassword,
                name: regName || undefined,
                company_name: regCompany || undefined,
                otp,
            });
            login(data.token, data.refreshToken, data.user);
            navigate(employerHome(data.user));
        } catch (err) {
            setError(err.response?.data?.error || 'رمز التحقق غير صحيح');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setError('');
        setLoading(true);
        try {
            await api.post('/auth/send-otp', { email: regEmail });
            setOtpDigits(['', '', '', '']);
            otpRefs.current[0]?.focus();
        } catch (err) {
            setError(err.response?.data?.error || 'حدث خطأ. حاول مجدداً.');
        } finally {
            setLoading(false);
        }
    };

    const switchTab = (t) => {
        setTab(t);
        setStep('form');
        setError('');
        setOtpDigits(['', '', '', '']);
    };

    return (
        <div className='page' style={{ background: 'white' }}>
            <div className='container' style={{ paddingTop: '50px', maxWidth: 420 }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                    <a href='/' style={{ textDecoration: 'none', display: 'inline-block' }}>
                        <div style={{
                            display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                            padding: '18px 32px', borderRadius: 24,
                            background: 'linear-gradient(145deg, #eff6ff, #dbeafe)',
                            border: '1.5px solid #bfdbfe',
                            boxShadow: '0 8px 32px rgba(37,99,235,0.13)',
                            transition: 'transform 0.18s, box-shadow 0.18s',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(37,99,235,0.2)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(37,99,235,0.13)'; }}
                        >
                            <img
                                src='/imges/logo.ico'
                                alt='شعار شغلي'
                                style={{ width: 64, height: 64, borderRadius: 16, objectFit: 'cover', boxShadow: '0 4px 14px rgba(37,99,235,0.25)' }}
                            />
                            <span style={{ fontSize: 26, fontWeight: 800, color: '#1d4ed8', letterSpacing: 1, fontFamily: 'Tajawal, sans-serif' }}>شغلي</span>
                        </div>
                    </a>
                    <p style={{ color: 'var(--gray-400)', marginTop: 14, fontSize: 13 }}>منصة أصحاب العمل — وظّف عمالة ماهرة قريبة منك</p>
                </div>

                {error && <div className='alert alert-error' style={{ marginBottom: 16 }}>{error}</div>}

                {step === 'otp' ? (
                    <div>
                        <div style={{ textAlign: 'center', marginBottom: 28 }}>
                            <div style={{ fontSize: 52, marginBottom: 12 }}>📧</div>
                            <h3 style={{ color: 'var(--gray-800)', margin: '0 0 8px', fontSize: 20 }}>تحقق من بريدك الإلكتروني</h3>
                            <p style={{ color: 'var(--gray-500)', fontSize: 14, margin: 0 }}>
                                أرسلنا رمز التحقق إلى<br />
                                <strong style={{ color: 'var(--primary)' }}>{regEmail}</strong>
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', margin: '0 0 28px', direction: 'ltr' }}>
                            {[0, 1, 2, 3].map(i => (
                                <input
                                    key={i}
                                    ref={el => otpRefs.current[i] = el}
                                    type='text'
                                    inputMode='numeric'
                                    maxLength={1}
                                    value={otpDigits[i]}
                                    onChange={e => handleOtpChange(i, e.target.value)}
                                    onKeyDown={e => handleOtpKeyDown(i, e)}
                                    autoFocus={i === 0}
                                    style={{
                                        width: 60, height: 68, fontSize: 30, fontWeight: 700,
                                        textAlign: 'center', border: '2px solid var(--gray-200)',
                                        borderRadius: 12, outline: 'none', color: 'var(--gray-800)',
                                        background: 'white', transition: 'border-color 0.2s',
                                    }}
                                    onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                                    onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
                                />
                            ))}
                        </div>
                        <button onClick={handleConfirmOtp} className='btn btn-primary btn-block btn-lg'
                            disabled={loading || otpDigits.join('').length < 4}>
                            {loading ? 'جاري التحقق...' : 'تحقق وإنشاء الحساب'}
                        </button>
                        <div style={{ textAlign: 'center', marginTop: 16 }}>
                            <button type='button' onClick={handleResendOtp} disabled={loading}
                                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 14, fontFamily: 'Tajawal, sans-serif' }}>
                                لم يصلك الرمز؟ أعد الإرسال
                            </button>
                        </div>
                        <button type='button' onClick={() => { setStep('form'); setOtpDigits(['', '', '', '']); setError(''); }}
                            style={{ background: 'none', border: 'none', color: 'var(--gray-500)', fontSize: 13, cursor: 'pointer', display: 'block', margin: '12px auto 0', fontFamily: 'Tajawal, sans-serif' }}>
                            رجوع
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Tab switcher */}
                        <div style={{ display: 'flex', background: 'var(--gray-100)', borderRadius: 10, padding: 4, marginBottom: 28 }}>
                            {[{ key: 'login', label: 'تسجيل الدخول' }, { key: 'register', label: 'حساب جديد' }].map(t => (
                                <button key={t.key} type='button' onClick={() => switchTab(t.key)}
                                    style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontSize: 15, fontWeight: tab === t.key ? 700 : 400, background: tab === t.key ? 'white' : 'transparent', color: tab === t.key ? 'var(--primary)' : 'var(--gray-500)', boxShadow: tab === t.key ? '0 1px 6px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {tab === 'login' ? (
                            <form onSubmit={handleLogin}>
                                <label className='input-label'>البريد الإلكتروني أو رقم الهاتف</label>
                                <input
                                    className='input'
                                    type='text'
                                    placeholder='example@email.com أو +963...'
                                    value={loginId}
                                    onChange={e => setLoginId(e.target.value)}
                                    autoFocus
                                    dir='ltr'
                                    style={{ textAlign: 'left' }}
                                />
                                <label className='input-label' style={{ marginTop: 16 }}>كلمة المرور</label>
                                <input
                                    className='input'
                                    type='password'
                                    placeholder='••••••••'
                                    value={loginPassword}
                                    onChange={e => setLoginPassword(e.target.value)}
                                    dir='ltr'
                                    style={{ textAlign: 'left' }}
                                />
                                <button type='submit' className='btn btn-primary btn-block btn-lg' style={{ marginTop: 24 }} disabled={loading}>
                                    {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleRegister}>
                                <label className='input-label'>الاسم (اختياري)</label>
                                <input
                                    className='input'
                                    type='text'
                                    placeholder='اسمك الكامل'
                                    value={regName}
                                    onChange={e => setRegName(e.target.value)}
                                />
                                <label className='input-label' style={{ marginTop: 14 }}>اسم الشركة / المؤسسة (اختياري)</label>
                                <input
                                    className='input'
                                    type='text'
                                    placeholder='اسم شركتك أو نشاطك'
                                    value={regCompany}
                                    onChange={e => setRegCompany(e.target.value)}
                                />
                                <label className='input-label' style={{ marginTop: 14 }}>البريد الإلكتروني</label>
                                <input
                                    className='input'
                                    type='email'
                                    placeholder='example@email.com'
                                    value={regEmail}
                                    onChange={e => setRegEmail(e.target.value)}
                                    dir='ltr'
                                    style={{ textAlign: 'left' }}
                                    required
                                />
                                <label className='input-label' style={{ marginTop: 14 }}>رقم الهاتف</label>
                                <div style={{ display: 'flex', gap: 8, direction: 'ltr', position: 'relative' }} ref={regCountryRef}>
                                    <div style={{ position: 'relative', minWidth: 110 }}>
                                        <button type='button' onClick={() => setShowRegCountry(v => !v)}
                                            style={{ width: '100%', padding: '12px 8px', background: 'var(--gray-100)', borderRadius: 'var(--radius-sm)', fontWeight: 500, border: '2px solid var(--gray-200)', fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>
                                            {selectedRegCountry.label}
                                        </button>
                                        {showRegCountry && (
                                            <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, maxHeight: 200, overflowY: 'auto', background: 'white', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-lg)', zIndex: 30 }}>
                                                {COUNTRY_CODES.map(c => (
                                                    <button key={c.code} type='button'
                                                        onClick={() => { setRegCountry(c.code); setShowRegCountry(false); }}
                                                        style={{ width: '100%', textAlign: 'left', padding: '9px 10px', border: 'none', borderBottom: '1px solid var(--gray-100)', background: c.code === regCountry ? 'var(--primary-light)' : 'white', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontSize: 13 }}>
                                                        {c.label} ({c.country})
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        className='input'
                                        type='tel'
                                        placeholder='9XXXXXXXX'
                                        value={regPhone}
                                        onChange={e => setRegPhone(formatPhone(e.target.value))}
                                        style={{ direction: 'ltr', textAlign: 'left' }}
                                        onFocus={() => setShowRegCountry(false)}
                                        required
                                    />
                                </div>
                                <label className='input-label' style={{ marginTop: 14 }}>كلمة المرور</label>
                                <input
                                    className='input'
                                    type='password'
                                    placeholder='8 أحرف أو أرقام على الأقل'
                                    value={regPassword}
                                    onChange={e => setRegPassword(e.target.value)}
                                    dir='ltr'
                                    style={{ textAlign: 'left' }}
                                    required
                                    minLength={8}
                                />
                                <button type='submit' className='btn btn-primary btn-block btn-lg' style={{ marginTop: 24 }} disabled={loading}>
                                    {loading ? 'جاري التسجيل...' : 'إنشاء حساب'}
                                </button>
                            </form>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
