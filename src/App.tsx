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
import Admin from './pages/Admin';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import TeamManager from './components/admin/TeamManager';
import SubmissionReview from './components/admin/SubmissionReview';
import ScoreManager from './components/admin/ScoreManager';
import Leaderboard from './components/admin/Leaderboard';
import BackupManager from './components/admin/BackupManager';
import { authAPI } from './lib/api';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check auth status on load
    authAPI.checkStatus().catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-dark-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-gray-900 dark:text-gray-100 transition-colors duration-200">
          <Header />
          <Routes>
            <Route path="/" element={<main className="container mx-auto px-4 py-8"><Home /></main>} />
            <Route path="/calculator" element={<main className="container mx-auto px-4 py-8"><Calculator /></main>} />
            <Route path="/team-login" element={<main className="container mx-auto px-4 py-8"><TeamLogin /></main>} />
            <Route path="/team-dashboard" element={<main className="container mx-auto px-4 py-8"><TeamDashboard /></main>} />
            <Route path="/submit" element={<main className="container mx-auto px-4 py-8"><Submit /></main>} />
            
            {/* Admin Routes - Full width */}
            <Route path="/admin" element={<Admin />}>
              <Route index element={<AdminLogin />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="teams" element={<TeamManager />} />
              <Route path="submissions" element={<SubmissionReview />} />
              <Route path="scoring" element={<ScoreManager />} />
              <Route path="leaderboard" element={<Leaderboard />} />
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