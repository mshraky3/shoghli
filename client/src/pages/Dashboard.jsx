import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Bell, User, MapPin, Phone, PhoneForwarded, Search, Plus, List, Map as MapIcon } from 'lucide-react';

// Fix leaflet default marker icon
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
    const navigate = useNavigate();
    const [workers, setWorkers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [radius, setRadius] = useState('district');
    const [viewMode, setViewMode] = useState('map');
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isAvailable, setIsAvailable] = useState(user?.is_active !== false);

    const center = user?.lat && user?.lng ? [user.lat, user.lng] : SYRIA_CENTER;

    useEffect(() => {
        api.get('/categories').then(({ data }) => setCategories(data.categories)).catch(console.error);
        api.get('/notifications?unread=true').then(({ data }) => setUnreadCount(data.unread_count)).catch(console.error);

        // Poll notifications every 30s
        const interval = setInterval(() => {
            api.get('/notifications?unread=true').then(({ data }) => setUnreadCount(data.unread_count)).catch(() => { });
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const searchWorkers = useCallback(async () => {
        if (!user?.lat || !user?.lng) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({
                lat: user.lat, lng: user.lng, radius,
            });
            if (selectedCategory) params.append('category_id', selectedCategory);
            const { data } = await api.get(`/workers/nearby?${params}`);
            setWorkers(data.workers);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    }, [user, radius, selectedCategory]);

    useEffect(() => {
        if (user?.role === 'employer') searchWorkers();
    }, [searchWorkers, user?.role]);

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
                alert(`رقم الهاتف: ${data.phone}`);
            } else {
                alert('تم إرسال طلب الاتصال بنجاح');
            }
        } catch (err) {
            alert(err.response?.data?.error || 'حدث خطأ');
        }
    };

    const getCategoryName = (catId) => {
        const cat = categories.find(c => c.id === catId);
        return cat?.name_ar || '';
    };

    return (
        <div className="page" style={{ paddingBottom: 70 }}>
            {/* Top Bar */}
            <div style={{
                background: 'white', padding: '12px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '1px solid var(--gray-200)', position: 'relative', zIndex: 1001,
            }}>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>شغلي</h1>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {user?.role === 'worker' && (
                        <button
                            onClick={toggleAvailability}
                            className={`badge ${isAvailable ? 'badge-success' : 'badge-danger'}`}
                            style={{ cursor: 'pointer', border: 'none', padding: '6px 12px', fontSize: 13 }}
                        >
                            {isAvailable ? 'متاح ✓' : 'غير متاح'}
                        </button>
                    )}
                    <Link to="/notifications" style={{ position: 'relative', color: 'var(--gray-600)' }}>
                        <Bell size={22} />
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute', top: -6, right: -6,
                                background: 'var(--danger)', color: 'white',
                                fontSize: 10, minWidth: 16, height: 16,
                                borderRadius: 8, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', padding: '0 3px',
                            }}>
                                {unreadCount}
                            </span>
                        )}
                    </Link>
                </div>
            </div>

            {/* Employer: Filters */}
            {user?.role === 'employer' && (
                <div style={{
                    background: 'white', padding: '10px 16px',
                    borderBottom: '1px solid var(--gray-200)',
                    display: 'flex', gap: 8, alignItems: 'center',
                    overflowX: 'auto', position: 'relative', zIndex: 1001,
                }}>
                    <select
                        className="input"
                        style={{ width: 'auto', minWidth: 140, padding: '8px 12px' }}
                        value={selectedCategory}
                        onChange={e => setSelectedCategory(e.target.value)}
                    >
                        <option value="">كل المهن</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name_ar}</option>
                        ))}
                    </select>
                    <select
                        className="input"
                        style={{ width: 'auto', minWidth: 120, padding: '8px 12px' }}
                        value={radius}
                        onChange={e => setRadius(e.target.value)}
                    >
                        <option value="village">القرية (~3كم)</option>
                        <option value="subdistrict">الناحية (~15كم)</option>
                        <option value="district">المنطقة (~40كم)</option>
                        <option value="governorate">المحافظة (~100كم)</option>
                    </select>
                    <button onClick={searchWorkers} className="btn btn-primary" style={{ padding: '8px 14px', whiteSpace: 'nowrap' }}>
                        <Search size={16} /> بحث
                    </button>
                    <button
                        onClick={() => setViewMode(v => v === 'map' ? 'list' : 'map')}
                        className="btn btn-secondary"
                        style={{ padding: '8px 14px' }}
                    >
                        {viewMode === 'map' ? <List size={16} /> : <MapIcon size={16} />}
                    </button>
                </div>
            )}

            {/* Map View */}
            {viewMode === 'map' ? (
                <div style={{ flex: 1, position: 'relative' }}>
                    <MapContainer
                        center={center}
                        zoom={user?.lat ? 11 : 7}
                        maxBounds={SYRIA_BOUNDS}
                        maxBoundsViscosity={1.0}
                        style={{ height: 'calc(100vh - 130px)', width: '100%' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapController center={user?.lat ? center : null} />

                        {/* My location */}
                        {user?.lat && user?.lng && (
                            <Marker position={[user.lat, user.lng]} icon={myIcon}>
                                <Popup>
                                    <strong>موقعك</strong>
                                </Popup>
                            </Marker>
                        )}

                        {/* Workers */}
                        {workers.map(w => (
                            <Marker key={w.id} position={[w.lat, w.lng]} icon={workerIcon}>
                                <Popup>
                                    <div style={{ minWidth: 180, fontFamily: 'Tajawal', direction: 'rtl' }}>
                                        <strong style={{ fontSize: 15 }}>{w.name || 'عامل'}</strong>
                                        <div style={{ margin: '6px 0', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                            {(w.category_ids || []).map(catId => (
                                                <span key={catId} style={{
                                                    background: '#dbeafe', borderRadius: 12,
                                                    padding: '2px 8px', fontSize: 12,
                                                }}>
                                                    {getCategoryName(catId)}
                                                </span>
                                            ))}
                                        </div>
                                        <p style={{ fontSize: 12, color: '#666', margin: '4px 0' }}>
                                            {w.distance_km} كم
                                            {w.experience_years ? ` • ${w.experience_years} سنوات خبرة` : ''}
                                        </p>
                                        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                                            {w.phone_visibility === 'public' ? (
                                                <button onClick={() => sendCallRequest(w.id)}
                                                    style={{ flex: 1, padding: '6px', background: 'var(--success)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontFamily: 'Tajawal' }}>
                                                    اتصل
                                                </button>
                                            ) : (
                                                <button onClick={() => sendCallRequest(w.id)}
                                                    style={{ flex: 1, padding: '6px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontFamily: 'Tajawal' }}>
                                                    طلب اتصال
                                                </button>
                                            )}
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
            ) : (
                /* List View */
                <div className="container" style={{ flex: 1, paddingTop: 12 }}>
                    {loading && <div style={{ textAlign: 'center', padding: 20 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>}
                    {!loading && workers.length === 0 && (
                        <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray-500)' }}>
                            <MapPin size={48} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                            <p>لا يوجد عمّال قريبين حالياً</p>
                            <p style={{ fontSize: 13, marginTop: 4 }}>جرّب توسيع نطاق البحث</p>
                        </div>
                    )}
                    {workers.map(w => (
                        <div key={w.id} className="worker-card">
                            <div className="avatar">
                                {w.name ? w.name[0] : '؟'}
                            </div>
                            <div className="info">
                                <div className="name">{w.name || 'عامل'}</div>
                                <div className="meta">
                                    {(w.category_ids || []).slice(0, 3).map(catId => (
                                        <span key={catId} className="badge badge-primary">{getCategoryName(catId)}</span>
                                    ))}
                                </div>
                                <div className="distance">
                                    <MapPin size={12} style={{ verticalAlign: 'middle' }} /> {w.distance_km} كم
                                    {w.experience_years ? ` • ${w.experience_years} سنوات خبرة` : ''}
                                    {w.district_name ? ` • ${w.district_name}` : ''}
                                </div>
                                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                    {w.phone_visibility === 'public' ? (
                                        <button onClick={() => sendCallRequest(w.id)} className="btn btn-success" style={{ padding: '6px 14px', fontSize: 13 }}>
                                            <Phone size={14} /> اتصل
                                        </button>
                                    ) : (
                                        <button onClick={() => sendCallRequest(w.id)} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 13 }}>
                                            <PhoneForwarded size={14} /> طلب اتصال
                                        </button>
                                    )}
                                    <Link to={`/profile/${w.id}`} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }}>
                                        الملف الشخصي
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Bottom Nav */}
            <div className="bottom-nav">
                <Link to="/dashboard" className="bottom-nav-item active">
                    <MapIcon size={20} />
                    <span>{user?.role === 'employer' ? 'البحث' : 'الخريطة'}</span>
                </Link>
                {user?.role === 'employer' && (
                    <Link to="/job/new" className="bottom-nav-item">
                        <Plus size={20} />
                        <span>إعلان جديد</span>
                    </Link>
                )}
                <Link to="/requests" className="bottom-nav-item">
                    <PhoneForwarded size={20} />
                    <span>الطلبات</span>
                </Link>
                <Link to="/notifications" className="bottom-nav-item" style={{ position: 'relative' }}>
                    <Bell size={20} />
                    <span>الإشعارات</span>
                    {unreadCount > 0 && <span className="bottom-nav-badge">{unreadCount}</span>}
                </Link>
                <Link to="/profile" className="bottom-nav-item">
                    <User size={20} />
                    <span>حسابي</span>
                </Link>
            </div>
        </div>
    );
}
