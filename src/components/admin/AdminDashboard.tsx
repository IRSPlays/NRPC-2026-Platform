import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  Trophy, 
  Activity, 
  ArrowUpRight, 
  Cpu, 
  HardDrive,
  Megaphone,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { scoresAPI, submissionsAPI, teamsAPI, announcementsAPI, getFileUrl } from '../../lib/api';
import { Team, Submission, Score, Announcement } from '../../types';

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    teams: 0,
    submissions: 0,
    scores: 0,
    avgScore: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentScores, setRecentScores] = useState<Score[]>([]);
  const [pendingSubs, setPendingSubs] = useState<Submission[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [teams, subs, scores] = await Promise.all([
        teamsAPI.getAll(),
        submissionsAPI.getAll(),
        scoresAPI.getAll()
      ]);
      
      const avg = scores.length > 0 
        ? Math.round(scores.reduce((a, b) => a + b.total_score, 0) / scores.length) 
        : 0;

      setStats({
        teams: teams.length,
        submissions: subs.length,
        scores: scores.length,
        avgScore: avg
      });

      setRecentScores(scores.slice(0, 5));
      setPendingSubs(subs.filter(s => !s.concept_score).slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="w-12 h-12 border-2 border-neo-amber/20 border-t-neo-amber rounded-full animate-spin" />
        <span className="text-xs font-mono text-neo-amber/60 animate-pulse uppercase tracking-[0.4em]">Loading Admin Console...</span>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-4xl font-heading font-black text-white uppercase tracking-tighter mb-2">
            Admin <span className="text-neo-amber">Dashboard</span>
          </h1>
          <p className="text-xs font-mono text-neo-slate/40 uppercase tracking-[0.3em]">
            System Control Panel // Clearance: Level 5
          </p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-neo-amber/10 border border-neo-amber/20 rounded-lg">
          <Activity className="w-4 h-4 text-neo-amber animate-pulse" />
          <span className="text-xs font-mono font-bold text-neo-amber uppercase">System Normal</span>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Total Teams', val: stats.teams, icon: Users, color: 'text-neo-cyan' },
          { label: 'Submissions', val: stats.submissions, icon: FileText, color: 'text-neo-slate' },
          { label: 'Score Logs', val: stats.scores, icon: HardDrive, color: 'text-neo-slate' },
          { label: 'Average Score', val: stats.avgScore, icon: Trophy, color: 'text-neo-amber', sub: 'PTS' },
        ].map((stat, i) => (
          <div key={i} className="neo-glass p-6 rounded-2xl border-white/5 relative group hover:border-neo-amber/30 transition-all">
            <div className="flex justify-between items-start mb-4">
              <stat.icon className={`w-5 h-5 ${stat.color} opacity-50 group-hover:opacity-100 transition-opacity`} />
              <ArrowUpRight className="w-4 h-4 text-white/20" />
            </div>
            <div className="text-4xl font-black font-mono text-white mb-1">
              {stat.val} <span className="text-sm font-normal text-neo-slate/30">{stat.sub}</span>
            </div>
            <div className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Quick Commands */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-sm font-mono font-bold text-white uppercase tracking-widest flex items-center gap-2 px-2">
            <Cpu className="w-4 h-4 text-neo-amber" /> Quick Commands
          </h2>
          <div className="grid gap-4">
            <button onClick={() => navigate('/admin/scoring')} className="neo-glass p-6 rounded-2xl border-white/5 hover:border-neo-amber/30 transition-all text-left flex items-center gap-4 group">
              <div className="p-3 bg-neo-amber/10 rounded-xl group-hover:bg-neo-amber group-hover:text-neo-void transition-all">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white uppercase">Record Score</div>
                <div className="text-[10px] font-mono text-neo-slate/40 uppercase">Manual Score Entry</div>
              </div>
            </button>
            <button onClick={() => navigate('/admin/announcements')} className="neo-glass p-6 rounded-2xl border-white/5 hover:border-neo-cyan/30 transition-all text-left flex items-center gap-4 group">
              <div className="p-3 bg-neo-cyan/10 rounded-xl group-hover:bg-neo-cyan group-hover:text-neo-void transition-all">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white uppercase">Broadcast</div>
                <div className="text-[10px] font-mono text-neo-slate/40 uppercase">Post Announcement</div>
              </div>
            </button>
            <button onClick={() => navigate('/admin/leaderboard')} className="neo-glass p-6 rounded-2xl border-white/5 hover:border-neo-amber/30 transition-all text-left flex items-center gap-4 group">
              <div className="p-3 bg-neo-amber/10 rounded-xl group-hover:bg-neo-amber group-hover:text-neo-void transition-all">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white uppercase">Rankings</div>
                <div className="text-[10px] font-mono text-neo-slate/40 uppercase">View Leaderboard</div>
              </div>
            </button>
          </div>
        </div>

        {/* Pending Actions */}
        <div className="lg:col-span-2 space-y-6">
           <h2 className="text-sm font-mono font-bold text-white uppercase tracking-widest flex items-center gap-2 px-2">
            <Activity className="w-4 h-4 text-neo-cyan" /> Pending Submissions
          </h2>
          <div className="neo-glass rounded-2xl border-white/5 overflow-hidden">
            <div className="divide-y divide-white/5">
              {pendingSubs.length === 0 ? (
                <div className="p-12 text-center text-neo-slate/40 font-mono text-xs uppercase">
                  All submissions analyzed
                </div>
              ) : (
                pendingSubs.map(sub => (
                  <div key={sub.id} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div>
                      <div className="text-sm font-bold text-white">{sub.team_name}</div>
                      <div className="text-[10px] font-mono text-neo-slate/40 uppercase truncate max-w-[200px]">{sub.original_filename}</div>
                    </div>
                    <button onClick={() => navigate('/admin/submissions')} className="text-[10px] font-mono font-bold uppercase tracking-widest text-neo-cyan hover:neo-text-glow">
                      Review Package &gt;
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
