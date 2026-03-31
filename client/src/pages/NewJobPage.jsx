import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ArrowRight } from 'lucide-react';

export default function NewJobPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        category_id: '',
        title: '',
        description: '',
        salary_min: '',
        salary_max: '',
        search_radius: 'district',
    });

    useEffect(() => {
        api.get('/categories').then(({ data }) => setCategories(data.categories)).catch(console.error);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.category_id) {
            alert('اختر فئة العمل');
            return;
        }
        setLoading(true);
        try {
            await api.post('/jobs', {
                ...form,
                category_id: parseInt(form.category_id),
                salary_min: form.salary_min ? parseInt(form.salary_min) : undefined,
                salary_max: form.salary_max ? parseInt(form.salary_max) : undefined,
                lat: user?.lat,
                lng: user?.lng,
            });
            alert('تم نشر الإعلان بنجاح');
            navigate('/dashboard');
        } catch (err) {
            alert(err.response?.data?.error || 'حدث خطأ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <div style={{
                background: 'white', padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                borderBottom: '1px solid var(--gray-200)',
            }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <ArrowRight size={22} />
                </button>
                <h1 style={{ fontSize: 18, fontWeight: 700 }}>إعلان عمل جديد</h1>
            </div>

            <div className="container">
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 12 }}>
                    <div>
                        <label className="input-label">نوع العمل *</label>
                        <select
                            className="input"
                            value={form.category_id}
                            onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                            required
                        >
                            <option value="">اختر نوع العمل</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name_ar}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="input-label">عنوان الإعلان (اختياري)</label>
                        <input
                            className="input"
                            placeholder="مثال: مطلوب كهربائي لتمديد أسلاك"
                            value={form.title}
                            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        />
                    </div>

                    <div>
                        <label className="input-label">وصف العمل (اختياري)</label>
                        <textarea
                            className="input"
                            rows={3}
                            placeholder="تفاصيل إضافية عن العمل المطلوب"
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    <div>
                        <label className="input-label">الأجر اليومي (ل.س)</label>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <input
                                className="input"
                                type="number"
                                placeholder="من"
                                value={form.salary_min}
                                onChange={e => setForm(f => ({ ...f, salary_min: e.target.value }))}
                                style={{ direction: 'ltr' }}
                            />
                            <span style={{ color: 'var(--gray-400)' }}>—</span>
                            <input
                                className="input"
                                type="number"
                                placeholder="إلى"
                                value={form.salary_max}
                                onChange={e => setForm(f => ({ ...f, salary_max: e.target.value }))}
                                style={{ direction: 'ltr' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="input-label">نطاق البحث</label>
                        <select
                            className="input"
                            value={form.search_radius}
                            onChange={e => setForm(f => ({ ...f, search_radius: e.target.value }))}
                        >
                            <option value="village">القرية (~3كم)</option>
                            <option value="subdistrict">الناحية (~15كم)</option>
                            <option value="district">المنطقة (~40كم)</option>
                            <option value="governorate">المحافظة (~100كم)</option>
                        </select>
                    </div>

                    <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                        {loading ? 'جاري النشر...' : 'نشر الإعلان'}
                    </button>
                </form>
            </div>
        </div>
    );
}
