import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowRight, MapPin, Phone, PhoneForwarded, Clock, Award } from 'lucide-react';

export default function UserProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get(`/users/${id}`),
            api.get('/categories'),
        ]).then(([profileRes, catRes]) => {
            setProfile(profileRes.data.user);
            setCategories(catRes.data.categories);
        }).catch(console.error).finally(() => setLoading(false));
    }, [id]);

    const sendCallRequest = async () => {
        try {
            const { data } = await api.post('/call-requests', { to_user_id: id });
            if (data.direct) {
                alert(`رقم الهاتف: ${data.phone}`);
            } else {
                alert('تم إرسال طلب الاتصال');
            }
        } catch (err) {
            alert(err.response?.data?.error || 'حدث خطأ');
        }
    };

    const getCategoryName = (catId) => categories.find(c => c.id === catId)?.name_ar || '';

    if (loading) {
        return <div className="loading-page"><div className="spinner" /></div>;
    }

    if (!profile) {
        return (
            <div className="page">
                <div className="container" style={{ textAlign: 'center', paddingTop: 60 }}>
                    <p>المستخدم غير موجود</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div style={{
                background: 'white', padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                borderBottom: '1px solid var(--gray-200)',
            }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <ArrowRight size={22} />
                </button>
                <h1 style={{ fontSize: 18, fontWeight: 700 }}>الملف الشخصي</h1>
            </div>

            <div className="container">
                <div className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
                    {profile.avatar_url ? (
                        <img
                            src={profile.avatar_url}
                            alt={profile.name || 'المستخدم'}
                            style={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                objectFit: 'cover',
                                margin: '0 auto 12px',
                                display: 'block',
                            }}
                        />
                    ) : (
                        <div style={{
                            width: 80, height: 80, borderRadius: '50%',
                            background: 'var(--primary-light)', margin: '0 auto 12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 32, fontWeight: 700, color: 'var(--primary)',
                        }}>
                            {profile.name ? profile.name[0] : '؟'}
                        </div>
                    )}
                    <h2 style={{ fontSize: 22, fontWeight: 700 }}>{profile.name || 'بدون اسم'}</h2>

                    {profile.phone && (
                        <p style={{ color: 'var(--gray-600)', direction: 'ltr', marginTop: 4 }}>{profile.phone}</p>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                        {profile.governorate_name && (
                            <span className="badge badge-primary"><MapPin size={12} /> {profile.governorate_name}</span>
                        )}
                        {profile.district_name && (
                            <span className="badge badge-primary">{profile.district_name}</span>
                        )}
                        <span className={`badge ${profile.is_active ? 'badge-success' : 'badge-danger'}`}>
                            {profile.is_active ? 'متاح' : 'غير متاح'}
                        </span>
                    </div>
                </div>

                {/* Worker details */}
                {profile.category_ids && profile.category_ids.length > 0 && (
                    <div className="card" style={{ marginBottom: 16 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>المهارات</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {profile.category_ids.map(catId => (
                                <span key={catId} className="badge badge-primary" style={{ padding: '6px 12px' }}>
                                    {getCategoryName(catId)}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {(profile.experience_years || profile.available_hours || profile.bio) && (
                    <div className="card" style={{ marginBottom: 16 }}>
                        {profile.experience_years && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <Award size={18} color="var(--gray-500)" />
                                <span>{profile.experience_years} سنوات خبرة</span>
                            </div>
                        )}
                        {profile.available_hours && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <Clock size={18} color="var(--gray-500)" />
                                <span>{profile.available_hours} ساعات متاحة يومياً</span>
                            </div>
                        )}
                        {profile.bio && (
                            <p style={{ color: 'var(--gray-600)', lineHeight: 1.6 }}>{profile.bio}</p>
                        )}
                    </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 12 }}>
                    {profile.phone ? (
                        <a href={`tel:${profile.phone}`} className="btn btn-success btn-block btn-lg">
                            <Phone size={18} /> اتصل الآن
                        </a>
                    ) : profile.phone_visibility === 'public' ? (
                        <button onClick={sendCallRequest} className="btn btn-success btn-block btn-lg">
                            <Phone size={18} /> اتصل
                        </button>
                    ) : (
                        <button onClick={sendCallRequest} className="btn btn-primary btn-block btn-lg">
                            <PhoneForwarded size={18} /> طلب اتصال
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
