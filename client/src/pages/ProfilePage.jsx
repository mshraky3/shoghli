import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ArrowRight, LogOut } from 'lucide-react';

export default function ProfilePage() {
    const { user, logout, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState(user?.name || '');
    const [phoneVisibility, setPhoneVisibility] = useState(user?.phone_visibility || 'request_only');
    const [bio, setBio] = useState(user?.bio || '');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const save = async () => {
        setSaving(true);
        setMessage('');
        try {
            await api.put('/users/profile', { name, phone_visibility: phoneVisibility });
            if (user?.role === 'worker') {
                await api.put('/workers/profile', { bio });
            }
            await refreshUser();
            setMessage('تم الحفظ بنجاح');
        } catch (err) {
            setMessage('حدث خطأ');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/auth');
    };

    return (
        <div className="page" style={{ paddingBottom: 70 }}>
            <div style={{
                background: 'white', padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                borderBottom: '1px solid var(--gray-200)',
            }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <ArrowRight size={22} color="var(--gray-700)" />
                </button>
                <h1 style={{ fontSize: 18, fontWeight: 700 }}>الملف الشخصي</h1>
            </div>

            <div className="container">
                {message && <div className={`alert ${message.includes('خطأ') ? 'alert-error' : 'alert-success'}`}>{message}</div>}

                <div className="card" style={{ marginBottom: 16, textAlign: 'center' }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: '50%',
                        background: 'var(--primary-light)', margin: '0 auto 12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 28, fontWeight: 700, color: 'var(--primary)',
                    }}>
                        {name ? name[0] : '؟'}
                    </div>
                    <p style={{ fontWeight: 700, fontSize: 18 }}>{name || 'بدون اسم'}</p>
                    <p style={{ color: 'var(--gray-500)', fontSize: 14, direction: 'ltr' }}>{user?.phone}</p>
                    <span className={`badge ${user?.role === 'worker' ? 'badge-primary' : 'badge-success'}`} style={{ marginTop: 8 }}>
                        {user?.role === 'worker' ? 'عامل' : 'صاحب عمل'}
                    </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label className="input-label">الاسم</label>
                        <input className="input" value={name} onChange={e => setName(e.target.value)} />
                    </div>

                    {user?.role === 'worker' && (
                        <>
                            <div>
                                <label className="input-label">نبذة عنك</label>
                                <textarea className="input" rows={3} value={bio} onChange={e => setBio(e.target.value)} style={{ resize: 'vertical' }} />
                            </div>
                            <div>
                                <label className="input-label">إعداد رقم الهاتف</label>
                                <div className="toggle-group">
                                    <div className={`toggle-option ${phoneVisibility === 'public' ? 'active' : ''}`} onClick={() => setPhoneVisibility('public')}>
                                        <div className="toggle-title">عام</div>
                                    </div>
                                    <div className={`toggle-option ${phoneVisibility === 'request_only' ? 'active' : ''}`} onClick={() => setPhoneVisibility('request_only')}>
                                        <div className="toggle-title">بطلب فقط</div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    <button className="btn btn-primary btn-block" onClick={save} disabled={saving}>
                        {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                    </button>

                    <button className="btn btn-danger btn-block" onClick={handleLogout} style={{ marginTop: 12 }}>
                        <LogOut size={16} /> تسجيل الخروج
                    </button>
                </div>
            </div>
        </div>
    );
}
