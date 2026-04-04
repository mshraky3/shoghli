import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import BottomNav from '../components/BottomNav';
import {
    LogOut, Star, MapPin, Edit3, Check, ChevronLeft,
    Shield, FileText, Briefcase, Calendar, Clock, Eye, EyeOff
} from 'lucide-react';

const DAYS_LABELS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export default function ProfilePage() {
    const { user, logout, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [phoneVisibility, setPhoneVisibility] = useState(user?.phone_visibility || 'request_only');
    const [bio, setBio] = useState(user?.worker_profile?.bio || user?.bio || '');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || '');
    const fileInputRef = useRef(null);

    useEffect(() => {
        setAvatarPreview(user?.avatar_url || '');
    }, [user?.avatar_url]);

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
            setEditing(false);
        } catch {
            setMessage('حدث خطأ');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/auth');
    };

    const onChooseAvatar = () => {
        fileInputRef.current?.click();
    };

    const onAvatarSelected = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) return;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setMessage('اختر صورة JPG أو PNG أو WEBP فقط');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setMessage('حجم الصورة يجب أن يكون أقل من 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = async () => {
            const dataUrl = reader.result;
            if (typeof dataUrl !== 'string') return;

            setAvatarUploading(true);
            setMessage('');

            try {
                const { data } = await api.put('/users/avatar', { imageData: dataUrl });
                setAvatarPreview(data.avatar_url);
                await refreshUser();
                setMessage('تم تحديث الصورة بنجاح');
            } catch (err) {
                setMessage(err.response?.data?.error || 'تعذر رفع الصورة');
            } finally {
                setAvatarUploading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const wp = user?.worker_profile;
    const rating = parseFloat(user?.avg_rating) || 0;

    return (
        <div className="dash-page">
            <header className="page-header">
                <h1>حسابي</h1>
                {!editing ? (
                    <button onClick={() => setEditing(true)} className="page-header-action">
                        <Edit3 size={16} /> تعديل
                    </button>
                ) : (
                    <button onClick={save} disabled={saving} className="page-header-action save">
                        <Check size={16} /> {saving ? 'حفظ...' : 'حفظ'}
                    </button>
                )}
            </header>

            <main className="page-content">
                {message && (
                    <div className={`alert ${message.includes('خطأ') ? 'alert-error' : 'alert-success'}`}
                        style={{ margin: '0 16px 12px' }}>{message}</div>
                )}

                {/* Profile card */}
                <div className="prof-hero">
                    <div className="prof-avatar-wrap">
                        {avatarPreview ? (
                            <img src={avatarPreview} alt="الصورة الشخصية" className="prof-avatar-img" />
                        ) : (
                            <div className="prof-avatar-lg">
                                {(user?.name || '؟')[0]}
                            </div>
                        )}
                        <button className="prof-avatar-edit" onClick={onChooseAvatar} disabled={avatarUploading}>
                            {avatarUploading ? 'جاري الرفع...' : 'تغيير الصورة'}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={onAvatarSelected}
                            style={{ display: 'none' }}
                        />
                    </div>
                    {editing ? (
                        <input className="prof-name-input" value={name}
                            onChange={e => setName(e.target.value)} placeholder="اسمك" />
                    ) : (
                        <h2 className="prof-name">{user?.name || 'بدون اسم'}</h2>
                    )}
                    <p className="prof-phone" style={{ direction: 'ltr' }}>{user?.phone}</p>
                    <span className={`prof-role ${user?.role === 'worker' ? 'worker' : 'employer'}`}>
                        {user?.role === 'worker' ? 'عامل' : 'صاحب عمل'}
                    </span>

                    {/* Stats row */}
                    <div className="prof-stats">
                        <div className="prof-stat">
                            <div className="prof-stat-val">
                                {rating > 0 ? (
                                    <><Star size={14} fill="#f59e0b" color="#f59e0b" /> {rating.toFixed(1)}</>
                                ) : '—'}
                            </div>
                            <div className="prof-stat-label">التقييم</div>
                        </div>
                        <div className="prof-stat-divider" />
                        <div className="prof-stat">
                            <div className="prof-stat-val">{user?.rating_count || 0}</div>
                            <div className="prof-stat-label">تقييم</div>
                        </div>
                        {user?.role === 'worker' && (
                            <>
                                <div className="prof-stat-divider" />
                                <div className="prof-stat">
                                    <div className="prof-stat-val">{wp?.category_ids?.length || 0}</div>
                                    <div className="prof-stat-label">مهارة</div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Edit section for worker */}
                {user?.role === 'worker' && (
                    <div className="prof-section">
                        {editing ? (
                            <>
                                <div className="prof-field">
                                    <label className="prof-field-label">نبذة عنك</label>
                                    <textarea className="input" rows={3} value={bio}
                                        onChange={e => setBio(e.target.value)}
                                        style={{ resize: 'vertical' }} />
                                </div>
                                <div className="prof-field">
                                    <label className="prof-field-label">إعداد رقم الهاتف</label>
                                    <div className="prof-visibility-toggle">
                                        <button className={phoneVisibility === 'public' ? 'active' : ''}
                                            onClick={() => setPhoneVisibility('public')}>
                                            <Eye size={16} /> عام
                                        </button>
                                        <button className={phoneVisibility === 'request_only' ? 'active' : ''}
                                            onClick={() => setPhoneVisibility('request_only')}>
                                            <EyeOff size={16} /> بطلب فقط
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Bio */}
                                {wp?.bio && (
                                    <div className="prof-info-row">
                                        <span className="prof-info-icon"><Briefcase size={16} /></span>
                                        <span>{wp.bio}</span>
                                    </div>
                                )}
                                {/* Location */}
                                {user?.district_name && (
                                    <div className="prof-info-row">
                                        <span className="prof-info-icon"><MapPin size={16} /></span>
                                        <span>{user.district_name}{user.governorate_name ? `، ${user.governorate_name}` : ''}</span>
                                    </div>
                                )}
                                {/* Phone visibility */}
                                <div className="prof-info-row">
                                    <span className="prof-info-icon">
                                        {phoneVisibility === 'public' ? <Eye size={16} /> : <EyeOff size={16} />}
                                    </span>
                                    <span>الهاتف: {phoneVisibility === 'public' ? 'عام' : 'بطلب فقط'}</span>
                                </div>
                                {/* Work days */}
                                {wp?.work_days?.length > 0 && (
                                    <div className="prof-info-row">
                                        <span className="prof-info-icon"><Calendar size={16} /></span>
                                        <span>{wp.work_days.map(d => DAYS_LABELS[d]).join('، ')}</span>
                                    </div>
                                )}
                                {/* Clinic info for doctors */}
                                {wp?.clinic_name && (
                                    <div className="prof-info-row">
                                        <span className="prof-info-icon"><Shield size={16} /></span>
                                        <span>{wp.clinic_name}{wp.specialty ? ` — ${wp.specialty}` : ''}</span>
                                    </div>
                                )}
                                {wp?.available_from && wp?.available_to && (
                                    <div className="prof-info-row">
                                        <span className="prof-info-icon"><Clock size={16} /></span>
                                        <span style={{ direction: 'ltr', display: 'inline-block' }}>{wp.available_from} — {wp.available_to}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Menu items */}
                <div className="prof-menu">
                    <Link to="/terms" className="prof-menu-item">
                        <FileText size={18} color="var(--gray-500)" />
                        <span>الشروط والأحكام</span>
                        <ChevronLeft size={16} color="var(--gray-400)" />
                    </Link>
                </div>

                <button className="prof-logout" onClick={handleLogout}>
                    <LogOut size={18} /> تسجيل الخروج
                </button>
            </main>

            <BottomNav />
        </div>
    );
}
