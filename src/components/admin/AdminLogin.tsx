import { useState } from 'react';
import { Lock, Shield, ChevronRight, Fingerprint, Database, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'admin' | 'judge'>('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginAsAdmin, loginAsJudge } = useAuth();

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
    } catch (err) {
      setError('Authorization Failed: Restricted Access');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center -mt-20">
      <div className="w-full max-w-lg">
        <div className="neo-glass rounded-3xl border-neo-amber/20 p-12 relative overflow-hidden">
          {/* Background decorative scanning grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,179,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,179,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-neo-amber/10">
              <div className="p-3 bg-neo-amber/10 rounded-xl border border-neo-amber/30">
                <Shield className="w-8 h-8 text-neo-amber" />
              </div>
              <div>
                <h1 className="text-2xl font-heading font-black text-white uppercase tracking-tight">
                  Command <span className="text-neo-amber neo-text-glow">Override</span>
                </h1>
                <p className="text-[10px] font-mono text-neo-amber/60 uppercase tracking-[0.3em]">
                  Restricted Environment
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Role Toggle */}
              <div className="flex p-1 bg-neo-void/50 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`flex-1 py-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    role === 'admin' 
                      ? 'bg-neo-amber text-neo-void shadow-[0_0_15px_rgba(255,179,0,0.4)]' 
                      : 'text-neo-slate/40 hover:text-neo-slate'
                  }`}
                >
                  <Database className="w-3 h-3" /> SysAdmin
                </button>
                <button
                  type="button"
                  onClick={() => setRole('judge')}
                  className={`flex-1 py-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    role === 'judge' 
                      ? 'bg-neo-cyan text-neo-void shadow-[0_0_15px_rgba(102,252,241,0.4)]' 
                      : 'text-neo-slate/40 hover:text-neo-slate'
                  }`}
                >
                  <Fingerprint className="w-3 h-3" /> Assessor
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest ml-1">
                  Security Token
                </label>
                <div className="relative group">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${role === 'admin' ? 'text-neo-amber/40 group-focus-within:text-neo-amber' : 'text-neo-cyan/40 group-focus-within:text-neo-cyan'}`} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full bg-neo-void/80 border rounded-xl py-4 pl-12 pr-12 text-white font-mono placeholder:text-neo-slate/10 outline-none transition-all ${
                      role === 'admin'
                        ? 'border-neo-amber/20 focus:border-neo-amber/50 focus:ring-1 focus:ring-neo-amber/20'
                        : 'border-neo-cyan/20 focus:border-neo-cyan/50 focus:ring-1 focus:ring-neo-cyan/20'
                    }`}
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-12 top-1/2 -translate-y-1/2 p-2 text-neo-slate/40 hover:text-white transition-colors`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button 
                    type="submit"
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${
                      role === 'admin' ? 'bg-neo-amber text-neo-void hover:bg-white' : 'bg-neo-cyan text-neo-void hover:bg-white'
                    }`}
                  >
                    {loading ? <div className="w-4 h-4 border-2 border-neo-void/30 border-t-neo-void rounded-full animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono text-center uppercase tracking-wider">
                  ⚠️ {error}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
