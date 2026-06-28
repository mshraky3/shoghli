import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import LandingPage from './pages/LandingPage';
import EmployerOnboarding from './pages/EmployerOnboarding';
import EmployerPaymentPage from './pages/EmployerPaymentPage';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import UserProfilePage from './pages/UserProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import RequestsPage from './pages/RequestsPage';
import NewJobPage from './pages/NewJobPage';
import TermsPage from './pages/TermsPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminLoginPage from './pages/AdminLoginPage';
import SeoManager from './components/SeoManager';

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="loading-page"><div className="spinner" /><p>جاري التحميل...</p></div>;
    if (!user) return <Navigate to="/auth" replace />;
    return children;
}

// Where an authenticated employer should land based on their approval + onboarding state.
// (All website accounts are employers.)
export function employerHome(user) {
    if (user.employer_status && user.employer_status !== 'approved') return '/payment';
    if (!user.onboarding_completed) return '/onboarding/employer';
    return '/dashboard';
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

                <Route path="/payment" element={
                    <ProtectedRoute><EmployerPaymentPage /></ProtectedRoute>
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
                    user ? <Navigate to={employerHome(user)} replace /> : <LandingPage />
                } />

                <Route path="/admin/login" element={<AdminLoginPage />} />
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
