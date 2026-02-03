import { Link, useNavigate } from 'react-router-dom';
import { Calculator, Trophy, Upload, Shield, Moon, Sun, LogOut, User } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { isAdmin, isJudge, isTeam, teamName, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-dark-card/80 backdrop-blur-md border-b border-gray-200 dark:border-dark-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-xl text-gray-900 dark:text-white">
                NRPC Platform
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                De-extinction Challenge 2026
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/calculator" className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light transition-colors">
              <Calculator className="w-4 h-4" />
              <span>Calculator</span>
            </Link>
            
            {isTeam && (
              <>
                <Link to="/team-dashboard" className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light transition-colors">
                  <User className="w-4 h-4" />
                  <span>{teamName || 'Dashboard'}</span>
                </Link>
                <Link to="/submit" className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>Submit</span>
                </Link>
              </>
            )}

            {!isTeam && (
              <Link to="/team-login" className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light transition-colors">
                <User className="w-4 h-4" />
                <span>Team Login</span>
              </Link>
            )}

            {(isAdmin || isJudge) && (
              <Link to="/admin" className="flex items-center gap-2 text-primary dark:text-primary-light font-medium">
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-dark-border hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-gray-600" />
              ) : (
                <Sun className="w-5 h-5 text-yellow-400" />
              )}
            </button>

            {(isAdmin || isJudge || isTeam) && (
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-gray-100 dark:bg-dark-border hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Logout"
              >
                <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}