import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import BottomNav from '../components/BottomNav';
import {
    MapPin, Phone, PhoneForwarded, Search, List, Map as MapIcon,
    Star, Briefcase, Clock, Navigation, User, LocateFixed
} from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const workerIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const myIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const CATEGORY_ICONS = {
    'zap': '⚡', 'droplets': '🔧', 'truck': '🚚', 'heart-pulse': '🩺',
    'car': '🚗', 'hammer': '🔨', 'paintbrush': '🎨', 'sparkles': '✨',
    'building': '🏗️', 'anvil': '⚒️', 'wrench': '🔩', 'wheat': '🌾',
    'chef-hat': '👨‍🍳', 'scissors': '✂️', 'briefcase': '💼',
};

const SYRIA_BOUNDS = [[32.3, 35.5], [37.4, 42.5]];
const SYRIA_CENTER = [35.0, 38.5];

function MapController({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, 11);
    }, [center, map]);
    return null;
}

export default function Dashboard() {
    const { user } = useAuth();
    const [workers, setWorkers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [radius, setRadius] = useState('district');
    const [viewMode, setViewMode] = useState('list');
    const [loading, setLoading] = useState(false);
    const [isAvailable, setIsAvailable] = useState(user?.is_active !== false);
    const [searchPoint, setSearchPoint] = useState(user?.lat && user?.lng ? { lat: user.lat, lng: user.lng } : null);
    const [locationLabel, setLocationLabel] = useState('موقع غير محدد');
    const [locating, setLocating] = useState(false);

    const center = searchPoint ? [searchPoint.lat, searchPoint.lng] : SYRIA_CENTER;

    const radiusOptions = [
        { v: 'village', l: 'القرية', d: '~3كم' },
        { v: 'subdistrict', l: 'الناحية', d: '~15كم' },
        { v: 'district', l: 'المنطقة', d: '~40كم' },
        { v: 'governorate', l: 'المحافظة', d: '~100كم' },
    ];

    const radiusMeta = radiusOptions.find(r => r.v === radius) || radiusOptions[2];

    useEffect(() => {
        api.get('/categories').then(({ data }) => setCategories(data.categories || [])).catch(() => { });
    }, []);

    useEffect(() => {
        if (!searchPoint) return;
        api.get(`/locations/reverse-geocode?lat=${searchPoint.lat}&lng=${searchPoint.lng}`)
            .then(({ data }) => {
                const loc = data?.location || {};
                const label = [loc.village_name, loc.subdistrict_name, loc.district_name, loc.governorate_name]
                    .filter(Boolean)
                    .join('، ');
                setLocationLabel(label || 'سوريا');
            })
            .catch(() => setLocationLabel('سوريا'));
    }, [searchPoint]);

    const searchWorkers = useCallback(async () => {
        if (!searchPoint?.lat || !searchPoint?.lng) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ lat: searchPoint.lat, lng: searchPoint.lng, radius });
            if (selectedCategory) params.append('category_id', selectedCategory);
            const { data } = await api.get(`/workers/nearby?${params}`);
            setWorkers(data.workers);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    }, [searchPoint, radius, selectedCategory]);

    useEffect(() => {
        if (user?.role === 'employer') searchWorkers();
    }, [searchWorkers, user?.role]);

    const refreshSearchLocation = () => {
        if (!navigator.geolocation) return;

        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            async ({ coords }) => {
                const nextPoint = { lat: coords.latitude, lng: coords.longitude };
                setSearchPoint(nextPoint);
                try {
                    await api.put('/users/location', {
                        lat: nextPoint.lat,
                        lng: nextPoint.lng,
                    });
                } catch (err) {
                    console.error('Location update failed:', err);
                } finally {
                    setLocating(false);
                }
            },
            () => setLocating(false),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const toggleAvailability = async () => {
        try {
            const newStatus = !isAvailable;
            await api.put('/workers/availability', { is_active: newStatus });
            setIsAvailable(newStatus);
        } catch (err) {
            console.error('Toggle failed:', err);
        }
    };

    const sendCallRequest = async (toUserId) => {
        try {
            const { data } = await api.post('/call-requests', { to_user_id: toUserId });
            if (data.direct) {
                // Phone is public — show directly, no request needed
                const callNow = confirm(`رقم الهاتف: ${data.phone}\n\nرقم الهاتف متاح مباشرة. هل تريد الاتصال الآن؟`);
                if (callNow) window.location.href = `tel:${data.phone}`;
            } else if (data.callRequest) {
                alert('✓ تم إرسال طلب الاتصال بنجاح\nسيصل إشعار للعامل وسيظهر الطلب في صفحة الطلبات');
            }
        } catch (err) {
            const rd = err.response?.data;
            console.error('call-request error payload:', rd);
            const msg = rd?.error
                || (rd?.errors && rd.errors.map(e => e.msg).join(', '))
                || 'حدث خطأ في إرسال الطلب';
            alert(msg);
        }
    };

    const getCategoryName = (catId) => {
        const cat = categories.find(c => c.id === catId);
        return cat?.name_ar || '';
    };

    const getCategoryIcon = (catId) => {
        const cat = categories.find(c => c.id === catId);
        return CATEGORY_ICONS[cat?.icon] || '🔧';
    };

    const renderStars = (rating) => {
        const stars = [];
        const r = parseFloat(rating) || 0;
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Star key={i} size={12} fill={i <= r ? '#f59e0b' : 'none'}
                    color={i <= r ? '#f59e0b' : '#d1d5db'} strokeWidth={2} />
            );
        }
        return stars;
    };

    return (
        <div className="dash-page">
            {/* Header */}
            <header className="dash-header">
                <div className="dash-header-top">
                    <h1 className="dash-logo">شغلي</h1>
                    <div className="dash-header-actions">
                        {user?.role === 'worker' && (
                            <button onClick={toggleAvailability}
                                className={`dash-status-pill ${isAvailable ? 'available' : 'unavailable'}`}>
                                <span className="dash-status-dot" />
                                {isAvailable ? 'متاح' : 'غير متاح'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Employer: Category scroll + filters */}
                {user?.role === 'employer' && searchPoint && (
                    <>
                        <div className="dash-category-scroll">
                            <button
                                className={`dash-cat-chip ${!selectedCategory ? 'active' : ''}`}
                                onClick={() => setSelectedCategory('')}>
                                الكل
                            </button>
                            {categories.map(cat => (
                                <button key={cat.id}
                                    className={`dash-cat-chip ${selectedCategory == cat.id ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory(selectedCategory == cat.id ? '' : String(cat.id))}>
                                    <span>{CATEGORY_ICONS[cat.icon] || '🔧'}</span> {cat.name_ar}
                                </button>
                            ))}
                        </div>
                        <div className="dash-toolbar">
                            <div className="dash-filter-btn static">
                                <MapPin size={14} /> {radiusMeta.l}
                            </div>
                            <div className="dash-view-toggle">
                                <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>
                                    <List size={16} />
                                </button>
                                <button className={viewMode === 'map' ? 'active' : ''} onClick={() => setViewMode('map')}>
                                    <MapIcon size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="dash-selection-panel">
                            <div className="dash-selection-head">
                                <span className="dash-selection-label">منطقة البحث:</span>
                                <span className="dash-selection-value">{locationLabel}</span>
                                <button className="dash-selection-refresh" onClick={refreshSearchLocation} disabled={locating}>
                                    <Navigation size={13} /> {locating ? 'جاري التحديث...' : 'تحديث الموقع'}
                                </button>
                            </div>
                            <div className="dash-radius-bar">
                                {radiusOptions.map(r => (
                                    <button key={r.v}
                                        className={`dash-radius-option ${radius === r.v ? 'active' : ''}`}
                                        onClick={() => setRadius(r.v)}>
                                        {r.l}
                                        <span className="dash-radius-desc">{r.d}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Worker: welcome */}
                {user?.role === 'worker' && (
                    <div className="dash-welcome">
                        <p className="dash-welcome-text">مرحباً <strong>{user?.name || 'بك'}</strong></p>
                        <p className="dash-welcome-sub">تحكّم بحالتك ليراك أصحاب العمل القريبين</p>
                    </div>
                )}
            </header>

            {/* Content */}
            <main className="dash-content">
                {user?.role === 'employer' && viewMode === 'map' ? (
                    <div className="dash-map-wrap">
                        <MapContainer center={center} zoom={user?.lat ? 11 : 7}
                            maxBounds={SYRIA_BOUNDS} maxBoundsViscosity={1.0}
                            style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <MapController center={user?.lat ? center : null} />
                            {user?.lat && user?.lng && (
                                <Marker position={[user.lat, user.lng]} icon={myIcon}>
                                    <Popup><strong>موقعك</strong></Popup>
                                </Marker>
                            )}
                            {workers.map(w => (
                                <Marker key={w.id} position={[w.lat, w.lng]} icon={workerIcon}>
                                    <Popup>
                                        <div style={{ minWidth: 180, fontFamily: 'Tajawal', direction: 'rtl' }}>
                                            <strong>{w.name || 'عامل'}</strong>
                                            <div style={{ margin: '6px 0', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                {(w.category_ids || []).map(catId => (
                                                    <span key={catId} style={{ background: '#dbeafe', borderRadius: 12, padding: '2px 8px', fontSize: 12 }}>
                                                        {getCategoryName(catId)}
                                                    </span>
                                                ))}
                                            </div>
                                            <p style={{ fontSize: 12, color: '#666', margin: '4px 0' }}>{w.distance_km} كم</p>
                                            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                                                <button onClick={() => sendCallRequest(w.id)}
                                                    style={{ flex: 1, padding: '6px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontFamily: 'Tajawal' }}>
                                                    {w.phone_visibility === 'public' ? 'اتصل' : 'طلب اتصال'}
                                                </button>
                                                <Link to={`/profile/${w.id}`}
                                                    style={{ padding: '6px 10px', background: 'var(--gray-200)', borderRadius: 6, color: 'var(--gray-700)', textDecoration: 'none', fontSize: 13, fontFamily: 'Tajawal' }}>
                                                    الملف
                                                </Link>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>
                ) : user?.role === 'employer' ? (
                    <div className="dash-list">
                        {loading && <div className="dash-loading"><div className="spinner" /></div>}
                        {!loading && workers.length === 0 && (
                            <div className="dash-empty">
                                <Search size={48} strokeWidth={1.2} />
                                <p>لا يوجد عمّال قريبين</p>
                                <span>جرّب توسيع نطاق البحث أو تغيير الفئة</span>
                            </div>
                        )}
                        {workers.map(w => (
                            <div key={w.id} className="wcard">
                                <Link to={`/profile/${w.id}`} className="wcard-main">
                                    <div className="wcard-avatar">
                                        {w.avatar_url ? (
                                            <img src={w.avatar_url} alt={w.name || 'عامل'} className="avatar-img-cover" />
                                        ) : (
                                            <User size={22} strokeWidth={1.8} />
                                        )}
                                    </div>
                                    <div className="wcard-info">
                                        <div className="wcard-name-row">
                                            <span className="wcard-name">{w.name || 'عامل'}</span>
                                            {w.avg_rating > 0 && (
                                                <span className="wcard-rating">
                                                    <Star size={12} fill="#f59e0b" color="#f59e0b" />
                                                    {parseFloat(w.avg_rating).toFixed(1)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="wcard-tags">
                                            {(w.category_ids || []).slice(0, 3).map(catId => (
                                                <span key={catId} className="wcard-tag">
                                                    {getCategoryIcon(catId)} {getCategoryName(catId)}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="wcard-meta">
                                            <span><MapPin size={12} /> {w.distance_km} كم</span>
                                            {w.district_name && <span>{w.district_name}</span>}
                                        </div>
                                    </div>
                                </Link>
                                <div className="wcard-actions">
                                    <button onClick={(e) => { e.stopPropagation(); sendCallRequest(w.id); }}
                                        className={`wcard-btn ${w.phone_visibility === 'public' ? 'call' : 'request'}`}>
                                        {w.phone_visibility === 'public' ? <><Phone size={15} /> اتصل</> : <><PhoneForwarded size={15} /> طلب اتصال</>}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Worker view */
                    <div className="dash-worker-home">
                        <div className="dash-avail-card" onClick={toggleAvailability}>
                            <div className={`dash-avail-indicator ${isAvailable ? 'on' : 'off'}`}>
                                <div className="dash-avail-circle" />
                            </div>
                            <div>
                                <h3>{isAvailable ? 'أنت متاح للعمل' : 'أنت غير متاح حالياً'}</h3>
                                <p>{isAvailable ? 'أصحاب العمل يمكنهم رؤيتك والتواصل معك' : 'اضغط هنا لتصبح متاحاً ويراك أصحاب العمل'}</p>
                            </div>
                        </div>

                        <div className="dash-worker-stats">
                            <div className="dash-stat-card">
                                <Briefcase size={22} color="var(--primary)" />
                                <span className="dash-stat-num">{user?.worker_profile?.category_ids?.length || 0}</span>
                                <span className="dash-stat-label">مهارة</span>
                            </div>
                            <div className="dash-stat-card">
                                <Star size={22} color="#f59e0b" />
                                <span className="dash-stat-num">{user?.avg_rating ? parseFloat(user.avg_rating).toFixed(1) : '—'}</span>
                                <span className="dash-stat-label">التقييم</span>
                            </div>
                            <div className="dash-stat-card">
                                <Clock size={22} color="var(--success)" />
                                <span className="dash-stat-num">{user?.worker_profile?.work_days?.length || 0}</span>
                                <span className="dash-stat-label">يوم/أسبوع</span>
                            </div>
                        </div>

                        <div className="dash-tip-card">
                            <h4>نصائح لزيادة فرصك</h4>
                            <ul>
                                <li>أكمل ملفك الشخصي بالكامل</li>
                                <li>أضف وصفاً تفصيلياً لخبراتك</li>
                                <li>كن متاحاً في أوقات الذروة</li>
                                <li>رد بسرعة على طلبات الاتصال</li>
                            </ul>
                        </div>
                    </div>
                )}
            </main>

            {/* Location required overlay for employers */}
            {user?.role === 'employer' && !searchPoint && (
                <div className="modal-overlay" style={{ alignItems: 'center' }}>
                    <div className="dash-location-popup">
                        <div className="dash-location-popup-icon">
                            <LocateFixed size={48} strokeWidth={1.5} />
                        </div>
                        <h2>حدّد موقعك أولاً</h2>
                        <p>لعرض العمّال القريبين منك، نحتاج الوصول إلى موقعك الحالي</p>
                        <button
                            className="btn btn-primary btn-lg btn-block"
                            onClick={refreshSearchLocation}
                            disabled={locating}
                            style={{ marginTop: 8 }}>
                            <Navigation size={18} />
                            {locating ? 'جاري تحديد الموقع...' : 'تحديث الموقع'}
                        </button>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
}
