import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ArrowRight, Phone, Check, X } from 'lucide-react';

export default function RequestsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('incoming');

    useEffect(() => {
        loadRequests();
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
            alert(data.phone ? `رقم الهاتف: ${data.phone}` : 'تم القبول');
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

    const getStatusBadge = (status) => {
        const map = {
            pending: { class: 'badge-primary', label: 'قيد الانتظار' },
            accepted: { class: 'badge-success', label: 'مقبول' },
            rejected: { class: 'badge-danger', label: 'مرفوض' },
        };
        const m = map[status] || map.pending;
        return <span className={`badge ${m.class}`}>{m.label}</span>;
    };

    return (
        <div className="page" style={{ paddingBottom: 70 }}>
            <div style={{
                background: 'white', padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                borderBottom: '1px solid var(--gray-200)',
            }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <ArrowRight size={22} />
                </button>
                <h1 style={{ fontSize: 18, fontWeight: 700 }}>طلبات الاتصال</h1>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex', background: 'white',
                borderBottom: '1px solid var(--gray-200)',
            }}>
                {['incoming', 'outgoing'].map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        style={{
                            flex: 1, padding: '12px', border: 'none', background: 'none',
                            fontFamily: 'Tajawal', fontSize: 15, fontWeight: tab === t ? 700 : 400,
                            color: tab === t ? 'var(--primary)' : 'var(--gray-500)',
                            borderBottom: tab === t ? '3px solid var(--primary)' : '3px solid transparent',
                            cursor: 'pointer',
                        }}
                    >
                        {t === 'incoming' ? 'الواردة' : 'الصادرة'}
                    </button>
                ))}
            </div>

            <div className="container">
                {loading && <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>}

                {!loading && requests.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 60, color: 'var(--gray-400)' }}>
                        <Phone size={48} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                        <p>لا توجد طلبات</p>
                    </div>
                )}

                {requests.map(r => (
                    <div key={r.id} className="card" style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <strong style={{ fontSize: 15 }}>
                                {tab === 'incoming' ? (r.from_name || 'مستخدم') : (r.to_name || 'مستخدم')}
                            </strong>
                            {getStatusBadge(r.status)}
                        </div>

                        {r.message && <p style={{ color: 'var(--gray-600)', fontSize: 14, marginBottom: 8 }}>{r.message}</p>}

                        {/* Pending incoming → show accept/reject */}
                        {tab === 'incoming' && r.status === 'pending' && (
                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                <button onClick={() => acceptRequest(r.id)} className="btn btn-success" style={{ flex: 1, padding: '8px', fontSize: 14 }}>
                                    <Check size={16} /> قبول
                                </button>
                                <button onClick={() => rejectRequest(r.id)} className="btn btn-danger" style={{ flex: 1, padding: '8px', fontSize: 14 }}>
                                    <X size={16} /> رفض
                                </button>
                            </div>
                        )}

                        {/* Accepted → show phone if in data */}
                        {r.status === 'accepted' && r.data?.phone && (
                            <div style={{ marginTop: 8, padding: '8px 12px', background: '#f0fdf4', borderRadius: 8 }}>
                                <a href={`tel:${r.data.phone}`} style={{ color: 'var(--success)', fontWeight: 700, direction: 'ltr', display: 'inline-block' }}>
                                    📞 {r.data.phone}
                                </a>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
