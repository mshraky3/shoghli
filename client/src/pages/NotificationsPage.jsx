import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowRight, Bell } from 'lucide-react';

export default function NotificationsPage() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/notifications').then(({ data }) => {
            setNotifications(data.notifications);
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    const markRead = async (id) => {
        await api.put(`/notifications/${id}/read`).catch(() => { });
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    };

    const markAllRead = async () => {
        await api.put('/notifications/read-all').catch(() => { });
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    };

    const getTimeAgo = (date) => {
        const diff = Date.now() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'الآن';
        if (minutes < 60) return `منذ ${minutes} دقيقة`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `منذ ${hours} ساعة`;
        const days = Math.floor(hours / 24);
        return `منذ ${days} يوم`;
    };

    return (
        <div className="page" style={{ paddingBottom: 70 }}>
            <div style={{
                background: 'white', padding: '12px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '1px solid var(--gray-200)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <ArrowRight size={22} />
                    </button>
                    <h1 style={{ fontSize: 18, fontWeight: 700 }}>الإشعارات</h1>
                </div>
                {notifications.some(n => !n.is_read) && (
                    <button onClick={markAllRead} style={{
                        background: 'none', border: 'none', color: 'var(--primary)',
                        cursor: 'pointer', fontFamily: 'Tajawal', fontSize: 14,
                    }}>
                        قراءة الكل
                    </button>
                )}
            </div>

            <div className="container">
                {loading && <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>}

                {!loading && notifications.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 60, color: 'var(--gray-400)' }}>
                        <Bell size={48} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                        <p>لا توجد إشعارات</p>
                    </div>
                )}

                {notifications.map(n => (
                    <div
                        key={n.id}
                        onClick={() => !n.is_read && markRead(n.id)}
                        className="card"
                        style={{
                            marginBottom: 8,
                            background: n.is_read ? 'white' : 'var(--primary-light)',
                            cursor: n.is_read ? 'default' : 'pointer',
                            borderRight: n.is_read ? 'none' : '4px solid var(--primary)',
                        }}
                    >
                        <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{n.title}</h3>
                        <p style={{ color: 'var(--gray-600)', fontSize: 14, marginBottom: 6 }}>{n.body}</p>
                        <p style={{ color: 'var(--gray-400)', fontSize: 12 }}>{getTimeAgo(n.created_at)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
