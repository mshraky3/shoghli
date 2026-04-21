import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import LandingPage from './pages/LandingPage';
import RoleSelectPage from './pages/RoleSelectPage';
import WorkerOnboarding from './pages/WorkerOnboarding';
import EmployerOnboarding from './pages/EmployerOnboarding';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import UserProfilePage from './pages/UserProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import RequestsPage from './pages/RequestsPage';
import NewJobPage from './pages/NewJobPage';
import TermsPage from './pages/TermsPage';
import AdminDashboard from './pages/AdminDashboard';
import SeoManager from './components/SeoManager';

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="loading-page"><div className="spinner" /><p>جاري التحميل...</p></div>;
    if (!user) return <Navigate to="/auth" replace />;
    return children;
}

function AppRoutes() {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="loading-page"><div className="spinner" /><p>جاري التحميل...</p></div>;
    }

    return (
        <>
            <SeoManager user={user} />
            <Routes>
                <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />

                <Route path="/onboarding/role" element={
                    <ProtectedRoute><RoleSelectPage /></ProtectedRoute>
                } />
                <Route path="/onboarding/worker" element={
                    <ProtectedRoute><WorkerOnboarding /></ProtectedRoute>
                } />
                <Route path="/onboarding/employer" element={
                    <ProtectedRoute><EmployerOnboarding /></ProtectedRoute>
                } />

                <Route path="/dashboard" element={
                    <ProtectedRoute><Dashboard /></ProtectedRoute>
                } />
                <Route path="/profile" element={
                    <ProtectedRoute><ProfilePage /></ProtectedRoute>
                } />
                <Route path="/profile/:id" element={
                    <ProtectedRoute><UserProfilePage /></ProtectedRoute>
                } />
                <Route path="/notifications" element={
                    <ProtectedRoute><NotificationsPage /></ProtectedRoute>
                } />
                <Route path="/requests" element={
                    <ProtectedRoute><RequestsPage /></ProtectedRoute>
                } />
                <Route path="/job/new" element={
                    <ProtectedRoute><NewJobPage /></ProtectedRoute>
                } />

                <Route path="/terms" element={<TermsPage />} />

                <Route path="/" element={
                    user ? (
                        !user.role ? <Navigate to="/onboarding/role" replace /> :
                            !user.onboarding_completed ? <Navigate to={`/onboarding/${user.role}`} replace /> :
                                <Navigate to="/dashboard" replace />
                    ) : <LandingPage />
                } />

                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}

export default function App() {
    return (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}
