import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, Users, FileText, Calculator, Trophy, Database, LogOut } from 'lucide-react';

export default function Admin() {
  const { isAdmin, isJudge, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/admin');
  };

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
    { path: '/admin/teams', label: 'Teams', icon: Users, adminOnly: true },
    { path: '/admin/submissions', label: 'Submissions', icon: FileText, adminOnly: false },
    { path: '/admin/scoring', label: 'Scoring', icon: Calculator, adminOnly: false },
    { path: '/admin/leaderboard', label: 'Leaderboard', icon: Trophy, adminOnly: false },
    { path: '/admin/backup', label: 'Backup', icon: Database, adminOnly: true },
  ];

  const isActive = (path: string) => location.pathname === path;

  // If authenticated and on login page, redirect to dashboard (one-time)
  useEffect(() => {
    if ((isAdmin || isJudge) && (location.pathname === '/admin' || location.pathname === '/admin/')) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAdmin, isJudge, location.pathname, navigate]);

  // If not authenticated, just render the Outlet (login form)
  if (!isAdmin && !isJudge) {
    return <Outlet />;
  }

  // Authenticated - show admin layout with sidebar
  return (
    <div className="min-h-screen flex bg-light-bg dark:bg-dark-bg">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 hidden md:block">
        <div className="p-6">
          <h2 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
            Admin Panel
          </h2>
          <nav className="space-y-1">
            {navItems.map((item) => {
              if (item.adminOnly && !isAdmin) return null;
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-[#0D7377]/10 text-[#0D7377]'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
