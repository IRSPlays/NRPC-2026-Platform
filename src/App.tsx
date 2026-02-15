import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import { AuthProvider } from './hooks/useAuth';
import Header from './components/layout/Header';
import Home from './pages/Home';
import Calculator from './pages/Calculator';
import TeamLogin from './pages/TeamLogin';
import TeamDashboard from './pages/TeamDashboard';
import Submit from './pages/Submit';
import Support from './pages/Support';
import Admin from './pages/Admin';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import AnnouncementsManager from './components/admin/AnnouncementsManager';
import TeamManager from './components/admin/TeamManager';
import SubmissionReview from './components/admin/SubmissionReview';
import RobotPerformanceReview from './components/admin/RobotPerformanceReview';
import ScoreManager from './components/admin/ScoreManager';
import TicketManager from './components/admin/TicketManager';
import Leaderboard from './components/admin/Leaderboard';
import BackupManager from './components/admin/BackupManager';
import PasswordChangeModal from './components/auth/PasswordChangeModal';
import { authAPI } from './lib/api';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authAPI.checkStatus()
      .then(status => {
        if (status.requiresPasswordChange) {
          localStorage.setItem('nrpc_requires_password_change', 'true');
          // Force a re-render/event to ensure modal catches it immediately if already mounted
          window.dispatchEvent(new Event('storage'));
        } else {
          localStorage.removeItem('nrpc_requires_password_change');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neo-void">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neo-cyan shadow-[0_0_15px_rgba(102,252,241,0.3)]"></div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen text-neo-slate transition-colors duration-200">
          <Header />
          <PasswordChangeModal />
          <Routes>
            <Route path="/" element={<main className="container mx-auto px-4"><Home /></main>} />
            <Route path="/calculator" element={<main className="container mx-auto px-4 py-8"><Calculator /></main>} />
            <Route path="/team-login" element={<main className="container mx-auto px-4 py-8"><TeamLogin /></main>} />
            <Route path="/team-dashboard" element={<main className="container mx-auto px-4 py-8"><TeamDashboard /></main>} />
            <Route path="/submit" element={<main className="container mx-auto px-4 py-8"><Submit /></main>} />
            <Route path="/support" element={<main className="container mx-auto px-4 py-8"><Support /></main>} />

            <Route path="/admin" element={<Admin />}>
              <Route index element={<AdminLogin />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="announcements" element={<AnnouncementsManager />} />
              <Route path="teams" element={<TeamManager />} />
              <Route path="submissions" element={<SubmissionReview />} />
              <Route path="robot-performance" element={<RobotPerformanceReview />} />
              <Route path="scoring" element={<ScoreManager />} />
              <Route path="leaderboard" element={<Leaderboard />} />
              <Route path="tickets" element={<TicketManager />} />
              <Route path="backup" element={<BackupManager />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;