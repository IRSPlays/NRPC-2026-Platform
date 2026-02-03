import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, Clock, Trophy, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { teamsAPI, submissionsAPI, scoresAPI } from '../../lib/api';

interface Stats {
  totalTeams: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  pendingScores: number;
  totalScores: number;
  todayUploads: number;
}

export default function AdminDashboard() {
  const { isAdmin, isJudge } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<Stats>({
    totalTeams: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0,
    pendingScores: 0,
    totalScores: 0,
    todayUploads: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin && !isJudge) {
      navigate('/admin');
      return;
    }
    loadStats();
  }, [isAdmin, isJudge]);

  const loadStats = async () => {
    setLoading(true);
    setError('');
    
    try {
      const [teams, submissions, scores] = await Promise.all([
        teamsAPI.getAll(),
        submissionsAPI.getAll(),
        scoresAPI.getAll(),
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayUploads = submissions.filter(sub => {
        const subDate = new Date(sub.submitted_at);
        return subDate >= today;
      }).length;

      const pendingSubmissions = submissions.filter(sub => !sub.concept_score).length;

      setStats({
        totalTeams: teams.length,
        totalSubmissions: submissions.length,
        pendingSubmissions,
        pendingScores: submissions.filter(sub => !sub.concept_score).length,
        totalScores: scores.length,
        todayUploads,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin && !isJudge) {
    return null;
  }

  const statCards = [
    {
      label: 'Total Teams',
      value: stats.totalTeams,
      icon: Users,
      color: 'bg-blue-500',
      onClick: () => navigate('/admin/teams'),
    },
    {
      label: 'Total Submissions',
      value: stats.totalSubmissions,
      icon: FileText,
      color: 'bg-purple-500',
      onClick: () => navigate('/admin/submissions'),
    },
    {
      label: 'Pending Reviews',
      value: stats.pendingSubmissions,
      icon: Clock,
      color: 'bg-amber-500',
      onClick: () => navigate('/admin/submissions'),
    },
    {
      label: "Today's Uploads",
      value: stats.todayUploads,
      icon: TrendingUp,
      color: 'bg-green-500',
      onClick: () => navigate('/admin/submissions'),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Overview of competition status
          </p>
        </div>
        <button
          onClick={loadStats}
          disabled={loading}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <button
              key={stat.label}
              onClick={stat.onClick}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:border-[#0D7377]/30 transition-all text-left group"
            >
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {stat.value}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {stat.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#0D7377]" />
            Quick Actions
          </h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/admin/scoring')}
              className="w-full flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-[#0D7377]/10 hover:text-[#0D7377] transition-colors"
            >
              <span className="font-medium">Score a Robot Run</span>
              <span className="text-sm text-slate-400">→</span>
            </button>
            <button
              onClick={() => navigate('/admin/submissions')}
              className="w-full flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-[#0D7377]/10 hover:text-[#0D7377] transition-colors"
            >
              <span className="font-medium">Review Submissions</span>
              <span className="text-sm text-slate-400">→</span>
            </button>
            <button
              onClick={() => navigate('/admin/leaderboard')}
              className="w-full flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-[#0D7377]/10 hover:text-[#0D7377] transition-colors"
            >
              <span className="font-medium">View Leaderboard</span>
              <span className="text-sm text-slate-400">→</span>
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#0D7377]/10 to-[#14FFEC]/5 rounded-xl border border-[#0D7377]/20 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Competition Status
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600 dark:text-slate-400">Poster Submissions</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {stats.totalSubmissions}/{stats.totalTeams}
                </span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0D7377] rounded-full transition-all"
                  style={{ 
                    width: `${stats.totalTeams > 0 ? (stats.totalSubmissions / stats.totalTeams) * 100 : 0}%` 
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600 dark:text-slate-400">Submissions Reviewed</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {stats.totalSubmissions - stats.pendingSubmissions}/{stats.totalSubmissions}
                </span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ 
                    width: `${stats.totalSubmissions > 0 ? ((stats.totalSubmissions - stats.pendingSubmissions) / stats.totalSubmissions) * 100 : 0}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
