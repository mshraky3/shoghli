import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Home, PhoneForwarded, Bell, User, Plus, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function BottomNav() {
    const { user } = useAuth();
    const location = useLocation();
    const [unreadCount, setUnreadCount] = useState(0);
    const [pendingRequests, setPendingRequests] = useState(0);

    const fetchBadges = () => {
        api.get('/notifications?unread=true')
            .then(({ data }) => setUnreadCount(data.unread_count))
            .catch(() => { });
        api.get('/call-requests?type=incoming')
            .then(({ data }) => {
                const pending = (data.requests || []).filter(r => r.status === 'pending').length;
                setPendingRequests(pending);
            })
            .catch(() => { });
    };

    useEffect(() => {
        fetchBadges();
        const interval = setInterval(fetchBadges, 15000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible') fetchBadges();
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, []);

    const isActive = (path) => {
        if (path === '/dashboard') return location.pathname === '/dashboard';
        if (path === '/profile') return location.pathname.startsWith('/profile');
        if (path === '/notifications') return location.pathname.startsWith('/notifications');
        if (path === '/requests') return location.pathname.startsWith('/requests');
        return location.pathname === path;
    };

    const items = [
        { path: '/dashboard', icon: Home, label: 'الرئيسية' },
        { path: '/requests', icon: PhoneForwarded, label: 'الطلبات', badge: pendingRequests },
        ...(user?.role === 'employer' ? [{ path: '/job/new', icon: Plus, label: 'إعلان', fab: true }] : []),
        { path: '/notifications', icon: Bell, label: 'الإشعارات', badge: unreadCount },
        { path: '/profile', icon: User, label: 'حسابي' },
    ];

    return (
        <nav className="bottom-nav">
            {items.map(item => {
                const Icon = item.icon;
                const active = isActive(item.path);

                if (item.fab) {
                    return (
                        <Link key={item.path} to={item.path} className="bottom-nav-fab" aria-label={item.label}>
                            <Icon size={22} />
                        </Link>
                    );
                }

                return (
                    <Link key={item.path} to={item.path}
                        className={`bottom-nav-item ${active ? 'active' : ''}`}
                        aria-current={active ? 'page' : undefined}>
                        <div className="bottom-nav-icon-wrap">
                            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                            {item.badge > 0 && (
                                <span className="bottom-nav-badge">{item.badge > 99 ? '99+' : item.badge}</span>
                            )}
                        </div>
                        <span>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
