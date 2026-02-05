import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, Clock, AlertCircle, Download, Search, Settings, FileText, Cpu, Star, Activity } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { scoresAPI, submissionsAPI, teamsAPI } from '../../lib/api';
import { Score, Team, Submission } from '../../types';

interface LeaderboardEntry {
  rank: number;
  team: Team;
  championshipScore: number;
  details: {
    weightedRobot: number;
    weightedMech: number;
    weightedPoster: number;
  };
  stats: {
    robot: number;
    mech: number;
    poster: number;
    time: number;
  };
}

export default function Leaderboard() {
  const { isAdmin, isJudge } = useAuth();
  const navigate = useNavigate();
  
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'Primary' | 'Secondary'>('all');
  const [viewMode, setViewMode] = useState<'championship' | 'robot' | 'mech' | 'poster'>('championship');

  useEffect(() => {
    if (!isAdmin && !isJudge) { navigate('/admin'); return; }
    loadData();
  }, [isAdmin, isJudge]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await scoresAPI.getLeaderboard();
      setEntries(data as any);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve rankings');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds >= 999) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const exportCSV = () => {
    const headers = ['Rank', 'Team', 'School', 'Category', 'Championship Score', 'Robot (Raw)', 'Robot (Weight)', 'Mech (Raw)', 'Mech (Weight)', 'Poster (Raw)', 'Poster (Weight)', 'Best Time'];
    const rows = filteredEntries.map(entry => [
      entry.rank, entry.team.team_name, entry.team.school_name, entry.team.category,
      entry.championshipScore,
      entry.stats.robot, entry.details.weightedRobot,
      entry.stats.mech, entry.details.weightedMech,
      entry.stats.poster, entry.details.weightedPoster,
      formatTime(entry.stats.time),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nrpc-rankings-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.team.team_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          entry.team.school_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || entry.team.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const sortedEntries = [...filteredEntries].sort((a, b) => {
    if (viewMode === 'robot') return b.stats.robot - a.stats.robot || a.stats.time - b.stats.time;
    if (viewMode === 'mech') return b.stats.mech - a.stats.mech;
    if (viewMode === 'poster') return b.stats.poster - a.stats.poster;
    return b.championshipScore - a.championshipScore; // Default Championship
  });

  // Re-rank after sorting
  sortedEntries.forEach((e, i) => e.rank = i + 1);

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-neo-amber text-neo-void shadow-[0_0_15px_rgba(255,179,0,0.5)]';
    if (rank === 2) return 'bg-white text-neo-void shadow-[0_0_15px_rgba(255,255,255,0.5)]';
    if (rank === 3) return 'bg-neo-cyan text-neo-void shadow-[0_0_15px_rgba(102,252,241,0.5)]';
    return 'bg-white/5 text-neo-slate/60';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-4xl font-heading font-black text-white uppercase tracking-tighter mb-2">
            Performance <span className="text-neo-cyan">Rankings</span>
          </h1>
          <p className="text-xs font-mono text-neo-slate/40 uppercase tracking-[0.3em]">
            Global Competition Standings
          </p>
        </div>
        <button onClick={exportCSV} className="btn-neo flex items-center gap-2 py-3 px-6 text-xs">
          <Download className="w-4 h-4" /> Export Data
        </button>
      </div>

      {error && <div className="p-4 rounded-xl bg-neo-amber/10 border border-neo-amber/30 text-neo-amber text-xs font-mono uppercase tracking-widest flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Search */}
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-neo-slate/40 group-focus-within:text-neo-cyan transition-colors" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search team or school..."
            className="w-full bg-neo-void/50 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white font-mono outline-none focus:border-neo-cyan/40 transition-all"
          />
        </div>

        {/* View Mode */}
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
          {[
            { id: 'championship', icon: Trophy, label: 'Overall' },
            { id: 'robot', icon: Cpu, label: 'Robot' },
            { id: 'mech', icon: Settings, label: 'Mech' },
            { id: 'poster', icon: FileText, label: 'Poster' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all ${
                viewMode === mode.id ? 'bg-neo-cyan text-neo-void shadow-[0_0_15px_rgba(102,252,241,0.3)]' : 'text-neo-slate/40 hover:text-white'
              }`}
            >
              <mode.icon className="w-4 h-4" />
              <span className="hidden md:inline">{mode.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="neo-glass rounded-3xl border-white/5 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><Activity className="animate-spin text-neo-cyan" /></div>
        ) : sortedEntries.length === 0 ? (
          <div className="p-20 text-center text-neo-slate/40 font-mono text-xs uppercase tracking-widest">No rankings available</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-6 py-6 text-left text-[10px] font-mono text-neo-slate/40 uppercase tracking-[0.2em]">Rank</th>
                  <th className="px-6 py-6 text-left text-[10px] font-mono text-neo-slate/40 uppercase tracking-[0.2em]">Unit Identity</th>
                  <th className="px-6 py-6 text-center text-[10px] font-mono text-neo-slate/40 uppercase tracking-[0.2em]">Robot (60%)</th>
                  <th className="px-6 py-6 text-center text-[10px] font-mono text-neo-slate/40 uppercase tracking-[0.2em]">Mech (20%)</th>
                  <th className="px-6 py-6 text-center text-[10px] font-mono text-neo-slate/40 uppercase tracking-[0.2em]">Poster (20%)</th>
                  <th className="px-6 py-6 text-center text-[10px] font-mono text-neo-slate/40 uppercase tracking-[0.2em]">Total Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedEntries.map((entry) => (
                  <tr key={entry.team.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-6">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black font-mono text-lg ${getRankStyle(entry.rank)}`}>
                        {entry.rank}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col">
                        <span className="font-heading font-bold text-white text-lg group-hover:text-neo-cyan transition-colors">{entry.team.team_name}</span>
                        <span className="text-xs font-mono text-neo-slate/40">{entry.team.school_name}</span>
                        <span className={`mt-2 inline-flex w-fit px-2 py-0.5 rounded text-[9px] font-mono uppercase border ${
                          entry.team.category === 'Primary' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' : 'border-purple-500/30 text-purple-400 bg-purple-500/10'
                        }`}>
                          {entry.team.category}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-mono font-bold text-neo-cyan text-lg">{entry.details.weightedRobot.toFixed(1)}</span>
                        <span className="text-[9px] font-mono text-neo-slate/30">RAW: {entry.stats.robot} / 155</span>
                        <span className="text-[9px] font-mono text-neo-amber mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatTime(entry.stats.time)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-mono font-bold text-white text-lg">{entry.details.weightedMech.toFixed(1)}</span>
                        <span className="text-[9px] font-mono text-neo-slate/30">RAW: {entry.stats.mech} / 100</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-mono font-bold text-white text-lg">{entry.details.weightedPoster.toFixed(1)}</span>
                        <span className="text-[9px] font-mono text-neo-slate/30">RAW: {entry.stats.poster} / 100</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="flex flex-col items-center relative">
                        {entry.rank === 1 && <Star className="w-6 h-6 text-neo-amber absolute -top-6 animate-bounce" />}
                        <span className="font-heading font-black text-3xl text-neo-amber neo-text-glow">
                          {entry.championshipScore.toFixed(2)}
                        </span>
                        <span className="text-[9px] font-mono text-neo-slate/30 uppercase tracking-widest">Aggregate</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
