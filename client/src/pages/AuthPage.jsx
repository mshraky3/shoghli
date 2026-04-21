import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../services/firebase';

const USE_OTP = typeof __AUTH_MODE__ !== 'undefined' ? __AUTH_MODE__ === 'otp' : true;

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
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+963');
    const [showCountryMenu, setShowCountryMenu] = useState(false);
    const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'admin-password'
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [adminPassword, setAdminPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const { login } = useAuth();
    const navigate = useNavigate();
    const otpRefs = useRef([]);
    const countryMenuRef = useRef(null);
    const confirmationResultRef = useRef(null);
    const recaptchaVerifierRef = useRef(null);
    const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[0];

    useEffect(() => {
        if (resendTimer > 0) {
            const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [resendTimer]);

    useEffect(() => {
        const onPointerDown = (event) => {
            if (countryMenuRef.current && !countryMenuRef.current.contains(event.target)) {
                setShowCountryMenu(false);
            }
        };

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('touchstart', onPointerDown);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('touchstart', onPointerDown);
        };
    }, []);

    const setupRecaptcha = () => {
        if (recaptchaVerifierRef.current) {
            recaptchaVerifierRef.current.clear();
            recaptchaVerifierRef.current = null;
        }
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible',
            callback: () => { },
        });
    };

    const formatPhone = (value) => {
        let digits = value.replace(/\D/g, '');
        if (digits.startsWith('0')) digits = digits.slice(1);
        return digits.slice(0, 15);
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (phone === '1810') {
            setError('');
            setStep('admin-password');
            return;
        }

        if (phone.length < 7) {
            setError('أدخل رقم هاتف صحيح');
            return;
        }

        setError('');
        setLoading(true);

        // Direct login mode — skip OTP
        if (!USE_OTP) {
            try {
                const fullPhone = `${countryCode}${phone}`;
                const { data } = await api.post('/auth/phone-login', { phone: fullPhone });
                login(data.token, data.refreshToken, data.user);
                if (!data.user.role) navigate('/onboarding/role');
                else if (!data.user.onboarding_completed) navigate(`/onboarding/${data.user.role}`);
                else navigate('/dashboard');
            } catch (err) {
                console.error('Direct login error:', err);
                setError(err.response?.data?.error || 'حدث خطأ. حاول مجدداً.');
            } finally {
                setLoading(false);
            }
            return;
        }

        // OTP mode — Firebase
        try {
            setupRecaptcha();
            const fullPhone = `${countryCode}${phone}`;
            const result = await signInWithPhoneNumber(auth, fullPhone, recaptchaVerifierRef.current);
            confirmationResultRef.current = result;
            setStep('otp');
            setResendTimer(60);
            setOtp(['', '', '', '', '', '']);
            setTimeout(() => otpRefs.current[0]?.focus(), 100);
        } catch (err) {
            console.error('Firebase send OTP error:', err);
            recaptchaVerifierRef.current = null;
            if (err.code === 'auth/too-many-requests') {
                setError('تم تجاوز الحد الأقصى لمحاولات الإرسال. حاول مرة أخرى لاحقاً.');
            } else if (err.code === 'auth/invalid-phone-number') {
                setError('رقم الهاتف غير صحيح');
            } else {
                setError('حدث خطأ أثناء إرسال رمز التحقق. حاول مجدداً.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            setOtp(pasted.split(''));
            otpRefs.current[5]?.focus();
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length !== 6) {
            setError('أدخل رمز التحقق المكون من 6 أرقام');
            return;
        }
        if (!confirmationResultRef.current) {
            setError('حدث خطأ. أعد إرسال الرمز.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const userCredential = await confirmationResultRef.current.confirm(code);
            const idToken = await userCredential.user.getIdToken();
            const { data } = await api.post('/auth/firebase-verify', { idToken });
            login(data.token, data.refreshToken, data.user);
            if (!data.user.role) navigate('/onboarding/role');
            else if (!data.user.onboarding_completed) navigate(`/onboarding/${data.user.role}`);
            else navigate('/dashboard');
        } catch (err) {
            console.error('Firebase verify OTP error:', err);
            if (err.code === 'auth/invalid-verification-code') {
                setError('رمز التحقق غير صحيح');
            } else if (err.code === 'auth/code-expired') {
                setError('انتهت صلاحية رمز التحقق. أعد الإرسال.');
            } else if (!err.response) {
                setError('تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.');
            } else {
                setError(err.response?.data?.error || 'رمز التحقق غير صحيح');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendTimer > 0) return;
        setError('');
        setLoading(true);
        try {
            recaptchaVerifierRef.current = null;
            setupRecaptcha();
            const fullPhone = `${countryCode}${phone}`;
            const result = await signInWithPhoneNumber(auth, fullPhone, recaptchaVerifierRef.current);
            confirmationResultRef.current = result;
            setResendTimer(60);
            setOtp(['', '', '', '', '', '']);
        } catch (err) {
            console.error('Firebase resend error:', err);
            recaptchaVerifierRef.current = null;
            setError('فشل إعادة الإرسال. حاول مجدداً.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page" style={{ background: 'white' }}>
            {USE_OTP && <div id="recaptcha-container"></div>}
            <div className="container" style={{ paddingTop: '60px' }}>
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

                {error && <div className="alert alert-error">{error}</div>}

                {step === 'phone' ? (
                    <form onSubmit={handleSendOtp}>
                        <label className="input-label">رقم الهاتف</label>
                        <div style={{ display: 'flex', gap: 8, direction: 'ltr', position: 'relative' }}>
                            <div ref={countryMenuRef} style={{ position: 'relative', minWidth: 150 }}>
                                <button
                                    type="button"
                                    onClick={() => setShowCountryMenu((v) => !v)}
                                    aria-expanded={showCountryMenu}
                                    style={{
                                        width: '100%',
                                        padding: '12px 10px',
                                        background: 'var(--gray-100)',
                                        borderRadius: 'var(--radius-sm)',
                                        fontWeight: 500,
                                        border: '2px solid var(--gray-200)',
                                        fontSize: 14,
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                    }}
                                >
                                    {selectedCountry.label}
                                </button>
                                {showCountryMenu && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 'calc(100% + 6px)',
                                            left: 0,
                                            right: 0,
                                            maxHeight: 220,
                                            overflowY: 'auto',
                                            background: 'white',
                                            border: '1px solid var(--gray-200)',
                                            borderRadius: 'var(--radius-sm)',
                                            boxShadow: 'var(--shadow-lg)',
                                            zIndex: 20,
                                        }}
                                    >
                                        {COUNTRY_CODES.map((c) => (
                                            <button
                                                key={c.code}
                                                type="button"
                                                onClick={() => {
                                                    setCountryCode(c.code);
                                                    setShowCountryMenu(false);
                                                }}
                                                style={{
                                                    width: '100%',
                                                    textAlign: 'left',
                                                    padding: '10px 12px',
                                                    border: 'none',
                                                    borderBottom: '1px solid var(--gray-100)',
                                                    background: c.code === countryCode ? 'var(--primary-light)' : 'white',
                                                    cursor: 'pointer',
                                                    fontFamily: 'Tajawal, sans-serif',
                                                    fontSize: 14,
                                                }}
                                            >
                                                {c.label} ({c.country})
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <input
                                className="input"
                                type="tel"
                                placeholder="9XXXXXXXX"
                                value={phone}
                                onChange={(e) => setPhone(formatPhone(e.target.value))}
                                style={{ direction: 'ltr', textAlign: 'left' }}
                                onFocus={() => setShowCountryMenu(false)}
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-block btn-lg"
                            style={{
                                marginTop: 24,
                                ...(phone !== '1810' && phone.length < 7
                                    ? { opacity: 0.5, pointerEvents: 'none' }
                                    : {}),
                            }}
                            disabled={loading}
                        >
                            {loading ? 'جاري الدخول...' : USE_OTP ? 'إرسال رمز التحقق' : 'تسجيل الدخول'}
                        </button>
                    </form>
                ) : step === 'admin-password' ? (
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            if (adminPassword !== '2019') {
                                setError('كلمة المرور غير صحيحة');
                                return;
                            }

                            setError('');
                            setLoading(true);
                            try {
                                const { data } = await api.post('/admin/login', {
                                    username: 'admin1810',
                                    password: 'admin1810',
                                });
                                sessionStorage.setItem('adminToken', data.token);
                                navigate('/admin');
                            } catch (err) {
                                setError(err.response?.data?.error || 'تعذر تسجيل دخول المدير');
                            } finally {
                                setLoading(false);
                            }
                        }}
                    >
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <p style={{ color: 'var(--gray-600)', fontSize: 15 }}>أدخل كلمة مرور المشرف</p>
                        </div>
                        <input
                            className="input"
                            type="password"
                            placeholder="كلمة المرور"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            autoFocus
                            style={{ textAlign: 'center', fontSize: 20, letterSpacing: 8 }}
                        />
                        <button
                            type="submit"
                            className="btn btn-primary btn-block btn-lg"
                            style={{ marginTop: 24 }}
                            disabled={loading || !adminPassword}
                        >
                            {loading ? 'جاري الدخول...' : 'دخول'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setStep('phone');
                                setError('');
                                setAdminPassword('');
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--gray-500)',
                                fontSize: 13,
                                cursor: 'pointer',
                                display: 'block',
                                margin: '12px auto 0',
                            }}
                        >
                            رجوع
                        </button>
                    </form>
                ) : USE_OTP ? (
                    <form onSubmit={handleVerifyOtp}>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <p style={{ color: 'var(--gray-600)', fontSize: 15 }}>تم إرسال رمز التحقق إلى</p>
                            <p style={{ fontWeight: 600, direction: 'ltr', marginTop: 4, fontSize: 18 }}>
                                {countryCode}
                                {phone}
                            </p>
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                gap: 8,
                                justifyContent: 'center',
                                direction: 'ltr',
                                marginBottom: 24,
                            }}
                        >
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={(el) => {
                                        otpRefs.current[i] = el;
                                    }}
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(i, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                    onPaste={i === 0 ? handleOtpPaste : undefined}
                                    style={{
                                        width: 48,
                                        height: 56,
                                        textAlign: 'center',
                                        fontSize: 22,
                                        fontWeight: 600,
                                        borderRadius: 'var(--radius-sm)',
                                        border: '2px solid var(--gray-200)',
                                        outline: 'none',
                                        transition: 'border-color 0.2s',
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = 'var(--primary)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = 'var(--gray-200)';
                                    }}
                                />
                            ))}
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-block btn-lg"
                            disabled={loading || otp.join('').length !== 6}
                        >
                            {loading ? 'جاري التحقق...' : 'تأكيد'}
                        </button>

                        <div style={{ textAlign: 'center', marginTop: 16 }}>
                            {resendTimer > 0 ? (
                                <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>
                                    إعادة الإرسال بعد {resendTimer} ثانية
                                </p>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={loading}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--primary)',
                                        fontSize: 14,
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                    }}
                                >
                                    إعادة إرسال الرمز
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    setStep('phone');
                                    setError('');
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--gray-500)',
                                    fontSize: 13,
                                    cursor: 'pointer',
                                    display: 'block',
                                    margin: '8px auto 0',
                                }}
                            >
                                تغيير الرقم
                            </button>
                        </div>
                    </form>
                ) : null}
            </div>
        </div>
    );
}
