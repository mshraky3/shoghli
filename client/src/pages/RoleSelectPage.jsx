import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Briefcase, HardHat } from 'lucide-react';

export default function RoleSelectPage() {
    const { updateUser } = useAuth();
    const navigate = useNavigate();

    const selectRole = async (role) => {
        try {
            await api.put('/users/role', { role });
            updateUser({ role });
            navigate(`/onboarding/${role}`);
        } catch (err) {
            console.error('Failed to set role:', err);
        }
    };

    return (
        <div className="page" style={{ background: 'white' }}>
            <div className="container" style={{ paddingTop: '60px', textAlign: 'center' }}>
                <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>مرحباً بك في شغلي</h1>
                <p style={{ color: 'var(--gray-500)', marginBottom: 40 }}>اختر نوع حسابك</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <button
                        className="card"
                        onClick={() => selectRole('worker')}
                        style={{
                            cursor: 'pointer', border: '2px solid var(--gray-200)',
                            textAlign: 'center', padding: '32px 20px', transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--gray-200)'}
                    >
                        <div style={{
                            width: 64, height: 64, borderRadius: '50%',
                            background: '#dbeafe', margin: '0 auto 16px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <HardHat size={32} color="var(--primary)" />
                        </div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>أبحث عن عمل</h2>
                        <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>
                            سجّل مهاراتك وموقعك ليجدك أصحاب العمل القريبين منك
                        </p>
                    </button>

                    <button
                        className="card"
                        onClick={() => selectRole('employer')}
                        style={{
                            cursor: 'pointer', border: '2px solid var(--gray-200)',
                            textAlign: 'center', padding: '32px 20px', transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--gray-200)'}
                    >
                        <div style={{
                            width: 64, height: 64, borderRadius: '50%',
                            background: '#dcfce7', margin: '0 auto 16px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Briefcase size={32} color="var(--success)" />
                        </div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>أبحث عن عمّال</h2>
                        <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>
                            ابحث عن عمّال بالقرب منك لأي عمل تحتاجه
                        </p>
                    </button>
                </div>
            </div>
        </div>
    );
}
