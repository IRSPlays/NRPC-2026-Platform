import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Calculator, Trophy, Upload, Shield, Moon, Sun, LogOut, User, Cpu, Menu, X } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { isAdmin, isJudge, isTeam, teamName, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const NavLinks = () => (
    <>
      <Link 
        to="/calculator" 
        onClick={() => setIsMenuOpen(false)}
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
            onClick={() => setIsMenuOpen(false)}
            className={`flex items-center gap-2 text-sm font-mono uppercase tracking-widest transition-all ${
              isActive('/team-dashboard') ? 'text-neo-cyan neo-text-glow' : 'text-neo-slate/60 hover:text-neo-cyan'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <Link 
            to="/submit" 
            onClick={() => setIsMenuOpen(false)}
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
          onClick={() => setIsMenuOpen(false)}
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
          onClick={() => setIsMenuOpen(false)}
          className={`flex items-center gap-2 text-sm font-mono uppercase tracking-widest transition-all ${
            location.pathname.startsWith('/admin') ? 'text-neo-amber neo-text-glow' : 'text-neo-amber/60 hover:text-neo-amber'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Admin</span>
        </Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 py-4">
      <div className="container mx-auto px-4">
        <div className="neo-glass rounded-2xl border-neo-cyan/20 px-4 md:px-6 py-4 flex items-center justify-between relative">
          <Link to="/" className="flex items-center gap-3 md:gap-4 group z-50">
            <div className="w-10 h-10 bg-neo-cyan/10 border border-neo-cyan/30 rounded-xl flex items-center justify-center group-hover:bg-neo-cyan/20 transition-all">
              <Cpu className="w-6 h-6 text-neo-cyan neo-text-glow" />
            </div>
            <div className="block">
              <h1 className="font-heading font-black text-lg md:text-xl text-white tracking-tight uppercase leading-none">
                NRPC<span className="text-neo-cyan">.Core</span>
              </h1>
              <p className="text-[8px] md:text-[10px] font-mono text-neo-cyan/60 uppercase tracking-widest mt-1">
                v2.0
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            <NavLinks />
          </nav>

          <div className="flex items-center gap-2 md:gap-4 z-50">
            <button
              onClick={toggleTheme}
              className="p-2 md:p-2.5 rounded-xl bg-neo-surface/40 border border-neo-cyan/10 text-neo-cyan/60 hover:text-neo-cyan transition-all"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-4 h-4 md:w-5 md:h-5" /> : <Sun className="w-4 h-4 md:w-5 md:h-5" />}
            </button>

            {(isAdmin || isJudge || isTeam) && (
              <button
                onClick={handleLogout}
                className="hidden sm:flex p-2 md:p-2.5 rounded-xl bg-neo-surface/40 border border-neo-amber/10 text-neo-amber/60 hover:text-neo-amber transition-all"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-neo-cyan/10 border border-neo-cyan/30 text-neo-cyan"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation Drawer */}
          {isMenuOpen && (
            <div id="mobile-menu" className="absolute top-20 left-0 right-0 p-4 lg:hidden animate-fade-in">
              <nav className="neo-glass rounded-2xl border-neo-cyan/30 p-6 flex flex-col gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <NavLinks />
                {(isAdmin || isJudge || isTeam) && (
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-red-400 border-t border-white/5 pt-4"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Terminate Session</span>
                  </button>
                )}
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
