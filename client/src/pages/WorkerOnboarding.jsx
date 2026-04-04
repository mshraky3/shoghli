import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Search, Wrench, User, ChevronLeft, Stethoscope, Calendar } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const FALLBACK_CATEGORIES = [
    { id: 1, name_ar: 'كهربائي', icon: 'zap' },
    { id: 2, name_ar: 'سباك', icon: 'droplets' },
    { id: 3, name_ar: 'نقل أثاث', icon: 'truck' },
    { id: 4, name_ar: 'طبيب', icon: 'heart-pulse' },
    { id: 5, name_ar: 'سائق', icon: 'car' },
    { id: 6, name_ar: 'نجار', icon: 'hammer' },
    { id: 7, name_ar: 'دهان', icon: 'paintbrush' },
    { id: 8, name_ar: 'تنظيف', icon: 'sparkles' },
    { id: 9, name_ar: 'بناء', icon: 'building' },
    { id: 10, name_ar: 'حداد', icon: 'anvil' },
    { id: 11, name_ar: 'ميكانيكي', icon: 'wrench' },
    { id: 12, name_ar: 'مزارع', icon: 'wheat' },
    { id: 13, name_ar: 'طباخ', icon: 'chef-hat' },
    { id: 14, name_ar: 'خياط', icon: 'scissors' },
    { id: 15, name_ar: 'حلاق', icon: 'briefcase' },
    { id: 16, name_ar: 'طبيب عيادة', icon: 'heart-pulse' },
    { id: 17, name_ar: 'معلم خصوصي', icon: 'briefcase' },
    { id: 18, name_ar: 'حارس أمن', icon: 'briefcase' },
    { id: 19, name_ar: 'صيدلاني', icon: 'heart-pulse' },
    { id: 20, name_ar: 'أعمال عامة', icon: 'briefcase' },
];

const CATEGORY_ICONS = {
    'zap': '⚡', 'droplets': '🔧', 'truck': '🚚', 'heart-pulse': '🩺',
    'car': '🚗', 'hammer': '🔨', 'paintbrush': '🎨', 'sparkles': '✨',
    'building': '🏗️', 'anvil': '⚒️', 'wrench': '🔩', 'wheat': '🌾',
    'chef-hat': '👨‍🍳', 'scissors': '✂️', 'briefcase': '💼',
};

const DOCTOR_CATEGORY_IDS = [4, 16, 19];

const DAYS_OF_WEEK = [
    { value: 0, label: 'الأحد' },
    { value: 1, label: 'الإثنين' },
    { value: 2, label: 'الثلاثاء' },
    { value: 3, label: 'الأربعاء' },
    { value: 4, label: 'الخميس' },
    { value: 5, label: 'الجمعة' },
    { value: 6, label: 'السبت' },
];

function DraggableMarker({ position, onDragEnd }) {
    const markerRef = useRef(null);
    useMapEvents({});
    return (
        <Marker
            position={position}
            draggable={true}
            ref={markerRef}
            eventHandlers={{
                dragend() {
                    const marker = markerRef.current;
                    if (marker) {
                        const { lat, lng } = marker.getLatLng();
                        onDragEnd(lat, lng);
                    }
                },
            }}
        />
    );
}

const RADIUS_OPTIONS = [
    { value: 'village', label: 'القرية فقط', desc: '~3 كم' },
    { value: 'subdistrict', label: 'الناحية', desc: '~15 كم' },
    { value: 'district', label: 'المنطقة', desc: '~40 كم' },
    { value: 'governorate', label: 'المحافظة كاملة', desc: '~100 كم' },
];

