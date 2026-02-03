import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, Clock, AlertCircle, Download, Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { scoresAPI, submissionsAPI } from '../../lib/api';
import { Score } from '../../types';

interface LeaderboardEntry {
  team_id: number;
  team_name: string;
  school_name: string;
  category: string;
  robot_score: number;
  poster_score: number;
  total_score: number;
  best_time_seconds: number;
  rank: number;
}

export default function Leaderboard() {
  const { isAdmin, isJudge } = useAuth();
  const navigate = useNavigate();
  
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'Primary' | 'Secondary'>('all');

  useEffect(() => {
    if (!isAdmin && !isJudge) {
      navigate('/admin');
      return;
    }
    loadData();
  }, [isAdmin, isJudge]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const [scores, submissions] = await Promise.all([
        scoresAPI.getAll(),
        submissionsAPI.getAll(),
      ]);

      // Group scores by team and get best score
      const teamScores: { [key: number]: Score[] } = {};
      scores.forEach(score => {
        if (!teamScores[score.team_id]) {
          teamScores[score.team_id] = [];
        }
        teamScores[score.team_id].push(score);
      });

      // Get best poster score per team
      const teamPosterScores: { [key: number]: number } = {};
      submissions.forEach(sub => {
        if (sub.concept_score) {
          const total = (sub.concept_score || 0) + 
                       (sub.future_score || 0) + 
                       (sub.organization_score || 0) + 
                       (sub.aesthetics_score || 0);
          if (!teamPosterScores[sub.team_id] || total > teamPosterScores[sub.team_id]) {
            teamPosterScores[sub.team_id] = total;
          }
        }
      });

      // Create leaderboard entries
      const leaderboardData: LeaderboardEntry[] = Object.keys(teamScores).map(teamId => {
        const teamScoresList = teamScores[parseInt(teamId)];
        const bestScore = teamScoresList.reduce((best, current) => 
          current.total_score > best.total_score ? current : best
        );
        
        return {
          team_id: parseInt(teamId),
          team_name: bestScore.team_name || `Team ${teamId}`,
          school_name: bestScore.school_name || 'Unknown School',
          category: bestScore.team_name?.includes('Primary') ? 'Primary' : 'Secondary',
          robot_score: bestScore.total_score,
          poster_score: teamPosterScores[parseInt(teamId)] || 0,
          total_score: bestScore.total_score + (teamPosterScores[parseInt(teamId)] || 0),
          best_time_seconds: bestScore.completion_time_seconds,
          rank: 0,
        };
      });

      // Sort by total score (descending), then by robot score, then by time
      leaderboardData.sort((a, b) => {
        if (b.total_score !== a.total_score) return b.total_score - a.total_score;
        if (b.robot_score !== a.robot_score) return b.robot_score - a.robot_score;
        return a.best_time_seconds - b.best_time_seconds;
      });

      // Assign ranks
      leaderboardData.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      setEntries(leaderboardData);
    } catch (err: any) {
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const exportCSV = () => {
    const headers = ['Rank', 'Team', 'School', 'Category', 'Robot Score', 'Poster Score', 'Total Score', 'Best Time'];
    const rows = filteredEntries.map(entry => [
      entry.rank,
      entry.team_name,
      entry.school_name,
      entry.category,
      entry.robot_score,
      entry.poster_score,
      entry.total_score,
      formatTime(entry.best_time_seconds),
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nrpc-leaderboard-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = 
      entry.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.school_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || entry.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (rank === 2) return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    if (rank === 3) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
  };

  if (!isAdmin && !isJudge) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-slate-900 dark:text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-[#0D7377]" />
            Leaderboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Competition rankings and results
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
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

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search teams or schools..."
            className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0D7377] focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'Primary', 'Secondary'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-[#0D7377] text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#0D7377] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              {searchTerm || categoryFilter !== 'all' ? 'No entries match your criteria' : 'No scores recorded yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-20">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    School
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Robot
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Poster
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredEntries.map((entry) => (
                  <tr 
                    key={entry.team_id} 
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold ${getRankStyle(entry.rank)}`}>
                        {entry.rank <= 3 ? (
                          <Medal className="w-5 h-5" />
                        ) : (
                          entry.rank
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {entry.team_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {entry.school_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        entry.category === 'Primary'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      }`}>
                        {entry.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {entry.robot_score}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">/155</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {entry.poster_score}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">/100</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="font-bold text-[#0D7377]">
                        {entry.total_score}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-600 dark:text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-mono">{formatTime(entry.best_time_seconds)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="text-sm text-slate-500 dark:text-slate-400">
        Showing {filteredEntries.length} of {entries.length} teams
      </div>
    </div>
  );
}
