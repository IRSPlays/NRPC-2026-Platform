import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Eye, EyeOff, Lock, UserCog, Scale } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'admin' | 'judge'>('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { loginAsAdmin, loginAsJudge, isAdmin, isJudge } = useAuth();

  useEffect(() => {
    if (isAdmin || isJudge) {
      const from = location.state?.from?.pathname || '/admin/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAdmin, isJudge, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (role === 'admin') {
        await loginAsAdmin(password);
      } else {
        await loginAsJudge(password);
      }
      
      // Redirect to dashboard after successful login
      const from = location.state?.from?.pathname || '/admin/dashboard';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 p-6">
          <div className="flex items-center justify-center">
            <Shield className="w-12 h-12 text-[#14FFEC]" />
          </div>
          <h1 className="text-2xl font-bold font-heading text-white text-center mt-4">
            Admin Access
          </h1>
          <p className="text-slate-400 text-center text-sm mt-1">
            Login as administrator or judge
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('admin')}
              className={`p-4 rounded-lg border-2 text-center transition-all ${
                role === 'admin'
                  ? 'border-[#0D7377] bg-[#0D7377]/10 text-[#0D7377]'
                  : 'border-slate-200 dark:border-slate-700 hover:border-[#0D7377]/30'
              }`}
            >
              <UserCog className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium block">Administrator</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Full access</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('judge')}
              className={`p-4 rounded-lg border-2 text-center transition-all ${
                role === 'judge'
                  ? 'border-[#0D7377] bg-[#0D7377]/10 text-[#0D7377]'
                  : 'border-slate-200 dark:border-slate-700 hover:border-[#0D7377]/30'
              }`}
            >
              <Scale className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium block">Judge</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Scoring only</span>
            </button>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full px-4 py-3 pr-12 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0D7377] focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {role === 'admin' 
                ? 'Default: NRPCTeam2026' 
                : 'Default: NRPC2026Teams'}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 bg-[#0D7377] text-white rounded-lg font-medium hover:bg-[#0A5A5D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Login
              </>
            )}
          </button>
        </form>
      </div>

      <div className="mt-6 text-center text-sm text-slate-500">
        <p>Need access? Contact the competition organizer.</p>
      </div>
    </div>
  );
}