export default function WorkerOnboarding() {
    const { updateUser, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [location, setLocation] = useState(null);
    const [locationInfo, setLocationInfo] = useState(null);
    const [searchRadius, setSearchRadius] = useState('district');
    const [allCategories, setAllCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [name, setName] = useState('');
    const [phoneVisibility, setPhoneVisibility] = useState('request_only');
    const [experience, setExperience] = useState('');
    const [bio, setBio] = useState('');
    const [workDays, setWorkDays] = useState([0, 1, 2, 3, 4]);

    const [clinicName, setClinicName] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [availableFrom, setAvailableFrom] = useState('08:00');
    const [availableTo, setAvailableTo] = useState('16:00');

    const [termsAccepted, setTermsAccepted] = useState(false);

    const isDoctor = selectedCategories.some(id => DOCTOR_CATEGORY_IDS.includes(id));

    const getSteps = () => {
        const base = ['الموقع', 'نطاق البحث', 'المهارات'];
        if (isDoctor) base.push('بيانات العيادة');
        base.push('الملف الشخصي');
        return base;
    };
    const steps = getSteps();

    useEffect(() => {
        api.get('/categories')
            .then(({ data }) => setAllCategories(data.categories?.length ? data.categories : FALLBACK_CATEGORIES))
            .catch(() => setAllCategories(FALLBACK_CATEGORIES));
    }, []);

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
                setError('لم نتمكن من الحصول على موقعك. تأكد من تفعيل خدمات الموقع.');
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleMarkerDrag = async (lat, lng) => {
        setLocation({ lat, lng });
        try {
            const { data } = await api.get(`/locations/reverse-geocode?lat=${lat}&lng=${lng}`);
            setLocationInfo(data.location);
        } catch {
            setLocationInfo({ district_name: 'غير معروف', governorate_name: 'سوريا' });
        }
    };

    const toggleCategory = (id) => {
        setSelectedCategories(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const toggleDay = (day) => {
        setWorkDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
        );
    };

    const nextStep = () => { setError(''); setStep(s => s + 1); };
    const prevStep = () => { setError(''); setStep(s => s - 1); };

    const finishOnboarding = async () => {
        if (!name.trim()) { setError('الاسم مطلوب'); return; }
        if (!termsAccepted) { setError('يجب قبول الشروط والأحكام'); return; }

        setLoading(true);
        setError('');
        try {
            if (location) {
                await api.put('/users/location', {
                    lat: location.lat, lng: location.lng,
                    governorate_id: locationInfo?.governorate_id,
                    district_id: locationInfo?.district_id,
                    subdistrict_id: locationInfo?.subdistrict_id,
                    village_id: locationInfo?.village_id,
                });
            }

            await api.put('/users/profile', { name: name || undefined, phone_visibility: phoneVisibility });

            const workerData = {
                category_ids: selectedCategories,
                search_radius: searchRadius,
                bio: experience ? `${experience}${bio ? ' | ' + bio : ''}` : (bio || undefined),
                work_days: workDays,
            };

            if (isDoctor) {
                workerData.clinic_name = clinicName || undefined;
                workerData.specialty = specialty || undefined;
                workerData.available_from = availableFrom;
                workerData.available_to = availableTo;
            }

            await api.put('/workers/profile', workerData);
            await api.put('/users/accept-terms');
            await api.put('/users/onboarding-complete');
            await refreshUser();
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'حدث خطأ');
        } finally {
            setLoading(false);
        }
    };

    const getStepContent = () => {
        if (step === 0) return 'location';
        if (step === 1) return 'radius';
        if (step === 2) return 'categories';
        if (isDoctor && step === 3) return 'doctor';
        return 'profile';
    };

    const currentContent = getStepContent();

    return (
        <div className="onboarding-page">
            <div className="onboarding-header">
                <div className="onboarding-progress">
                    {steps.map((_, i) => (
                        <div key={i} className={`progress-dot ${i === step ? 'active' : i < step ? 'completed' : ''}`} />
                    ))}
                </div>
                <p style={{ fontSize: 13, color: 'var(--gray-400)' }}>{step + 1} / {steps.length}</p>
            </div>

            <div className="onboarding-content container">
                {error && <div className="alert alert-error">{error}</div>}

                {currentContent === 'location' && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-light)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MapPin size={32} color="var(--primary)" />
                        </div>
                        <h2 className="onboarding-title">حدد موقعك</h2>
                        <p className="onboarding-subtitle">نحتاج موقعك لنعرض لك فرص العمل القريبة منك</p>

                        {!location ? (
                            <button className="btn btn-primary btn-lg btn-block" onClick={requestLocation} disabled={loading}>
                                {loading ? 'جاري تحديد الموقع...' : 'السماح بتحديد الموقع'}
                            </button>
                        ) : (
                            <div style={{ marginTop: 16 }}>
                                <div style={{ height: 260, borderRadius: 12, overflow: 'hidden', border: '2px solid var(--gray-200)' }}>
                                    <MapContainer center={[location.lat, location.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <DraggableMarker position={[location.lat, location.lng]} onDragEnd={handleMarkerDrag} />
                                    </MapContainer>
                                </div>
                                <div className="card" style={{ marginTop: 12, padding: '14px 18px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {locationInfo?.village_name && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>القرية</span>
                                                <span style={{ fontWeight: 700, fontSize: 15 }}>{locationInfo.village_name}</span>
                                            </div>
                                        )}
                                        {locationInfo?.subdistrict_name && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>الناحية</span>
                                                <span style={{ fontSize: 14 }}>{locationInfo.subdistrict_name}</span>
                                            </div>
                                        )}
                                        {locationInfo?.district_name && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>المنطقة</span>
                                                <span style={{ fontSize: 14 }}>{locationInfo.district_name}</span>
                                            </div>
                                        )}
                                        {locationInfo?.governorate_name && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>المحافظة</span>
                                                <span style={{ fontSize: 14 }}>{locationInfo.governorate_name}</span>
                                            </div>
                                        )}
                                        {!locationInfo && <p style={{ textAlign: 'center', color: 'var(--gray-400)', margin: 0 }}>جاري تحديد الموقع...</p>}
                                    </div>
                                    <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 10, textAlign: 'center' }}>📍 اسحب الدبوس لتعديل موقعك</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {currentContent === 'radius' && (
                    <div>
                        <div style={{ textAlign: 'center' }}>
                            <Search size={32} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
                            <h2 className="onboarding-title">نطاق البحث</h2>
                            <p className="onboarding-subtitle">هل تبحث عن عمل في قريتك فقط أم في منطقة أوسع؟</p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 24 }}>
                            {RADIUS_OPTIONS.map(opt => {
                                const isActive = searchRadius === opt.value;
                                const radiusMeters = { village: 3000, subdistrict: 15000, district: 40000, governorate: 100000 }[opt.value];
                                const zoom = { village: 12, subdistrict: 10, district: 9, governorate: 7 }[opt.value];
                                const center = location ? [location.lat, location.lng] : [34.8, 38.9];
                                return (
                                    <div key={opt.value} onClick={() => setSearchRadius(opt.value)}
                                        style={{ border: `2px solid ${isActive ? 'var(--primary)' : 'var(--gray-200)'}`, borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s' }}>
                                        <div style={{ height: 130, pointerEvents: 'none' }}>
                                            <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}
                                                dragging={false} scrollWheelZoom={false} doubleClickZoom={false} touchZoom={false} zoomControl={false} attributionControl={false}>
                                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                <Circle center={center} radius={radiusMeters}
                                                    pathOptions={{ color: isActive ? '#2563eb' : '#94a3b8', fillColor: isActive ? '#2563eb' : '#94a3b8', fillOpacity: 0.15, weight: 2 }} />
                                                <Marker position={center} />
                                            </MapContainer>
                                        </div>
                                        <div style={{ padding: '8px 10px', textAlign: 'center', background: isActive ? 'var(--primary-light, #eff6ff)' : 'white' }}>
                                            <div style={{ fontWeight: 700, fontSize: 13, color: isActive ? 'var(--primary)' : 'var(--gray-700)' }}>{opt.label}</div>
                                            <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{opt.desc}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {currentContent === 'categories' && (
                    <div>
                        <div style={{ textAlign: 'center' }}>
                            <Wrench size={32} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
                            <h2 className="onboarding-title">ما هي الأعمال التي تستطيع القيام بها؟</h2>
                            <p className="onboarding-subtitle">اختر واحدة أو أكثر</p>
                        </div>
                        <div className="category-grid" style={{ marginTop: 24 }}>
                            {allCategories.map(cat => (
                                <div key={cat.id}
                                    className={`category-item ${selectedCategories.includes(cat.id) ? 'selected' : ''}`}
                                    onClick={() => toggleCategory(cat.id)}>
                                    <span className="icon">{CATEGORY_ICONS[cat.icon] || '🔧'}</span>
                                    <span className="label">{cat.name_ar}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {currentContent === 'doctor' && (
                    <div>
                        <div style={{ textAlign: 'center' }}>
                            <Stethoscope size={32} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
                            <h2 className="onboarding-title">بيانات العيادة</h2>
                            <p className="onboarding-subtitle">هذه المعلومات تساعد المرضى في العثور عليك</p>
                        </div>
                        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div>
                                <label className="input-label">اسم العيادة أو المركز الطبي</label>
                                <input className="input" placeholder="مثال: عيادة الشفاء" value={clinicName} onChange={e => setClinicName(e.target.value)} />
                            </div>
                            <div>
                                <label className="input-label">التخصص</label>
                                <input className="input" placeholder="مثال: طب عام، أسنان، عيون..." value={specialty} onChange={e => setSpecialty(e.target.value)} />
                            </div>
                            <div>
                                <label className="input-label">ساعات العمل</label>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'center', direction: 'ltr' }}>
                                    <input className="input" type="time" value={availableFrom} onChange={e => setAvailableFrom(e.target.value)} style={{ flex: 1 }} />
                                    <span style={{ color: 'var(--gray-400)' }}>—</span>
                                    <input className="input" type="time" value={availableTo} onChange={e => setAvailableTo(e.target.value)} style={{ flex: 1 }} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {currentContent === 'profile' && (
                    <div>
                        <div style={{ textAlign: 'center' }}>
                            <User size={32} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
                            <h2 className="onboarding-title">معلوماتك الشخصية</h2>
                            <p className="onboarding-subtitle">أدخل بياناتك ليتمكن أصحاب العمل من التواصل معك</p>
                        </div>

                        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div>
                                <label className="input-label">الاسم <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input className="input" placeholder="ادخل اسمك" value={name} onChange={e => setName(e.target.value)} />
                            </div>

                            <div>
                                <label className="input-label">سنوات الخبرة او معلومات إضافية</label>
                                <input className="input" type="text" placeholder="مثال: 5 سنوات خبرة" value={experience} onChange={e => setExperience(e.target.value)} />
                            </div>

                            <div>
                                <label className="input-label">نبذة عنك</label>
                                <textarea className="input" rows={3} placeholder="وصف مختصر (اختياري)" value={bio} onChange={e => setBio(e.target.value)} style={{ resize: 'vertical' }} />
                            </div>

                            <div>
                                <label className="input-label" style={{ marginBottom: 10 }}>
                                    <Calendar size={16} style={{ verticalAlign: 'middle', marginLeft: 6 }} />
                                    أيام العمل المتاحة
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {DAYS_OF_WEEK.map(day => (
                                        <button key={day.value} type="button"
                                            onClick={() => toggleDay(day.value)}
                                            style={{
                                                padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                                                border: '2px solid', cursor: 'pointer', fontFamily: 'Tajawal',
                                                background: workDays.includes(day.value) ? 'var(--primary)' : 'white',
                                                color: workDays.includes(day.value) ? 'white' : 'var(--gray-600)',
                                                borderColor: workDays.includes(day.value) ? 'var(--primary)' : 'var(--gray-200)',
                                            }}>
                                            {day.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="input-label">إعدادات رقم الهاتف</label>
                                <div className="toggle-group">
                                    <div className={`toggle-option ${phoneVisibility === 'public' ? 'active' : ''}`} onClick={() => setPhoneVisibility('public')}>
                                        <div className="toggle-title">عام</div>
                                        <div className="toggle-desc">يمكن لأي شخص رؤية رقمك</div>
                                    </div>
                                    <div className={`toggle-option ${phoneVisibility === 'request_only' ? 'active' : ''}`} onClick={() => setPhoneVisibility('request_only')}>
                                        <div className="toggle-title">بطلب فقط</div>
                                        <div className="toggle-desc">يجب طلب إذنك أولاً</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                padding: '14px 16px', borderRadius: 'var(--radius)',
                                border: `2px solid ${termsAccepted ? 'var(--success)' : 'var(--gray-200)'}`,
                                background: termsAccepted ? '#f0fdf4' : 'white',
                                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                            }} onClick={() => setTermsAccepted(!termsAccepted)}>
                                <div style={{
                                    width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                                    border: `2px solid ${termsAccepted ? 'var(--success)' : 'var(--gray-300)'}`,
                                    background: termsAccepted ? 'var(--success)' : 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', fontSize: 14, fontWeight: 700,
                                }}>
                                    {termsAccepted && '✓'}
                                </div>
                                <div style={{ fontSize: 14, lineHeight: 1.5 }}>
                                    أوافق على{' '}
                                    <Link to="/terms" target="_blank" style={{ color: 'var(--primary)', fontWeight: 600 }}
                                        onClick={e => e.stopPropagation()}>
                                        الشروط والأحكام
                                    </Link>
                                    {' '}الخاصة بمنصة شغلي
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="onboarding-footer container">
                <div style={{ display: 'flex', gap: 12 }}>
                    {step > 0 && (
                        <button className="btn btn-secondary" onClick={prevStep} style={{ flex: '0 0 auto' }}>
                            <ChevronLeft size={18} /> رجوع
                        </button>
                    )}
                    {step < steps.length - 1 ? (
                        <button className="btn btn-primary btn-block" onClick={nextStep}
                            disabled={step === 0 && !location}>
                            التالي
                        </button>
                    ) : (
                        <button className="btn btn-primary btn-block btn-lg" onClick={finishOnboarding}
                            disabled={loading || !termsAccepted}>
                            {loading ? 'جاري الحفظ...' : 'ابدأ الآن'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
