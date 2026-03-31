import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Search, Wrench, User, ChevronLeft } from 'lucide-react';

// Fix leaflet marker icon
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

    // Form data
    const [location, setLocation] = useState(null);
    const [locationInfo, setLocationInfo] = useState(null);
    const [searchRadius, setSearchRadius] = useState('district');
    const [categories, setCategories] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [name, setName] = useState('');
    const [phoneVisibility, setPhoneVisibility] = useState('request_only');
    const [experience, setExperience] = useState('');
    const [bio, setBio] = useState('');

    const steps = ['الموقع', 'نطاق البحث', 'المهارات', 'الملف الشخصي'];

    useEffect(() => {
        api.get('/categories')
            .then(({ data }) => setAllCategories(data.categories?.length ? data.categories : FALLBACK_CATEGORIES))
            .catch(() => setAllCategories(FALLBACK_CATEGORIES));
    }, []);

    // Step 0: Get location
    const requestLocation = () => {
        setLoading(true);
        setError('');
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                // Syria bounding box check
                if (latitude < 32.3 || latitude > 37.4 || longitude < 35.5 || longitude > 42.5) {
                    setError('موقعك خارج سوريا. هذه المنصة متاحة في سوريا فقط حالياً.');
                    setLoading(false);
                    return;
                }
                setLocation({ lat: latitude, lng: longitude });
                try {
                    const { data } = await api.get(`/locations/reverse-geocode?lat=${latitude}&lng=${longitude}`);
                    setLocationInfo(data.location);
                } catch {
                    setLocationInfo({ district_name: 'غير معروف', governorate_name: 'سوريا' });
                }
                setLoading(false);
            },
            (err) => {
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

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const finishOnboarding = async () => {
        if (!name.trim()) {
            setError('الاسم مطلوب');
            return;
        }
        setLoading(true);
        setError('');
        try {
            // Save location
            if (location) {
                await api.put('/users/location', {
                    lat: location.lat,
                    lng: location.lng,
                    governorate_id: locationInfo?.governorate_id,
                    district_id: locationInfo?.district_id,
                    subdistrict_id: locationInfo?.subdistrict_id,
                    village_id: locationInfo?.village_id,
                });
            }

            // Save profile
            await api.put('/users/profile', { name: name || undefined, phone_visibility: phoneVisibility });

            // Save worker profile
            await api.put('/workers/profile', {
                category_ids: selectedCategories,
                search_radius: searchRadius,
                bio: experience ? `${experience}${bio ? ' | ' + bio : ''}` : (bio || undefined),
            });

            // Mark onboarding complete
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
                <p style={{ fontSize: 13, color: 'var(--gray-400)' }}>{step + 1} / {steps.length}</p>
            </div>

            <div className="onboarding-content container">
                {error && <div className="alert alert-error">{error}</div>}

                {/* Step 0: Location */}
                {step === 0 && (
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
                                    <MapContainer
                                        center={[location.lat, location.lng]}
                                        zoom={13}
                                        style={{ height: '100%', width: '100%' }}
                                    >
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <DraggableMarker
                                            position={[location.lat, location.lng]}
                                            onDragEnd={handleMarkerDrag}
                                        />
                                    </MapContainer>
                                </div>
                                <div className="card" style={{ textAlign: 'center', marginTop: 12, padding: '12px 16px' }}>
                                    <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>
                                        {locationInfo?.district_name || 'جاري التحديد...'}
                                    </p>
                                    <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>
                                        {locationInfo?.governorate_name || ''}
                                        {locationInfo?.village_name ? ` • ${locationInfo.village_name}` : ''}
                                    </p>
                                    <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 6 }}>📍 اسحب الدبوس لتعديل موقعك</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 1: Search Radius */}
                {step === 1 && (
                    <div>
                        <div style={{ textAlign: 'center' }}>
                            <Search size={32} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
                            <h2 className="onboarding-title">نطاق البحث</h2>
                            <p className="onboarding-subtitle">هل تبحث عن عمل في قريتك فقط أم في منطقة أوسع؟</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
                            {RADIUS_OPTIONS.map(opt => (
                                <div
                                    key={opt.value}
                                    className={`toggle-option ${searchRadius === opt.value ? 'active' : ''}`}
                                    onClick={() => setSearchRadius(opt.value)}
                                >
                                    <div className="toggle-title">{opt.label}</div>
                                    <div className="toggle-desc">{opt.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: Categories */}
                {step === 2 && (
                    <div>
                        <div style={{ textAlign: 'center' }}>
                            <Wrench size={32} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
                            <h2 className="onboarding-title">ما هي الأعمال التي تستطيع القيام بها؟</h2>
                            <p className="onboarding-subtitle">اختر واحدة أو أكثر</p>
                        </div>
                        <div className="category-grid" style={{ marginTop: 24 }}>
                            {allCategories.map(cat => (
                                <div
                                    key={cat.id}
                                    className={`category-item ${selectedCategories.includes(cat.id) ? 'selected' : ''}`}
                                    onClick={() => toggleCategory(cat.id)}
                                >
                                    <span className="icon">{CATEGORY_ICONS[cat.icon] || '🔧'}</span>
                                    <span className="label">{cat.name_ar}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 3: Profile */}
                {step === 3 && (
                    <div>
                        <div style={{ textAlign: 'center' }}>
                            <User size={32} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
                            <h2 className="onboarding-title">معلوماتك الشخصية</h2>
                            <p className="onboarding-subtitle">أدخل بياناتك ليتمكن أصحاب العمل من التواصل معك</p>
                        </div>

                        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div>
                                <label className="input-label">الاسم <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input className="input" placeholder="ادخل اسمك" value={name} onChange={e => setName(e.target.value)} required />
                            </div>

                            <div>
                                <label className="input-label">سنوات الخبرة او معلومات إضافية</label>
                                <input className="input" type="text" placeholder="مثال: 5 سنوات خبرة أو أي معلومة إضافية" value={experience} onChange={e => setExperience(e.target.value)} /></div>

                            <div>
                                <label className="input-label">نبذة عنك</label>
                                <textarea className="input" rows={3} placeholder="وصف مختصر عن خبراتك (اختياري)" value={bio} onChange={e => setBio(e.target.value)} style={{ resize: 'vertical' }} />
                            </div>

                            <div>
                                <label className="input-label">إعدادات رقم الهاتف</label>
                                <div className="toggle-group">
                                    <div
                                        className={`toggle-option ${phoneVisibility === 'public' ? 'active' : ''}`}
                                        onClick={() => setPhoneVisibility('public')}
                                    >
                                        <div className="toggle-title">عام</div>
                                        <div className="toggle-desc">يمكن لأي شخص رؤية رقمك</div>
                                    </div>
                                    <div
                                        className={`toggle-option ${phoneVisibility === 'request_only' ? 'active' : ''}`}
                                        onClick={() => setPhoneVisibility('request_only')}
                                    >
                                        <div className="toggle-title">بطلب فقط</div>
                                        <div className="toggle-desc">يجب طلب إذنك أولاً</div>
                                    </div>
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
                        <button
                            className="btn btn-primary btn-block"
                            onClick={nextStep}
                            disabled={step === 0 && !location}
                        >
                            التالي
                        </button>
                    ) : (
                        <button
                            className="btn btn-primary btn-block btn-lg"
                            onClick={finishOnboarding}
                            disabled={loading}
                        >
                            {loading ? 'جاري الحفظ...' : 'ابدأ الآن'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
