import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { teamsAPI } from '../lib/api';
import { Team } from '../types';

export default function TeamLogin() {
  const [teamId, setTeamId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoaded, setTeamsLoaded] = useState(false);
  
  const navigate = useNavigate();
  const { loginAsTeam } = useAuth();

  // Load teams on focus
  const loadTeams = async () => {
    if (!teamsLoaded) {
      try {
        const data = await teamsAPI.getAll();
        setTeams(data);
        setTeamsLoaded(true);
      } catch (err) {
        console.error('Failed to load teams:', err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginAsTeam(teamId, password);
      navigate('/team-dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-lg border border-gray-200 dark:border-dark-border overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary-light p-6">
          <div className="flex items-center justify-center">
            <Shield className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-white text-center mt-4">
            Team Login
          </h1>
          <p className="text-white/80 text-center text-sm mt-1">
            Access your dashboard and submit your poster
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Select Your Team
            </label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              onFocus={loadTeams}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">-- Select Team --</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.team_name} ({team.school_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter team password"
                required
                className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Default password: NRPC2026Teams
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Don't see your team? Contact an administrator.</p>
      </div>
    </div>
  );
}