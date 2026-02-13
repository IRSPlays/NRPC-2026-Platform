import { useState, useEffect } from 'react';
import { FileText, CheckCircle2, Clock, Eye, ExternalLink, AlertTriangle, Save, User, Activity, ArrowLeft } from 'lucide-react';
import { submissionsAPI, getFileUrl } from '../../lib/api';
import { Submission } from '../../types';

export default function SubmissionReview() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);

  // Scoring form state
  const [scores, setScores] = useState<{
    concept_score: number;
    future_score: number;
    organization_score: number;
    aesthetics_score: number;
    assessed_by: string;
  }>({
    concept_score: 0,
    future_score: 0,
    organization_score: 0,
    aesthetics_score: 0,
    assessed_by: ''
  });

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const data = await submissionsAPI.getAll();
      setSubmissions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (sub: Submission) => {
    setSelectedSub(sub);
    setScores({
      concept_score: sub.concept_score || 0,
      future_score: sub.future_score || 0,
      organization_score: sub.organization_score || 0,
      aesthetics_score: sub.aesthetics_score || 0,
      assessed_by: sub.assessed_by || ''
    });
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    setError('');
    setSuccess('');
    try {
      await submissionsAPI.score(selectedSub.id, scores);
      setSuccess('Analysis package finalized!');
      loadSubmissions();
      // Keep selected to show success
    } catch (err) {
      setError('Analysis failed to save');
    }
  };

  const totalScore = scores.concept_score + scores.future_score + scores.organization_score + scores.aesthetics_score;

  if (selectedSub) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedSub(null)} className="p-3 bg-white/5 rounded-2xl hover:bg-neo-cyan/10 hover:text-neo-cyan transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-heading font-black text-white uppercase tracking-tighter">Analysis <span className="text-neo-cyan">Terminal</span></h1>
            <p className="text-xs font-mono text-neo-slate/40 uppercase tracking-widest">{selectedSub.team_name} // {selectedSub.original_filename}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* File Viewer Card */}
          <div className="neo-glass rounded-[2rem] border-white/5 p-8 space-y-6">
            <div className="aspect-video bg-neo-void rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-4 group relative overflow-hidden">
               <div className="scanning-line absolute w-full top-0 left-0 opacity-10"></div>
               <FileText className="w-16 h-16 text-neo-cyan/20 group-hover:text-neo-cyan/40 transition-all" />
               <div className="text-center space-y-4">
                  <p className="text-xs font-mono text-neo-slate/40 uppercase">External Storage Link</p>
                  {selectedSub.submission_type === 'link' ? (
                    <a href={selectedSub.external_link} target="_blank" rel="noopener noreferrer" className="btn-neo py-3 px-8 flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" /> Open Source
                    </a>
                  ) : (
                    <a href={getFileUrl(selectedSub.file_path)} target="_blank" rel="noopener noreferrer" className="btn-neo py-3 px-8 flex items-center gap-2">
                      <Eye className="w-4 h-4" /> Open Artifact
                    </a>
                  )}
               </div>
            </div>
            
            <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-2">
              <div className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest">Metadata</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] text-neo-slate/30 uppercase">Submitted</div>
                  <div className="text-sm font-mono text-white">{new Date(selectedSub.submitted_at).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] text-neo-slate/30 uppercase">Category</div>
                  <div className="text-sm font-mono text-neo-cyan">{selectedSub.original_filename.includes('Primary') ? 'Primary' : 'Secondary'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Scoring Form */}
          <div className="neo-glass rounded-[2rem] border-white/5 p-8 relative">
            <form onSubmit={handleSubmitScore} className="space-y-8">
              <div className="flex items-center justify-between border-b border-white/5 pb-6">
                 <div className="text-xs font-mono font-bold text-white uppercase tracking-widest">Grading Matrix</div>
                 <div className="text-4xl font-black font-mono text-neo-cyan">{totalScore.toString().padStart(2, '0')}<span className="text-sm text-neo-slate/30 font-normal ml-1">/ 100</span></div>
              </div>

              {success && <div className="p-4 rounded-xl bg-neo-cyan/10 border border-neo-cyan/30 text-neo-cyan text-xs font-mono uppercase tracking-widest flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {success}</div>}
              {error && <div className="p-4 rounded-xl bg-neo-amber/10 border border-neo-amber/30 text-neo-amber text-xs font-mono uppercase tracking-widest flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {error}</div>}

              <div className="grid gap-6">
                {[
                  { label: 'Core Concept (40)', key: 'concept_score' as const, max: 40 },
                  { label: 'Future Innovation (30)', key: 'future_score' as const, max: 30 },
                  { label: 'Logic/Organization (20)', key: 'organization_score' as const, max: 20 },
                  { label: 'Visual Aesthetic (10)', key: 'aesthetics_score' as const, max: 10 },
                ].map(item => (
                  <div key={item.key} className="space-y-2">
                    <div className="flex justify-between items-center px-4">
                      <label className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest">{item.label}</label>
                      <span className="text-sm font-mono font-bold text-neo-cyan">{scores[item.key]}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={item.max}
                      value={scores[item.key]}
                      onChange={e => setScores({ ...scores, [item.key]: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-neo-cyan"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest ml-4">Assessing Officer</label>
                <div className="relative">
                  <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-neo-slate/40" />
                  <input
                    required
                    type="text"
                    value={scores.assessed_by}
                    onChange={e => setScores({ ...scores, assessed_by: e.target.value })}
                    className="w-full bg-neo-void/50 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white font-mono text-sm focus:border-neo-cyan/40 outline-none"
                    placeholder="Enter name..."
                  />
                </div>
              </div>

              <button type="submit" className="w-full btn-neo py-4 flex items-center justify-center gap-3">
                <Save className="w-4 h-4" /> Finalize Analysis
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-3xl font-heading font-black text-white uppercase tracking-tighter">
          Uplink <span className="text-neo-cyan">Review</span>
        </h1>
        <p className="text-xs font-mono text-neo-slate/40 uppercase tracking-[0.2em] mt-1">Incoming Project Analysis Logs</p>
      </div>

      <div className="neo-glass rounded-3xl border-white/5 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><Activity className="animate-spin text-neo-cyan" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-8 py-4 text-left text-[10px] font-mono text-neo-slate/40 uppercase tracking-[0.2em]">Package ID</th>
                  <th className="px-8 py-4 text-left text-[10px] font-mono text-neo-slate/40 uppercase tracking-[0.2em]">Source Unit</th>
                  <th className="px-8 py-4 text-left text-[10px] font-mono text-neo-slate/40 uppercase tracking-[0.2em]">Protocol State</th>
                  <th className="px-8 py-4 text-center text-[10px] font-mono text-neo-slate/40 uppercase tracking-[0.2em]">Score</th>
                  <th className="px-8 py-4 text-right text-[10px] font-mono text-neo-slate/40 uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {submissions.map(sub => (
                  <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6 font-mono text-xs text-neo-cyan/60">#UP-{sub.id}</td>
                    <td className="px-8 py-6">
                      <div className="text-sm font-bold text-white group-hover:text-neo-cyan transition-colors">{sub.team_name}</div>
                      <div className="text-[10px] font-mono text-neo-slate/40 uppercase truncate max-w-[200px]">{sub.original_filename}</div>
                    </td>
                    <td className="px-8 py-6">
                      {sub.concept_score ? (
                        <span className="flex items-center gap-2 text-[10px] font-mono text-neo-cyan uppercase">
                          <CheckCircle2 className="w-3 h-3" /> Analysis Complete
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-[10px] font-mono text-neo-amber uppercase animate-pulse">
                          <Clock className="w-3 h-3" /> Awaiting Analysis
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-center font-mono font-bold text-white">
                      {sub.concept_score ? (
                        (sub.concept_score || 0) + 
                        (sub.future_score || 0) + 
                        (sub.organization_score || 0) + 
                        (sub.aesthetics_score || 0)
                      ) : '--'}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => handleSelect(sub)}
                        className={`btn-neo py-2 px-4 text-[10px] ${sub.concept_score ? 'opacity-50 hover:opacity-100' : 'neo-text-glow border-neo-cyan shadow-[0_0_10px_rgba(102,252,241,0.2)]'}`}
                      >
                        {sub.concept_score ? 'Re-Evaluate' : 'Analyze Package'}
                      </button>
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
