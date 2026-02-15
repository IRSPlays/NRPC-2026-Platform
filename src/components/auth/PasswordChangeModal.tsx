import { useState, useEffect } from 'react';
import { Lock, Save, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { authAPI } from '../../lib/api';

export default function PasswordChangeModal() {
  const { isTeam, teamId, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check loop to catch status changes
    const checkStatus = () => {
      const requiresChange = localStorage.getItem('nrpc_requires_password_change');
      if (isTeam && requiresChange === 'true') {
        setIsOpen(true);
      }
    };

    checkStatus();
    // Listen for storage events (cross-tab or same-tab dispatch)
    window.addEventListener('storage', checkStatus);
    
    // Also poll occasionally just in case
    const interval = setInterval(checkStatus, 1000);

    return () => {
      window.removeEventListener('storage', checkStatus);
      clearInterval(interval);
    };
  }, [isTeam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword === 'NRPC2026Teams') {
      setError('Cannot use the default password');
      return;
    }

    setLoading(true);
    try {
      await authAPI.updatePassword(newPassword);
      setSuccess(true);
      localStorage.removeItem('nrpc_requires_password_change');
      setTimeout(() => setIsOpen(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md neo-glass rounded-[2rem] border-neo-amber/50 p-8 relative overflow-hidden shadow-[0_0_50px_rgba(255,179,0,0.2)]">
        <div className="scanning-line absolute w-full top-0 left-0 opacity-20"></div>
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-neo-amber/10 rounded-full border border-neo-amber/30 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-neo-amber" />
          </div>
          <h2 className="text-2xl font-heading font-black text-white uppercase tracking-tight">Security Alert</h2>
          <p className="text-xs font-mono text-neo-slate/60 mt-2 uppercase tracking-widest">
            Default credentials detected.<br/>Update required.
          </p>
        </div>

        {success ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-16 h-16 text-neo-cyan mx-auto mb-4" />
            <p className="text-neo-cyan font-bold uppercase tracking-widest">Password Updated</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4" /> {error}
              </div>
            )}

            <div className="space-y-4">
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New Password"
                className="w-full bg-neo-void/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-neo-amber/40 outline-none"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                className="w-full bg-neo-void/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-neo-amber/40 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-neo-amber py-4 font-bold uppercase tracking-widest flex items-center justify-center gap-2"
            >
              {loading ? 'Updating...' : <><Save className="w-4 h-4" /> Secure Account</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
