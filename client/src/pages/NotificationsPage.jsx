import { useState, useEffect } from 'react';
import api from '../services/api';
import BottomNav from '../components/BottomNav';
import { Bell, Phone, CheckCircle, Star, AlertTriangle, CheckCheck } from 'lucide-react';

const NOTIF_ICONS = {
    call_request_received: { icon: Phone, color: 'var(--primary)', bg: 'var(--primary-light)' },
    call_request_accepted: { icon: CheckCircle, color: 'var(--success)', bg: '#dcfce7' },
    call_request_rejected: { icon: AlertTriangle, color: 'var(--danger)', bg: '#fee2e2' },
    rating_received: { icon: Star, color: '#f59e0b', bg: '#fef3c7' },
    report: { icon: AlertTriangle, color: 'var(--danger)', bg: '#fee2e2' },
    default: { icon: Bell, color: 'var(--gray-500)', bg: 'var(--gray-100)' },
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/notifications').then(({ data }) => {
            setNotifications(data.notifications);
        }).catch(() => { }).finally(() => setLoading(false));
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
        if (days < 7) return `منذ ${days} يوم`;
        return `منذ ${Math.floor(days / 7)} أسبوع`;
    };

    const groupNotifications = (notifs) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const groups = { today: [], yesterday: [], earlier: [] };
        notifs.forEach(n => {
            const d = new Date(n.created_at);
            d.setHours(0, 0, 0, 0);
            if (d.getTime() >= today.getTime()) groups.today.push(n);
            else if (d.getTime() >= yesterday.getTime()) groups.yesterday.push(n);
            else groups.earlier.push(n);
        });
        return groups;
    };

    const groups = groupNotifications(notifications);
    const hasUnread = notifications.some(n => !n.is_read);

    const renderGroup = (label, items) => {
        if (!items.length) return null;
        return (
            <div className="notif-group">
                <div className="notif-group-label">{label}</div>
                {items.map(n => {
                    const config = NOTIF_ICONS[n.type] || NOTIF_ICONS.default;
                    const Icon = config.icon;
                    return (
                        <div key={n.id}
                            onClick={() => !n.is_read && markRead(n.id)}
                            className={`notif-card ${!n.is_read ? 'unread' : ''}`}>
                            <div className="notif-icon-wrap" style={{ background: config.bg }}>
                                <Icon size={18} color={config.color} />
                            </div>
                            <div className="notif-body">
                                <p className="notif-title">{n.title}</p>
                                <p className="notif-text">{n.body}</p>
                                <p className="notif-time">{getTimeAgo(n.created_at)}</p>
                            </div>
                            {!n.is_read && <div className="notif-dot" />}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="dash-page">
            <header className="page-header">
                <h1>الإشعارات</h1>
                {hasUnread && (
                    <button onClick={markAllRead} className="page-header-action">
                        <CheckCheck size={18} /> قراءة الكل
                    </button>
                )}
            </header>

            <main className="page-content">
                {loading && <div className="dash-loading"><div className="spinner" /></div>}

                {!loading && notifications.length === 0 && (
                    <div className="dash-empty">
                        <Bell size={48} strokeWidth={1.2} />
                        <p>لا توجد إشعارات</p>
                        <span>ستظهر هنا عند وجود تحديثات جديدة</span>
                    </div>
                )}

                {renderGroup('اليوم', groups.today)}
                {renderGroup('أمس', groups.yesterday)}
                {renderGroup('سابقاً', groups.earlier)}
            </main>

            <BottomNav />
        </div>
    );
}
