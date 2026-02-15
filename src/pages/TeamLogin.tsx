import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Key, ScanLine, ShieldCheck, Activity, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { teamsAPI } from '../lib/api';
import { Team } from '../types';

export default function TeamLogin() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingTeams, setFetchingTeams] = useState(true);
  
  const { loginAsTeam } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const data = await teamsAPI.getAll();
        setTeams(data);
      } catch (err) {
        console.error('Failed to load teams');
      } finally {
        setFetchingTeams(false);
      }
    };
    fetchTeams();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!teamId) {
      setError('Please select your team');
      return;
    }

    setLoading(true);
    try {
      const res = await loginAsTeam(teamId, password);
      // @ts-ignore
      if (res?.requiresPasswordChange) {
        localStorage.setItem('nrpc_requires_password_change', 'true');
      } else {
        localStorage.removeItem('nrpc_requires_password_change');
      }
      navigate('/team-dashboard');
    } catch (err) {
      setError('Access Denied: Invalid Credentials');
    } finally {
      setLoading(false);
    }
  };

  const primaryTeams = teams.filter(t => t.category === 'Primary');
  const secondaryTeams = teams.filter(t => t.category === 'Secondary');

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md relative">
        {/* Decorative Elements */}
        <div className="absolute inset-0 bg-neo-cyan/5 blur-3xl rounded-full"></div>
        <div className="scanning-line absolute w-full top-0 left-0 opacity-20"></div>

        <div className="relative neo-glass rounded-[2rem] border-neo-cyan/20 p-10 overflow-hidden shadow-2xl">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-neo-cyan/10 rounded-2xl border border-neo-cyan/30 flex items-center justify-center mx-auto mb-6 relative group">
              <ScanLine className="w-10 h-10 text-neo-cyan absolute opacity-50 animate-ping" />
              <Lock className="w-8 h-8 text-neo-cyan relative z-10" />
              
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-neo-cyan"></div>
              <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-neo-cyan"></div>
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-neo-cyan"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-neo-cyan"></div>
            </div>
            
            <h1 className="text-2xl font-heading font-black text-white uppercase tracking-tight">
              Operator <span className="text-neo-cyan neo-text-glow">Access</span>
            </h1>
            <p className="text-[10px] font-mono text-neo-cyan/60 uppercase tracking-[0.3em] mt-2">
              Secure Terminal // NRPC-2026
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neo-slate/40 group-focus-within:text-neo-cyan transition-colors z-10" />
                {fetchingTeams ? (
                  <div className="w-full bg-neo-void/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-neo-slate/40 font-mono text-sm flex items-center gap-2">
                    <Activity className="w-3 h-3 animate-spin" /> Fetching Teams...
                  </div>
                ) : (
                  <select
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    className="w-full bg-neo-void/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white font-mono text-sm focus:border-neo-cyan/50 focus:ring-1 focus:ring-neo-cyan/20 outline-none transition-all appearance-none"
                    required
                  >
                    <option value="" className="bg-neo-void text-neo-slate/40">-- SELECT TEAM --</option>
                    {primaryTeams.length > 0 && (
                      <optgroup label="PRIMARY SCHOOL" className="bg-neo-void text-neo-cyan font-bold uppercase tracking-widest text-[10px]">
                        {primaryTeams.map(t => (
                          <option key={t.id} value={t.id} className="bg-neo-void text-white font-mono text-sm uppercase">
                            {t.team_name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {secondaryTeams.length > 0 && (
                      <optgroup label="SECONDARY SCHOOL" className="bg-neo-void text-neo-cyan font-bold uppercase tracking-widest text-[10px]">
                        {secondaryTeams.map(t => (
                          <option key={t.id} value={t.id} className="bg-neo-void text-white font-mono text-sm uppercase">
                            {t.team_name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                )}
              </div>

              <div className="relative group">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neo-slate/40 group-focus-within:text-neo-cyan transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Access Key"
                  className="w-full bg-neo-void/50 border border-white/10 rounded-xl py-4 pl-12 pr-12 text-white font-mono placeholder:text-neo-slate/20 focus:border-neo-cyan/50 focus:ring-1 focus:ring-neo-cyan/20 outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neo-slate/40 hover:text-neo-cyan transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-neo-amber/10 border border-neo-amber/30 text-neo-amber text-xs font-mono text-center uppercase tracking-wider flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4" /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || fetchingTeams}
              className="w-full btn-neo py-4 text-sm uppercase tracking-[0.2em] relative overflow-hidden group disabled:opacity-30"
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                {loading ? 'Verifying...' : 'Authenticate'}
              </div>
              <div className="absolute inset-0 bg-neo-cyan/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </button>
          </form>
          
          <div className="mt-8 text-center border-t border-white/5 pt-6">
             <p className="text-[10px] font-mono text-neo-slate/20 uppercase tracking-widest">
               Unauthorized access attempts are logged // NRPC Security
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
