import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { MapPin, User, ChevronLeft } from 'lucide-react';

export default function EmployerOnboarding() {
    const { refreshUser } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [location, setLocation] = useState(null);
    const [locationInfo, setLocationInfo] = useState(null);
    const [name, setName] = useState('');
    const [companyName, setCompanyName] = useState('');

    const steps = ['الموقع', 'الملف الشخصي'];

    const requestLocation = () => {
        setLoading(true);
        setError('');
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                setLocation({ lat: latitude, lng: longitude });
                try {
                    const { data } = await api.get(`/locations/reverse-geocode?lat=${latitude}&lng=${longitude}`);
                    setLocationInfo(data.location);
                } catch {
                    setLocationInfo({ district_name: 'غير معروف', governorate_name: 'سوريا' });
                }
                setLoading(false);
            },
            () => {
                setError('لم نتمكن من الحصول على موقعك.');
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const finishOnboarding = async () => {
        setLoading(true);
        setError('');
        try {
            if (location) {
                await api.put('/users/location', {
                    lat: location.lat,
                    lng: location.lng,
                    governorate_id: locationInfo?.governorate_id,
                    district_id: locationInfo?.district_id,
                });
            }

            await api.put('/users/profile', { name: name || undefined });
            await api.put('/users/onboarding-complete');
            await refreshUser();
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'حدث خطأ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="onboarding-page">
            <div className="onboarding-header">
                <div className="onboarding-progress">
                    {steps.map((_, i) => (
                        <div key={i} className={`progress-dot ${i === step ? 'active' : i < step ? 'completed' : ''}`} />
                    ))}
                </div>
            </div>

            <div className="onboarding-content container">
                {error && <div className="alert alert-error">{error}</div>}

                {step === 0 && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MapPin size={32} color="var(--success)" />
                        </div>
                        <h2 className="onboarding-title">حدد موقعك</h2>
                        <p className="onboarding-subtitle">لنعرض لك العمّال القريبين منك</p>

                        {!location ? (
                            <button className="btn btn-primary btn-lg btn-block" onClick={requestLocation} disabled={loading}>
                                {loading ? 'جاري تحديد الموقع...' : 'السماح بتحديد الموقع'}
                            </button>
                        ) : (
                            <div className="card" style={{ marginTop: 20, padding: '14px 18px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, justifyContent: 'center' }}>
                                    <MapPin size={18} color="var(--success)" />
                                    <span className="badge badge-success">تم تحديد الموقع ✓</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {locationInfo?.village_name && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>القرية</span>
                                            <span style={{ fontWeight: 700, fontSize: 15 }}>{locationInfo.village_name}</span>
                                        </div>
                                    )}
                                    {locationInfo?.subdistrict_name && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>الناحية</span>
                                            <span style={{ fontSize: 14 }}>{locationInfo.subdistrict_name}</span>
                                        </div>
                                    )}
                                    {locationInfo?.district_name && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>المنطقة</span>
                                            <span style={{ fontSize: 14 }}>{locationInfo.district_name}</span>
                                        </div>
                                    )}
                                    {locationInfo?.governorate_name && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>المحافظة</span>
                                            <span style={{ fontSize: 14 }}>{locationInfo.governorate_name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {step === 1 && (
                    <div>
                        <div style={{ textAlign: 'center' }}>
                            <User size={32} color="var(--success)" style={{ margin: '0 auto 12px' }} />
                            <h2 className="onboarding-title">معلوماتك</h2>
                            <p className="onboarding-subtitle">اختياري — يمكنك تعديلها لاحقاً</p>
                        </div>
                        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div>
                                <label className="input-label">الاسم</label>
                                <input className="input" placeholder="اسمك (اختياري)" value={name} onChange={e => setName(e.target.value)} />
                            </div>
                            <div>
                                <label className="input-label">اسم الشركة / المؤسسة</label>
                                <input className="input" placeholder="اختياري" value={companyName} onChange={e => setCompanyName(e.target.value)} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="onboarding-footer container">
                <div style={{ display: 'flex', gap: 12 }}>
                    {step > 0 && (
                        <button className="btn btn-secondary" onClick={() => setStep(s => s - 1)}>
                            <ChevronLeft size={18} /> رجوع
                        </button>
                    )}
                    {step < steps.length - 1 ? (
                        <button className="btn btn-primary btn-block" onClick={() => setStep(s => s + 1)} disabled={step === 0 && !location}>
                            التالي
                        </button>
                    ) : (
                        <button className="btn btn-primary btn-block btn-lg" onClick={finishOnboarding} disabled={loading}>
                            {loading ? 'جاري الحفظ...' : 'ابدأ الآن'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
