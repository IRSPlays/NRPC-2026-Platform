import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Upload, FileText, Activity, Target, ExternalLink, Eye, Users, Radio } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { scoresAPI, submissionsAPI, getFileUrl } from '../lib/api';
import { Score, Submission } from '../types';

export default function TeamDashboard() {
  const { isTeam, teamId, teamName } = useAuth();
  const navigate = useNavigate();
  
  const [scores, setScores] = useState<Score[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isTeam) {
      navigate('/team-login');
      return;
    }
    loadData();
  }, [isTeam, teamId, navigate]);

  const loadData = async () => {
    if (!teamId) return;
    setLoading(true);
    try {
      const [scoresData, submissionsData] = await Promise.all([
        scoresAPI.getByTeam(teamId),
        submissionsAPI.getByTeam(teamId)
      ]);
      setScores(scoresData);
      setSubmissions(submissionsData);
      setErrorMsg('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-SG', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const getBestScore = () => {
    if (scores.length === 0) return 0;
    return Math.max(...scores.map(s => s.total_score));
  };

  const getPosterScore = (sub: Submission) => {
    if (!sub.concept_score) return 0;
    return (sub.concept_score || 0) + (sub.future_score || 0) + (sub.organization_score || 0) + (sub.aesthetics_score || 0);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="w-12 h-12 border-2 border-neo-cyan/20 border-t-neo-cyan rounded-full animate-spin" />
        <span className="text-xs font-mono text-neo-cyan/60 animate-pulse uppercase tracking-[0.4em]">Loading Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* Team Header */}
      <section className="relative overflow-hidden neo-glass rounded-[2rem] border-neo-cyan/10 p-10">
        <div className="scanning-line absolute w-full top-0 left-0 opacity-10"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-neo-cyan/10 flex items-center justify-center border border-neo-cyan/30">
              <Users className="w-8 h-8 text-neo-cyan" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-neo-cyan/60 uppercase tracking-[0.3em] mb-1">Authenticated Team Member</div>
              <h1 className="text-4xl font-heading font-black text-white uppercase tracking-tighter">
                Team: <span className="text-neo-cyan neo-text-glow">{teamName || 'Team Dashboard'}</span>
              </h1>
            </div>
          </div>
          <button
            onClick={() => navigate('/submit')}
            className="btn-neo-amber flex items-center gap-3 py-4 px-8"
          >
            <Upload className="w-5 h-5" />
            Submit Poster
          </button>
        </div>
      </section>

      {/* Metrics Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Total Missions', val: scores.length, icon: Radio, color: 'text-neo-cyan' },
          { label: 'Highest Score', val: getBestScore(), icon: Target, color: 'text-neo-amber', sub: '/ 155 PTS' },
          { label: 'Submissions', val: submissions.length, icon: FileText, color: 'text-neo-cyan' },
          { label: 'Poster Score', val: submissions[0] && submissions[0].concept_score ? getPosterScore(submissions[0]) : '--', icon: Activity, color: 'text-neo-amber', sub: '/ 100 PTS' },
        ].map((m, i) => (
          <div key={i} className="neo-glass rounded-2xl p-6 border-white/5 relative group hover:border-neo-cyan/30 transition-all">
            <div className="flex items-start justify-between mb-4">
              <span className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest">{m.label}</span>
              <m.icon className={`w-4 h-4 ${m.color} opacity-40 group-hover:opacity-100 transition-opacity`} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-black font-mono ${m.color}`}>{m.val}</span>
              {m.sub && <span className="text-[10px] font-mono text-neo-slate/30">{m.sub}</span>}
            </div>
          </div>
        ))}
      </section>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Mission History */}
        <div className="neo-glass rounded-3xl border-white/5 overflow-hidden">
          <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <h2 className="text-sm font-mono font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2">
              <Trophy className="w-4 h-4 text-neo-cyan" />
              Mission Results
            </h2>
          </div>
          
          <div className="divide-y divide-white/5">
            {scores.length === 0 ? (
              <div className="p-12 text-center text-neo-slate/30 font-mono text-xs uppercase tracking-widest">
                No scores recorded yet
              </div>
            ) : (
              scores.map((score) => (
                <div key={score.id} className="p-6 hover:bg-white/[0.02] transition-colors flex items-center justify-between group">
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono text-neo-cyan/40 uppercase tracking-tighter">Mission ID: {score.id} // Date: {formatDate(score.created_at)}</div>
                    <div className="text-xl font-black font-mono text-white group-hover:text-neo-cyan transition-colors">{score.total_score} PTS</div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-neo-slate/40 uppercase">Time Taken</div>
                      <div className="text-sm font-mono text-neo-amber">{formatTime(score.completion_time_seconds)}</div>
                    </div>
                    <div className="w-px h-8 bg-white/5"></div>
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-neo-slate/40 uppercase">Judge</div>
                      <div className="text-sm font-mono text-neo-slate/80">{score.judge_name}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Submissions */}
        <div className="neo-glass rounded-3xl border-white/5 overflow-hidden">
          <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <h2 className="text-sm font-mono font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2">
              <FileText className="w-4 h-4 text-neo-amber" />
              Poster Submissions
            </h2>
          </div>
          
          <div className="divide-y divide-white/5">
            {submissions.length === 0 ? (
              <div className="p-12 text-center">
                <button onClick={() => navigate('/submit')} className="text-xs font-mono text-neo-amber hover:text-white uppercase tracking-widest transition-colors">
                  [!] Click here to submit your poster
                </button>
              </div>
            ) : (
              submissions.map((sub) => (
                <div key={sub.id} className="p-6 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-white truncate max-w-[200px]">{sub.original_filename}</div>
                      <div className="text-[10px] font-mono text-neo-slate/40 uppercase">{formatDate(sub.submitted_at)}</div>
                    </div>
                    {sub.concept_score ? (
                      <span className="px-3 py-1 bg-neo-cyan/10 border border-neo-cyan/20 text-neo-cyan text-[10px] font-mono uppercase rounded-full">Scored</span>
                    ) : (
                      <span className="px-3 py-1 bg-white/5 border border-white/10 text-neo-slate/40 text-[10px] font-mono uppercase rounded-full animate-pulse">Pending...</span>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    {sub.submission_type === 'link' ? (
                      <a href={sub.external_link} target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-neo-cyan hover:neo-text-glow flex items-center gap-2 uppercase tracking-widest border border-neo-cyan/20 px-3 py-2 rounded-lg bg-neo-cyan/5">
                        <ExternalLink className="w-3 h-3" /> View Link
                      </a>
                    ) : (
                      <a href={getFileUrl(sub.file_path)} target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-neo-cyan hover:neo-text-glow flex items-center gap-2 uppercase tracking-widest border border-neo-cyan/20 px-3 py-2 rounded-lg bg-neo-cyan/5">
                        <Eye className="w-3 h-3" /> View File
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
