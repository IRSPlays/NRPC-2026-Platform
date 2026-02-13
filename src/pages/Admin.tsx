import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, Users, FileText, Calculator, Trophy, Database, LogOut, Megaphone, Terminal, Video } from 'lucide-react';

export default function Admin() {
  const { isAdmin, isJudge, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/admin');
  };

  const navItems = [
    { path: '/admin/dashboard', label: 'Sys.Overview', icon: LayoutDashboard, adminOnly: false },
    { path: '/admin/announcements', label: 'Broadcasts', icon: Megaphone, adminOnly: true },
    { path: '/admin/teams', label: 'Team.DB', icon: Users, adminOnly: true },
    { path: '/admin/submissions', label: 'Uplink.Logs', icon: FileText, adminOnly: false },
    { path: '/admin/robot-performance', label: 'Perf.Logs', icon: Video, adminOnly: false },
    { path: '/admin/scoring', label: 'Calc.Engine', icon: Calculator, adminOnly: false },
    { path: '/admin/leaderboard', label: 'Rank.Table', icon: Trophy, adminOnly: false },
    { path: '/admin/backup', label: 'Archive.Sys', icon: Database, adminOnly: true },
  ];

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    if ((isAdmin || isJudge) && (location.pathname === '/admin' || location.pathname === '/admin/')) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAdmin, isJudge, location.pathname, navigate]);

  if (!isAdmin && !isJudge) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen flex bg-neo-void">
      {/* Tech Navigation Rail */}
      <aside className="w-20 lg:w-64 bg-neo-void border-r border-white/5 flex flex-col fixed h-full z-40 transition-all duration-300">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-neo-amber/10 text-neo-amber flex items-center justify-center border border-neo-amber/20">
            <Terminal className="w-5 h-5" />
          </div>
          <span className="hidden lg:block font-heading font-bold text-white tracking-tight">ADMIN.OS</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all group relative ${
                  active 
                    ? 'bg-neo-amber/10 text-neo-amber border border-neo-amber/20' 
                    : 'text-neo-slate/40 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'animate-pulse' : ''}`} />
                <span className="hidden lg:block text-xs font-mono font-bold uppercase tracking-wider">
                  {item.label}
                </span>
                {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-neo-amber rounded-r"></div>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-3 py-3 rounded-xl text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden lg:block text-xs font-mono font-bold uppercase tracking-wider">Terminate</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-20 lg:ml-64 p-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
