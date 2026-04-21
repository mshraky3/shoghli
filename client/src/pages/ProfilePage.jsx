import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import BottomNav from '../components/BottomNav';
import {
    LogOut, Star, MapPin, Edit3, Check, ChevronLeft,
    Shield, FileText, Briefcase, Calendar, Clock, Eye, EyeOff,
    Navigation, X, MessageCircle
} from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const pinIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const SYRIA_CENTER = [35.0, 38.5];
const SYRIA_BOUNDS = [[32.3, 35.5], [37.4, 42.5]];

const CATEGORY_ICONS = {
    'zap': '⚡', 'droplets': '🔧', 'truck': '🚚', 'heart-pulse': '🩺',
    'car': '🚗', 'hammer': '🔨', 'paintbrush': '🎨', 'sparkles': '✨',
    'building': '🏗️', 'anvil': '⚒️', 'wrench': '🔩', 'wheat': '🌾',
    'chef-hat': '👨‍🍳', 'scissors': '✂️', 'briefcase': '💼',
};

const dedupeCategories = (items = []) => {
    const seen = new Set();
    return items.filter((cat) => {
        const key = (cat?.name_ar || '').trim().toLowerCase();
        if (!key) return false;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

function DraggableMarker({ position, onMove }) {
    useMapEvents({
        click(e) {
            onMove({ lat: e.latlng.lat, lng: e.latlng.lng });
        },
    });
    return position ? <Marker position={[position.lat, position.lng]} icon={pinIcon} /> : null;
}

function MapFlyTo({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.flyTo(center, 13);
    }, [center, map]);
    return null;
}

const DAYS_LABELS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export default function ProfilePage() {
    const { user, logout, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [phoneVisibility, setPhoneVisibility] = useState(user?.phone_visibility || 'request_only');
    const [whatsappOptIn, setWhatsappOptIn] = useState(user?.whatsapp_opt_in === true);
    const [bio, setBio] = useState(user?.worker_profile?.bio || user?.bio || '');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || '');
    const fileInputRef = useRef(null);

    // Location editing
    const [homeLocation, setHomeLocation] = useState(
        user?.lat && user?.lng ? { lat: parseFloat(user.lat), lng: parseFloat(user.lng) } : null
    );
    const [showMapPicker, setShowMapPicker] = useState(false);
    const [locationLabel, setLocationLabel] = useState('');
    const [locating, setLocating] = useState(false);

    // Category editing (workers)
    const [allCategories, setAllCategories] = useState([]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState(
        user?.worker_profile?.category_ids || []
    );

    useEffect(() => {
        setAvatarPreview(user?.avatar_url || '');
    }, [user?.avatar_url]);

    useEffect(() => {
        setWhatsappOptIn(user?.whatsapp_opt_in === true);
    }, [user?.whatsapp_opt_in]);

    useEffect(() => {
        api.get('/categories')
            .then(({ data }) => setAllCategories(dedupeCategories(data.categories || [])))
            .catch(() => { });
    }, []);

    useEffect(() => {
        if (!homeLocation) { setLocationLabel(''); return; }
        api.get(`/locations/reverse-geocode?lat=${homeLocation.lat}&lng=${homeLocation.lng}`)
            .then(({ data }) => {
                const loc = data?.location || {};
                setLocationLabel(
                    [loc.village_name, loc.subdistrict_name, loc.district_name, loc.governorate_name]
                        .filter(Boolean).join('، ') || 'سوريا'
                );
            })
            .catch(() => setLocationLabel('سوريا'));
    }, [homeLocation]);

    const save = async () => {
        setSaving(true);
        setMessage('');
        try {
            await api.put('/users/profile', {
                name,
                phone_visibility: phoneVisibility,
                whatsapp_opt_in: whatsappOptIn,
            });
            if (user?.role === 'worker') {
                await api.put('/workers/profile', { bio, category_ids: selectedCategoryIds });
            }
            if (homeLocation) {
                await api.put('/users/location', { lat: homeLocation.lat, lng: homeLocation.lng });
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

    const useCurrentGPS = () => {
        if (!navigator.geolocation) return;
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                setHomeLocation({ lat: coords.latitude, lng: coords.longitude });
                setLocating(false);
            },
            () => { setLocating(false); alert('تعذر تحديد الموقع'); },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const toggleCategory = (catId) => {
        setSelectedCategoryIds(prev =>
            prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
        );
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
                                    <p className="prof-field-hint" style={{ marginBottom: 8 }}>
                                        هذا الخيار يحدد طريقة تواصل الآخرين معك.
                                    </p>
                                    <div className="prof-visibility-toggle">
                                        <button className={phoneVisibility === 'public' ? 'active' : ''}
                                            onClick={() => setPhoneVisibility('public')}>
                                            <Eye size={16} /> عام (اتصال مباشر)
                                        </button>
                                        <button className={phoneVisibility === 'request_only' ? 'active' : ''}
                                            onClick={() => setPhoneVisibility('request_only')}>
                                            <EyeOff size={16} /> بطلب فقط (طلب اتصال)
                                        </button>
                                    </div>
                                    <div style={{ marginTop: 10 }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={whatsappOptIn}
                                                onChange={(e) => setWhatsappOptIn(e.target.checked)}
                                            />
                                            <span>السماح بإظهار زر واتساب عندما يكون رقم الهاتف عاماً</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Category selection */}
                                <div className="prof-field">
                                    <label className="prof-field-label">المهارات / التخصصات</label>
                                    <div className="prof-category-grid">
                                        {allCategories.map(cat => (
                                            <button key={cat.id}
                                                className={`prof-cat-chip ${selectedCategoryIds.includes(cat.id) ? 'active' : ''}`}
                                                onClick={() => toggleCategory(cat.id)}>
                                                <span>{CATEGORY_ICONS[cat.icon] || '🔧'}</span> {cat.name_ar}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Home location */}
                                <div className="prof-field">
                                    <label className="prof-field-label">
                                        <MapPin size={14} /> موقع المنزل
                                    </label>
                                    <p className="prof-field-hint">هذا الموقع يُستخدم لعرضك في نتائج البحث القريبة. اختر موقع منزلك وليس موقعك الحالي.</p>
                                    {locationLabel && (
                                        <div className="prof-location-label">{locationLabel}</div>
                                    )}
                                    <div className="prof-location-actions">
                                        <button className="btn btn-secondary btn-sm"
                                            onClick={() => setShowMapPicker(!showMapPicker)}>
                                            <MapPin size={14} /> {showMapPicker ? 'إخفاء الخريطة' : 'اختر على الخريطة'}
                                        </button>
                                        <button className="btn btn-secondary btn-sm" onClick={useCurrentGPS} disabled={locating}>
                                            <Navigation size={14} /> {locating ? 'جاري...' : 'استخدم GPS'}
                                        </button>
                                    </div>
                                    {showMapPicker && (
                                        <div className="prof-map-container">
                                            <MapContainer
                                                center={homeLocation ? [homeLocation.lat, homeLocation.lng] : SYRIA_CENTER}
                                                zoom={homeLocation ? 13 : 7}
                                                maxBounds={SYRIA_BOUNDS}
                                                maxBoundsViscosity={1.0}
                                                style={{ height: 250, width: '100%', borderRadius: 12 }}>
                                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                <DraggableMarker position={homeLocation} onMove={setHomeLocation} />
                                                <MapFlyTo center={homeLocation ? [homeLocation.lat, homeLocation.lng] : null} />
                                            </MapContainer>
                                            <p className="prof-map-hint">اضغط على الخريطة لتحديد موقعك</p>
                                        </div>
                                    )}
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
                                    <span>الهاتف: {phoneVisibility === 'public' ? 'عام (اتصال مباشر)' : 'بطلب فقط (طلب اتصال)'}</span>
                                </div>
                                <div className="prof-info-row">
                                    <span className="prof-info-icon"><MessageCircle size={16} /></span>
                                    <span>زر واتساب: {whatsappOptIn ? 'مفعل' : 'غير مفعل'}</span>
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

                {/* Employer: location + phone visibility editing */}
                {user?.role === 'employer' && editing && (
                    <div className="prof-section">
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
                            <div style={{ marginTop: 10 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={whatsappOptIn}
                                        onChange={(e) => setWhatsappOptIn(e.target.checked)}
                                    />
                                    <span>السماح بإظهار زر واتساب عندما يكون رقم الهاتف عاماً</span>
                                </label>
                            </div>
                        </div>
                        <div className="prof-field">
                            <label className="prof-field-label"><MapPin size={14} /> موقع المنزل</label>
                            <p className="prof-field-hint">الموقع يُستخدم للبحث عن العمّال القريبين.</p>
                            {locationLabel && <div className="prof-location-label">{locationLabel}</div>}
                            <div className="prof-location-actions">
                                <button className="btn btn-secondary btn-sm" onClick={() => setShowMapPicker(!showMapPicker)}>
                                    <MapPin size={14} /> {showMapPicker ? 'إخفاء الخريطة' : 'اختر على الخريطة'}
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={useCurrentGPS} disabled={locating}>
                                    <Navigation size={14} /> {locating ? 'جاري...' : 'استخدم GPS'}
                                </button>
                            </div>
                            {showMapPicker && (
                                <div className="prof-map-container">
                                    <MapContainer
                                        center={homeLocation ? [homeLocation.lat, homeLocation.lng] : SYRIA_CENTER}
                                        zoom={homeLocation ? 13 : 7}
                                        maxBounds={SYRIA_BOUNDS} maxBoundsViscosity={1.0}
                                        style={{ height: 250, width: '100%', borderRadius: 12 }}>
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <DraggableMarker position={homeLocation} onMove={setHomeLocation} />
                                        <MapFlyTo center={homeLocation ? [homeLocation.lat, homeLocation.lng] : null} />
                                    </MapContainer>
                                    <p className="prof-map-hint">اضغط على الخريطة لتحديد موقعك</p>
                                </div>
                            )}
                        </div>
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
