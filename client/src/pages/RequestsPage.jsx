import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import BottomNav from '../components/BottomNav';
import { Phone, Check, X, PhoneIncoming, PhoneOutgoing, Clock, CheckCircle, XCircle, Star, MessageCircle } from 'lucide-react';

export default function RequestsPage() {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('incoming');
    const [ratingTarget, setRatingTarget] = useState(null);
    const [ratingScore, setRatingScore] = useState(0);
    const [ratingComment, setRatingComment] = useState('');
    const [ratingLoading, setRatingLoading] = useState(false);

    useEffect(() => {
        loadRequests();
        const interval = setInterval(loadRequests, 10000);
        return () => clearInterval(interval);
    }, [tab]);

    // Refetch when user returns to this tab/window
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible') loadRequests();
        };
        document.addEventListener('visibilitychange', onVisible);
        window.addEventListener('focus', loadRequests);
        return () => {
            document.removeEventListener('visibilitychange', onVisible);
            window.removeEventListener('focus', loadRequests);
        };
    }, [tab]);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/call-requests?type=${tab}`);
            setRequests(data.requests);
        } catch (err) {
            console.error('Failed to load requests:', err);
        } finally {
            setLoading(false);
        }
    };

    const acceptRequest = async (id) => {
        try {
            const { data } = await api.put(`/call-requests/${id}/accept`);
            if (data.phone) alert(`رقم الهاتف: ${data.phone}`);
            else alert('تم القبول');
            loadRequests();
        } catch (err) {
            alert(err.response?.data?.error || 'حدث خطأ');
        }
    };

    const rejectRequest = async (id) => {
        try {
            await api.put(`/call-requests/${id}/reject`);
            loadRequests();
        } catch (err) {
            alert(err.response?.data?.error || 'حدث خطأ');
        }
    };

    const submitRating = async () => {
        if (!ratingScore) return;
        setRatingLoading(true);
        try {
            await api.post('/ratings', {
                to_user_id: ratingTarget.userId,
                call_request_id: ratingTarget.requestId,
                score: ratingScore,
                comment: ratingComment || undefined,
            });
            setRatingTarget(null);
            setRatingScore(0);
            setRatingComment('');
            alert('شكراً لتقييمك!');
        } catch (err) {
            alert(err.response?.data?.error || 'حدث خطأ');
        } finally {
            setRatingLoading(false);
        }
    };

    const getTimeAgo = (date) => {
        const diff = Date.now() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'الآن';
        if (minutes < 60) return `منذ ${minutes} د`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `منذ ${hours} س`;
        const days = Math.floor(hours / 24);
        return `منذ ${days} ي`;
    };

    const statusConfig = {
        pending: { icon: Clock, color: 'var(--primary)', bg: 'var(--primary-light)', label: 'قيد الانتظار' },
        accepted: { icon: CheckCircle, color: 'var(--success)', bg: '#dcfce7', label: 'مقبول' },
        rejected: { icon: XCircle, color: 'var(--danger)', bg: '#fee2e2', label: 'مرفوض' },
    };

    return (
        <div className="dash-page">
            <header className="page-header">
                <h1>طلبات الاتصال</h1>
            </header>

            {/* Tabs */}
            <div className="req-tabs">
                <button className={`req-tab ${tab === 'incoming' ? 'active' : ''}`}
                    onClick={() => setTab('incoming')}>
                    <PhoneIncoming size={16} /> الواردة
                </button>
                <button className={`req-tab ${tab === 'outgoing' ? 'active' : ''}`}
                    onClick={() => setTab('outgoing')}>
                    <PhoneOutgoing size={16} /> الصادرة
                </button>
            </div>

            <main className="page-content">
                {loading && <div className="dash-loading"><div className="spinner" /></div>}

                {!loading && requests.length === 0 && (
                    <div className="dash-empty">
                        <Phone size={48} strokeWidth={1.2} />
                        <p>{tab === 'incoming' ? 'لا توجد طلبات واردة' : 'لا توجد طلبات صادرة'}</p>
                        <span>ستظهر هنا عند وجود طلبات جديدة</span>
                    </div>
                )}

                <div className="req-list">
                    {requests.map(r => {
                        const sc = statusConfig[r.status] || statusConfig.pending;
                        const StatusIcon = sc.icon;
                        const otherName = tab === 'incoming' ? (r.from_name || 'مستخدم') : (r.to_name || 'مستخدم');
                        const otherUserId = tab === 'incoming' ? r.from_user_id : r.to_user_id;
                        const otherAvatar = tab === 'incoming' ? r.from_avatar_url : r.to_avatar_url;

                        return (
                            <div key={r.id} className="req-card">
                                <div className="req-card-top">
                                    <Link to={`/profile/${otherUserId}`} className="req-card-user">
                                        <div className="req-avatar">
                                            {otherAvatar ? (
                                                <img src={otherAvatar} alt={otherName} className="avatar-img-cover" />
                                            ) : (
                                                otherName[0]
                                            )}
                                        </div>
                                        <div className="req-user-info">
                                            <span className="req-user-name">{otherName}</span>
                                            <span className="req-time">{getTimeAgo(r.created_at)}</span>
                                        </div>
                                    </Link>
                                    <div className="req-status" style={{ background: sc.bg, color: sc.color }}>
                                        <StatusIcon size={13} />
                                        {sc.label}
                                    </div>
                                </div>

                                {r.message && <p className="req-message">{r.message}</p>}

                                {/* Accepted → phone + WhatsApp */}
                                {r.status === 'accepted' && r.revealed_phone && (
                                    <div className="req-phone-row">
                                        <a href={`tel:${r.revealed_phone}`} className="req-phone-banner">
                                            <Phone size={16} />
                                            <span style={{ direction: 'ltr' }}>{r.revealed_phone}</span>
                                        </a>
                                        <button className="req-whatsapp-btn"
                                            onClick={() => {
                                                const cleaned = r.revealed_phone.replace(/[^0-9+]/g, '');
                                                const num = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;
                                                window.open(`https://wa.me/${num}`, '_blank');
                                            }}>
                                            <MessageCircle size={16} /> واتساب
                                        </button>
                                    </div>
                                )}

                                {/* Pending incoming → actions */}
                                {tab === 'incoming' && r.status === 'pending' && (
                                    <div className="req-actions">
                                        <button onClick={() => acceptRequest(r.id)} className="req-btn accept">
                                            <Check size={18} /> قبول
                                        </button>
                                        <button onClick={() => rejectRequest(r.id)} className="req-btn reject">
                                            <X size={18} /> رفض
                                        </button>
                                    </div>
                                )}

                                {/* Rate button for accepted requests */}
                                {r.status === 'accepted' && (
                                    <button className="req-rate-btn"
                                        onClick={() => setRatingTarget({ userId: otherUserId, requestId: r.id, name: otherName })}>
                                        <Star size={14} /> قيّم {otherName}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* Rating modal */}
            {ratingTarget && (
                <div className="modal-overlay" onClick={() => setRatingTarget(null)}>
                    <div className="modal-sheet" onClick={e => e.stopPropagation()}>
                        <div className="modal-handle" />
                        <h3 className="modal-title">تقييم {ratingTarget.name}</h3>
                        <div className="rating-stars-input">
                            {[1, 2, 3, 4, 5].map(s => (
                                <button key={s} onClick={() => setRatingScore(s)} className="rating-star-btn">
                                    <Star size={36} fill={s <= ratingScore ? '#f59e0b' : 'none'}
                                        color={s <= ratingScore ? '#f59e0b' : '#d1d5db'} />
                                </button>
                            ))}
                        </div>
                        <textarea className="input" rows={3} placeholder="أضف تعليقاً (اختياري)"
                            value={ratingComment} onChange={e => setRatingComment(e.target.value)}
                            style={{ marginTop: 16, resize: 'none' }} />
                        <button className="btn btn-primary btn-block" style={{ marginTop: 16 }}
                            onClick={submitRating} disabled={!ratingScore || ratingLoading}>
                            {ratingLoading ? 'جاري الإرسال...' : 'إرسال التقييم'}
                        </button>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
}
