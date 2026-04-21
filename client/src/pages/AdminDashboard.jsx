import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { API_BASE_URL } from '../services/api';

function adminFetch(path, token, options = {}) {
    return fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...options.headers,
        },
    }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'خطأ');
        return data;
    });
}

export default function AdminDashboard() {
    const [token, setToken] = useState(() => sessionStorage.getItem('adminToken') || '');

    const [tab, setTab] = useState('stats');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [usersPagination, setUsersPagination] = useState({});
    const [usersSearch, setUsersSearch] = useState('');
    const [usersRole, setUsersRole] = useState('');
    const [usersBlocked, setUsersBlocked] = useState('');
    const [usersPage, setUsersPage] = useState(1);
    const [reports, setReports] = useState([]);
    const [reportsStatus, setReportsStatus] = useState('pending');
    const [loading, setLoading] = useState(false);
    const [actionMsg, setActionMsg] = useState('');

    const logout = useCallback(() => {
        sessionStorage.removeItem('adminToken');
        setToken('');
    }, []);

    const loadStats = useCallback(async () => {
        if (!token) return;
        try {
            const data = await adminFetch('/admin/stats', token);
            setStats(data);
        } catch (err) {
            if (err.message.includes('مصرح') || err.message.includes('صلاحية')) logout();
        }
    }, [token, logout]);

    const loadUsers = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: usersPage, limit: 20 });
            if (usersSearch) params.set('search', usersSearch);
            if (usersRole) params.set('role', usersRole);
            if (usersBlocked) params.set('blocked', usersBlocked);
            const data = await adminFetch(`/admin/users?${params}`, token);
            setUsers(data.users);
            setUsersPagination(data.pagination);
        } catch (err) {
            if (err.message.includes('مصرح') || err.message.includes('صلاحية')) logout();
        } finally {
            setLoading(false);
        }
    }, [token, usersPage, usersSearch, usersRole, usersBlocked, logout]);

    const loadReports = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const data = await adminFetch(`/admin/reports?status=${reportsStatus}`, token);
            setReports(data.reports);
        } catch (err) {
            if (err.message.includes('مصرح') || err.message.includes('صلاحية')) logout();
        } finally {
            setLoading(false);
        }
    }, [token, reportsStatus, logout]);

    useEffect(() => {
        if (tab === 'stats') loadStats();
        if (tab === 'users') loadUsers();
        if (tab === 'reports') loadReports();
    }, [tab, loadStats, loadUsers, loadReports]);

    const blockUser = async (id, reason) => {
        try {
            await adminFetch(`/admin/users/${id}/block`, token, {
                method: 'PUT',
                body: JSON.stringify({ reason }),
            });
            setActionMsg('تم حظر المستخدم');
            loadUsers();
        } catch (err) {
            setActionMsg(err.message);
        }
        setTimeout(() => setActionMsg(''), 3000);
    };

    const unblockUser = async (id) => {
        try {
            await adminFetch(`/admin/users/${id}/unblock`, token, { method: 'PUT' });
            setActionMsg('تم إلغاء الحظر');
            loadUsers();
        } catch (err) {
            setActionMsg(err.message);
        }
        setTimeout(() => setActionMsg(''), 3000);
    };

    const deleteUser = async (id, name) => {
        if (!window.confirm(`هل أنت متأكد من حذف المستخدم "${name || 'بدون اسم'}"؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
        try {
            await adminFetch(`/admin/users/${id}`, token, { method: 'DELETE' });
            setActionMsg('تم حذف المستخدم');
            loadUsers();
        } catch (err) {
            setActionMsg(err.message);
        }
        setTimeout(() => setActionMsg(''), 3000);
    };

    const updateReportStatus = async (id, status) => {
        try {
            await adminFetch(`/admin/reports/${id}/status`, token, {
                method: 'PUT',
                body: JSON.stringify({ status }),
            });
            setActionMsg('تم تحديث البلاغ');
            loadReports();
        } catch (err) {
            setActionMsg(err.message);
        }
        setTimeout(() => setActionMsg(''), 3000);
    };

    // Admin access is handled in AuthPage (1810 + password)
    if (!token) {
        return <Navigate to="/auth" replace />;
    }

    const roleLabel = (r) => r === 'worker' ? 'عامل' : r === 'employer' ? 'صاحب عمل' : r || '—';
    const reasonLabel = (r) => ({ inappropriate: 'محتوى غير لائق', fake: 'حساب مزيف', dating: 'مواعدة', spam: 'سبام', harassment: 'تحرش', other: 'أخرى' }[r] || r);
    const jobsStatusLabel = (s) => ({ active: 'نشطة', filled: 'مكتملة', cancelled: 'ملغاة' }[s] || s);
    const requestsStatusLabel = (s) => ({ pending: 'معلقة', accepted: 'مقبولة', rejected: 'مرفوضة' }[s] || s);
    const reportsStatusLabel = (s) => ({ pending: 'معلقة', reviewed: 'قيد المراجعة', resolved: 'محلولة', dismissed: 'مرفوضة' }[s] || s);

    const signupMax = Math.max(1, ...(stats?.recentSignups || []).map((d) => d.count));
    const jobsStatusTotal = Math.max(1, (stats?.jobsByStatus || []).reduce((sum, item) => sum + item.count, 0));
    const requestsStatusTotal = Math.max(1, (stats?.requestsByStatus || []).reduce((sum, item) => sum + item.count, 0));
    const reportsStatusTotal = Math.max(1, (stats?.reportsByStatus || []).reduce((sum, item) => sum + item.count, 0));

    return (
        <div style={{ minHeight: '100vh', background: '#f1f5f9', direction: 'rtl' }}>
            {/* Header */}
            <div style={{ background: 'white', padding: '14px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>لوحة تحكم شغلي</h1>
                <button onClick={logout} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                    خروج
                </button>
            </div>

            {actionMsg && (
                <div style={{ background: '#dcfce7', color: '#166534', padding: '10px 24px', textAlign: 'center', fontSize: 14 }}>
                    {actionMsg}
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, background: 'white', borderBottom: '1px solid #e2e8f0' }}>
                {[
                    { key: 'stats', label: 'إحصائيات' },
                    { key: 'users', label: 'المستخدمون' },
                    { key: 'reports', label: 'البلاغات' },
                ].map((t) => (
                    <button key={t.key} onClick={() => setTab(t.key)} style={{
                        padding: '14px 28px', border: 'none', background: tab === t.key ? '#2563eb' : 'transparent',
                        color: tab === t.key ? 'white' : '#64748b', fontWeight: 600, fontSize: 15, cursor: 'pointer',
                        borderBottom: tab === t.key ? '3px solid #2563eb' : '3px solid transparent',
                    }}>
                        {t.label}
                    </button>
                ))}
            </div>

            <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
                {/* Stats */}
                {tab === 'stats' && stats && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
                            {[
                                { label: 'إجمالي المستخدمين', value: stats.totalUsers, color: '#2563eb' },
                                { label: 'العمال', value: stats.totalWorkers, color: '#16a34a' },
                                { label: 'أصحاب العمل', value: stats.totalEmployers, color: '#7c3aed' },
                                { label: 'الوظائف النشطة', value: stats.activeJobs, color: '#ea580c' },
                                { label: 'بلاغات معلقة', value: stats.pendingReports, color: '#dc2626' },
                                { label: 'طلبات التواصل', value: stats.totalRequests, color: '#0891b2' },
                                { label: 'محظورون', value: stats.blockedUsers, color: '#991b1b' },
                                { label: 'جدد هذا الأسبوع', value: stats.newThisWeek, color: '#059669' },
                                { label: 'جدد هذا الشهر', value: stats.newThisMonth, color: '#0f766e' },
                                { label: 'مكتملو الإعداد', value: stats.onboardingCompleted, color: '#4338ca' },
                            ].map((s) => (
                                <div key={s.label} style={{ background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                                    <p style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>{s.label}</p>
                                    <p style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value ?? '—'}</p>
                                </div>
                            ))}
                        </div>

                        {/* Signups Trend */}
                        {stats.recentSignups?.length > 0 && (
                            <div style={{ background: 'white', borderRadius: 12, padding: 20, marginTop: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14, color: '#1e293b' }}>تسجيل المستخدمين خلال آخر ٧ أيام</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 8, alignItems: 'end', height: 170 }}>
                                    {stats.recentSignups.map((d) => (
                                        <div key={d.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 12, color: '#334155', fontWeight: 700 }}>{d.count}</span>
                                            <div style={{ width: '100%', maxWidth: 46, borderRadius: 8, background: '#dbeafe', height: `${Math.max(8, (d.count / signupMax) * 110)}px`, transition: 'height .4s ease' }} />
                                            <span style={{ fontSize: 11, color: '#64748b' }}>{new Date(d.day).toLocaleDateString('ar', { weekday: 'short' })}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 16 }}>
                            <div style={{ background: 'white', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#1e293b' }}>توزيع الوظائف حسب الحالة</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {(stats.jobsByStatus || []).map((item) => (
                                        <div key={item.status}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13, color: '#475569' }}>
                                                <span>{jobsStatusLabel(item.status)}</span>
                                                <strong>{item.count}</strong>
                                            </div>
                                            <div style={{ height: 10, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${(item.count / jobsStatusTotal) * 100}%`, background: '#2563eb' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ background: 'white', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#1e293b' }}>توزيع طلبات التواصل</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {(stats.requestsByStatus || []).map((item) => (
                                        <div key={item.status}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13, color: '#475569' }}>
                                                <span>{requestsStatusLabel(item.status)}</span>
                                                <strong>{item.count}</strong>
                                            </div>
                                            <div style={{ height: 10, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${(item.count / requestsStatusTotal) * 100}%`, background: '#0891b2' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {(stats.reportsByStatus || []).length > 0 && (
                            <div style={{ background: 'white', borderRadius: 12, padding: 20, marginTop: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#1e293b' }}>توزيع البلاغات حسب الحالة</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {stats.reportsByStatus.map((item) => (
                                        <span key={item.status} style={{ background: '#fee2e2', color: '#991b1b', padding: '6px 12px', borderRadius: 999, fontSize: 13, fontWeight: 600 }}>
                                            {reportsStatusLabel(item.status)}: {item.count}
                                        </span>
                                    ))}
                                </div>
                                <div style={{ marginTop: 12, height: 10, borderRadius: 999, background: '#fee2e2', overflow: 'hidden', display: 'flex' }}>
                                    {(stats.reportsByStatus || []).map((item) => (
                                        <div
                                            key={`seg-${item.status}`}
                                            style={{
                                                width: `${(item.count / reportsStatusTotal) * 100}%`,
                                                background: item.status === 'resolved' ? '#16a34a' : item.status === 'reviewed' ? '#0ea5e9' : item.status === 'dismissed' ? '#64748b' : '#dc2626',
                                            }}
                                            title={`${reportsStatusLabel(item.status)}: ${item.count}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* By Governorate */}
                        {stats.byGovernorate?.length > 0 && (
                            <div style={{ background: 'white', borderRadius: 12, padding: 20, marginTop: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#1e293b' }}>المستخدمون حسب المحافظة</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {stats.byGovernorate.map((g, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <span style={{ minWidth: 100, fontSize: 14, color: '#475569' }}>{g.name}</span>
                                            <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 8, height: 24, overflow: 'hidden' }}>
                                                <div style={{
                                                    height: '100%', borderRadius: 8,
                                                    background: 'linear-gradient(90deg, #2563eb, #60a5fa)',
                                                    width: `${Math.min(100, (g.count / (stats.totalUsers || 1)) * 100)}%`,
                                                    transition: 'width 0.5s',
                                                }} />
                                            </div>
                                            <span style={{ minWidth: 40, textAlign: 'center', fontSize: 14, fontWeight: 600 }}>{g.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Top Categories */}
                        {stats.topCategories?.length > 0 && (
                            <div style={{ background: 'white', borderRadius: 12, padding: 20, marginTop: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#1e293b' }}>أكثر التخصصات طلباً</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {stats.topCategories.map((c, i) => (
                                        <span key={i} style={{
                                            background: '#eff6ff', color: '#1d4ed8', padding: '6px 14px',
                                            borderRadius: 20, fontSize: 13, fontWeight: 500,
                                        }}>
                                            {c.category} ({c.count})
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Users */}
                {tab === 'users' && (
                    <>
                        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                            <input
                                placeholder="بحث بالاسم أو الرقم..."
                                value={usersSearch}
                                onChange={(e) => { setUsersSearch(e.target.value); setUsersPage(1); }}
                                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', flex: 1, minWidth: 200 }}
                            />
                            <select value={usersRole} onChange={(e) => { setUsersRole(e.target.value); setUsersPage(1); }}
                                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                <option value="">كل الأدوار</option>
                                <option value="worker">عامل</option>
                                <option value="employer">صاحب عمل</option>
                            </select>
                            <select value={usersBlocked} onChange={(e) => { setUsersBlocked(e.target.value); setUsersPage(1); }}
                                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                <option value="">الكل</option>
                                <option value="false">نشط</option>
                                <option value="true">محظور</option>
                            </select>
                        </div>

                        {loading ? <p>جاري التحميل...</p> : (
                            <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                                <th style={thStyle}>الاسم</th>
                                                <th style={thStyle}>الهاتف</th>
                                                <th style={thStyle}>الدور</th>
                                                <th style={thStyle}>المحافظة</th>
                                                <th style={thStyle}>التقييم</th>
                                                <th style={thStyle}>الحالة</th>
                                                <th style={thStyle}>إجراء</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map((u) => (
                                                <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={tdStyle}>{u.name || '—'}</td>
                                                    <td style={{ ...tdStyle, direction: 'ltr', textAlign: 'left' }}>{u.phone}</td>
                                                    <td style={tdStyle}>
                                                        <span style={{ background: u.role === 'worker' ? '#dcfce7' : '#ede9fe', color: u.role === 'worker' ? '#166534' : '#5b21b6', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>
                                                            {roleLabel(u.role)}
                                                        </span>
                                                    </td>
                                                    <td style={tdStyle}>{u.governorate || '—'}</td>
                                                    <td style={tdStyle}>{u.avg_rating > 0 ? `⭐ ${u.avg_rating}` : '—'}</td>
                                                    <td style={tdStyle}>
                                                        {u.is_blocked ? (
                                                            <span style={{ color: '#dc2626', fontWeight: 600, fontSize: 13 }}>محظور</span>
                                                        ) : (
                                                            <span style={{ color: '#16a34a', fontSize: 13 }}>نشط</span>
                                                        )}
                                                    </td>
                                                    <td style={tdStyle}>
                                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                            <a href={`/profile/${u.id}`} target="_blank" rel="noreferrer" style={{ ...btnBlue, textDecoration: 'none', display: 'inline-block' }}>عرض</a>
                                                            {u.is_blocked ? (
                                                                <button onClick={() => unblockUser(u.id)} style={btnGreen}>إلغاء الحظر</button>
                                                            ) : (
                                                                <button onClick={() => blockUser(u.id, 'محظور بواسطة المدير')} style={btnRed}>حظر</button>
                                                            )}
                                                            <button onClick={() => deleteUser(u.id, u.name)} style={{ ...btnRed, background: '#7f1d1d' }}>حذف</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {users.length === 0 && <p style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>لا يوجد مستخدمون</p>}
                            </div>
                        )}

                        {usersPagination.totalPages > 1 && (
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
                                {Array.from({ length: usersPagination.totalPages }, (_, i) => (
                                    <button key={i} onClick={() => setUsersPage(i + 1)} style={{
                                        padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                        background: usersPage === i + 1 ? '#2563eb' : '#e2e8f0',
                                        color: usersPage === i + 1 ? 'white' : '#475569', fontWeight: 600,
                                    }}>
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Reports */}
                {tab === 'reports' && (
                    <>
                        <div style={{ marginBottom: 20 }}>
                            <select value={reportsStatus} onChange={(e) => setReportsStatus(e.target.value)}
                                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                <option value="pending">معلقة</option>
                                <option value="reviewed">قيد المراجعة</option>
                                <option value="resolved">محلولة</option>
                                <option value="dismissed">مرفوضة</option>
                            </select>
                        </div>

                        {loading ? <p>جاري التحميل...</p> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {reports.map((r) => (
                                    <div key={r.id} style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                                            <div>
                                                <p style={{ fontWeight: 600 }}>بلاغ ضد: {r.reported_name || r.reported_phone}</p>
                                                <p style={{ fontSize: 13, color: '#64748b' }}>من: {r.reporter_name || r.reporter_phone}</p>
                                            </div>
                                            <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 12px', borderRadius: 12, fontSize: 13, fontWeight: 600, height: 'fit-content' }}>
                                                {reasonLabel(r.reason)}
                                            </span>
                                        </div>
                                        {r.details && <p style={{ fontSize: 14, color: '#475569', marginBottom: 12 }}>{r.details}</p>}
                                        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>{new Date(r.created_at).toLocaleString('ar')}</p>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button onClick={() => updateReportStatus(r.id, 'resolved')} style={btnGreen}>حل</button>
                                            <button onClick={() => updateReportStatus(r.id, 'dismissed')} style={{ ...btnRed, background: '#94a3b8' }}>رفض</button>
                                            <button onClick={() => blockUser(r.reported_user_id, `بلاغ: ${r.reason}`)} style={btnRed}>حظر المستخدم</button>
                                        </div>
                                    </div>
                                ))}
                                {reports.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>لا يوجد بلاغات</p>}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

const thStyle = { padding: '12px 14px', textAlign: 'right', fontSize: 13, color: '#64748b', fontWeight: 600 };
const tdStyle = { padding: '12px 14px', fontSize: 14 };
const btnRed = { background: '#dc2626', color: 'white', border: 'none', padding: '6px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 };
const btnGreen = { background: '#16a34a', color: 'white', border: 'none', padding: '6px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 };
const btnBlue = { background: '#2563eb', color: 'white', border: 'none', padding: '6px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 };
