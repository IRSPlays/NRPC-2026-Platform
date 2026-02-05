import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Calculator, Trophy, Upload, Shield, Moon, Sun, LogOut, User, Cpu } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { isAdmin, isJudge, isTeam, teamName, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 py-4">
      <div className="container mx-auto px-4">
        <div className="neo-glass rounded-2xl border-neo-cyan/20 px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="w-10 h-10 bg-neo-cyan/10 border border-neo-cyan/30 rounded-xl flex items-center justify-center group-hover:bg-neo-cyan/20 transition-all">
              <Cpu className="w-6 h-6 text-neo-cyan neo-text-glow" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-heading font-black text-xl text-white tracking-tight uppercase leading-none">
                NRPC<span className="text-neo-cyan">.Core</span>
              </h1>
              <p className="text-[10px] font-mono text-neo-cyan/60 uppercase tracking-widest mt-1">
                De-Extinction v2.0
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link 
              to="/calculator" 
              className={`flex items-center gap-2 text-sm font-mono uppercase tracking-widest transition-all ${
                isActive('/calculator') ? 'text-neo-cyan neo-text-glow' : 'text-neo-slate/60 hover:text-neo-cyan'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Calculator</span>
            </Link>

            {isTeam && (
              <>
                <Link 
                  to="/team-dashboard" 
                  className={`flex items-center gap-2 text-sm font-mono uppercase tracking-widest transition-all ${
                    isActive('/team-dashboard') ? 'text-neo-cyan neo-text-glow' : 'text-neo-slate/60 hover:text-neo-cyan'
                  }`}
                >
                  <Trophy className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <Link 
                  to="/submit" 
                  className={`flex items-center gap-2 text-sm font-mono uppercase tracking-widest transition-all ${
                    isActive('/submit') ? 'text-neo-cyan neo-text-glow' : 'text-neo-slate/60 hover:text-neo-cyan'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Submit</span>
                </Link>
              </>
            )}

            {!isTeam && (
              <Link 
                to="/team-login" 
                className={`flex items-center gap-2 text-sm font-mono uppercase tracking-widest transition-all ${
                  isActive('/team-login') ? 'text-neo-cyan neo-text-glow' : 'text-neo-slate/60 hover:text-neo-cyan'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Team Login</span>
              </Link>
            )}

            {(isAdmin || isJudge) && (
              <Link 
                to="/admin" 
                className={`flex items-center gap-2 text-sm font-mono uppercase tracking-widest transition-all ${
                  location.pathname.startsWith('/admin') ? 'text-neo-amber neo-text-glow' : 'text-neo-amber/60 hover:text-neo-amber'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-neo-surface/40 border border-neo-cyan/10 text-neo-cyan/60 hover:text-neo-cyan hover:border-neo-cyan/40 transition-all"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>

            {(isAdmin || isJudge || isTeam) && (
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-xl bg-neo-surface/40 border border-neo-amber/10 text-neo-amber/60 hover:text-neo-amber hover:border-neo-amber/40 transition-all"
                aria-label="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
