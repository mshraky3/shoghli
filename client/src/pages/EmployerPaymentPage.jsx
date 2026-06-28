import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { CreditCard, Copy, Check, Clock, XCircle, Upload, LogOut } from 'lucide-react';

export default function EmployerPaymentPage() {
    const { user, logout, refreshUser } = useAuth();
    const navigate = useNavigate();

    const [payInfo, setPayInfo] = useState(null);
    const [application, setApplication] = useState(null);
    const [status, setStatus] = useState(user?.employer_status || 'pending_payment');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const [preview, setPreview] = useState('');      // base64 data URL of chosen file
    const [submitting, setSubmitting] = useState(false);
    const fileRef = useRef(null);

    const load = async () => {
        try {
            const [{ data: pay }, { data: mine }] = await Promise.all([
                api.get('/settings/payment'),
                api.get('/employer-applications/me'),
            ]);
            setPayInfo(pay);
            setApplication(mine.application);
            setStatus(mine.employer_status || user?.employer_status || 'pending_payment');
        } catch (err) {
            setError(err.response?.data?.error || 'تعذر تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // If already approved, leave this page.
        if (user?.employer_status === 'approved') {
            navigate(user.onboarding_completed ? '/dashboard' : '/onboarding/employer', { replace: true });
            return;
        }
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const copyPhone = async () => {
        if (!payInfo?.sham_cash_phone) return;
        try {
            await navigator.clipboard.writeText(payInfo.sham_cash_phone);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* clipboard not available */ }
    };

    const handleFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setError('الأنواع المسموحة: JPG, PNG, WEBP');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setError('حجم الصورة كبير جداً (الحد 2MB)');
            return;
        }
        setError('');
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result);
        reader.readAsDataURL(file);
    };

    const submit = async () => {
        if (!preview) { setError('يرجى اختيار صورة الإيصال'); return; }
        setSubmitting(true);
        setError('');
        try {
            await api.post('/employer-applications', { screenshot: preview });
            await refreshUser();
            setPreview('');
            await load();
        } catch (err) {
            setError(err.response?.data?.error || 'تعذر إرسال الطلب');
        } finally {
            setSubmitting(false);
        }
    };

    const feeText = payInfo
        ? `${Number(payInfo.employer_fee_amount || 0).toLocaleString('ar')} ${payInfo.employer_fee_currency || ''}`.trim()
        : '';

    if (loading) {
        return <div className="loading-page"><div className="spinner" /><p>جاري التحميل...</p></div>;
    }

    const showUploadForm = status === 'pending_payment' || status === 'rejected';

    return (
        <div className="page" style={{ background: 'white' }}>
            <div className="container" style={{ paddingTop: 40, maxWidth: 460 }}>
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-light)', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CreditCard size={30} color="var(--primary)" />
                    </div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--gray-800)' }}>تفعيل حساب صاحب العمل</h1>
                </div>

                {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

                {/* PENDING REVIEW */}
                {status === 'pending_review' && (
                    <div className="card" style={{ textAlign: 'center', padding: 28 }}>
                        <Clock size={42} color="#d97706" style={{ margin: '0 auto 14px' }} />
                        <h2 style={{ fontSize: 19, fontWeight: 700, marginBottom: 8 }}>طلبك قيد المراجعة</h2>
                        <p style={{ color: 'var(--gray-500)', fontSize: 14, lineHeight: 1.8 }}>
                            استلمنا إيصال الدفع الخاص بك. سيقوم فريقنا بمراجعته وتفعيل حسابك قريباً.
                            سيتم إعلامك عند الموافقة.
                        </p>
                    </div>
                )}

                {/* REJECTED */}
                {status === 'rejected' && (
                    <div className="card" style={{ padding: 20, marginBottom: 18, borderRight: '4px solid #dc2626' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <XCircle size={20} color="#dc2626" />
                            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#dc2626' }}>تم رفض الطلب السابق</h2>
                        </div>
                        {application?.rejection_reason && (
                            <p style={{ color: 'var(--gray-600)', fontSize: 14 }}>السبب: {application.rejection_reason}</p>
                        )}
                        <p style={{ color: 'var(--gray-500)', fontSize: 13, marginTop: 6 }}>يمكنك إعادة الدفع ورفع إيصال جديد أدناه.</p>
                    </div>
                )}

                {/* PAYMENT INSTRUCTIONS + UPLOAD */}
                {showUploadForm && (
                    <>
                        <div className="card" style={{ padding: 22, marginBottom: 18 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>خطوات التفعيل</h3>
                            <ol style={{ paddingInlineStart: 20, color: 'var(--gray-600)', fontSize: 14, lineHeight: 2 }}>
                                <li>حوّل المبلغ عبر تطبيق <strong>شام كاش</strong> إلى الرقم التالي.</li>
                                <li>التقط صورة لإيصال التحويل.</li>
                                <li>ارفع الصورة هنا وانتظر موافقة الإدارة.</li>
                            </ol>

                            <div style={{ marginTop: 16, background: 'var(--gray-100)', borderRadius: 12, padding: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>المبلغ المطلوب</span>
                                    <strong style={{ fontSize: 18, color: 'var(--primary)' }}>{feeText || '—'}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>رقم شام كاش</span>
                                    <button onClick={copyPhone} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1.5px solid var(--gray-200)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', direction: 'ltr' }}>
                                        <strong style={{ fontSize: 16, letterSpacing: 1 }}>{payInfo?.sham_cash_phone || '—'}</strong>
                                        {copied ? <Check size={16} color="#16a34a" /> : <Copy size={16} color="var(--gray-400)" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{ padding: 22 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>رفع إيصال الدفع</h3>

                            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />

                            {preview ? (
                                <div style={{ textAlign: 'center' }}>
                                    <img src={preview} alt="إيصال الدفع" style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 10, border: '1px solid var(--gray-200)' }} />
                                    <button onClick={() => { setPreview(''); if (fileRef.current) fileRef.current.value = ''; }}
                                        style={{ display: 'block', margin: '10px auto 0', background: 'none', border: 'none', color: 'var(--gray-500)', cursor: 'pointer', fontSize: 13 }}>
                                        اختيار صورة أخرى
                                    </button>
                                </div>
                            ) : (
                                <button onClick={() => fileRef.current?.click()}
                                    style={{ width: '100%', border: '2px dashed var(--gray-200)', borderRadius: 12, padding: '28px 16px', background: 'var(--gray-100)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                                    <Upload size={28} color="var(--gray-400)" />
                                    <span style={{ color: 'var(--gray-500)', fontSize: 14 }}>اضغط لاختيار صورة الإيصال</span>
                                    <span style={{ color: 'var(--gray-400)', fontSize: 12 }}>JPG, PNG, WEBP — بحد أقصى 2MB</span>
                                </button>
                            )}

                            <button onClick={submit} className="btn btn-primary btn-block btn-lg" style={{ marginTop: 16 }} disabled={submitting || !preview}>
                                {submitting ? 'جاري الإرسال...' : 'إرسال للمراجعة'}
                            </button>
                        </div>
                    </>
                )}

                <button onClick={() => { logout(); navigate('/auth'); }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--gray-500)', cursor: 'pointer', fontSize: 14, margin: '24px auto 40px', fontFamily: 'Tajawal, sans-serif' }}>
                    <LogOut size={16} /> تسجيل الخروج
                </button>
            </div>
        </div>
    );
}
