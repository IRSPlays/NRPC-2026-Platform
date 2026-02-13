import { useState, useEffect } from 'react';
import { Video, FileText, CheckCircle2, Clock, ExternalLink, AlertTriangle, Save, User, Activity, ArrowLeft, Cpu, ClipboardCheck, Timer } from 'lucide-react';
import { submissionsAPI, getFileUrl } from '../../lib/api';
import { Submission } from '../../types';

export default function RobotPerformanceReview() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);

  // Scoring form state - aligned with existing columns
  // concept_score (40) -> Autonomous Strategy
  // future_score (30) -> Execution  
  // organization_score (20) -> Documentation
  // aesthetics_score (10) -> Video Compliance
  const [scores, setScores] = useState({
    concept_score: 0,       // Autonomous Strategy (40)
    future_score: 0,        // Execution (30)
    organization_score: 0,  // Documentation (20)
    aesthetics_score: 0,    // Video Compliance (10)
    assessed_by: ''
  });

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const data = await submissionsAPI.getAll();
      // Filter only robot_run submissions
      const robotSubs = (data || []).filter((sub: Submission) => sub.submission_type === 'robot_run');
      setSubmissions(robotSubs);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch robot performance submissions');
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
      setSuccess('Performance evaluation finalized!');
      loadSubmissions();
    } catch (err) {
      setError('Evaluation failed to save');
    }
  };

  const totalScore = scores.concept_score + scores.future_score + scores.organization_score + scores.aesthetics_score;

  // Get video link from external_link (the video URL)
  // Get scoring sheet from file_path (the uploaded file)
  const getVideoLink = (sub: Submission) => sub.external_link || '';
  const getScoringSheetFile = (sub: Submission) => sub.file_path || '';

  if (selectedSub) {
    const videoLink = getVideoLink(selectedSub);
    const sheetFile = getScoringSheetFile(selectedSub);

    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedSub(null)} className="p-3 bg-white/5 rounded-2xl hover:bg-neo-amber/10 hover:text-neo-amber transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-heading font-black text-white uppercase tracking-tighter">Performance <span className="text-neo-amber">Evaluation</span></h1>
            <p className="text-xs font-mono text-neo-slate/40 uppercase tracking-widest">{selectedSub.team_name} // {selectedSub.original_filename}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Video & Sheet Viewer */}
          <div className="neo-glass rounded-[2rem] border-white/5 p-8 space-y-6">
            {/* Video Link */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-neo-amber font-bold uppercase tracking-widest text-xs">
                <Video className="w-4 h-4" />
                Run Video
              </div>
              {videoLink ? (
                <a href={videoLink} target="_blank" rel="noopener noreferrer" className="block bg-neo-void/50 border border-neo-amber/20 rounded-2xl p-6 hover:border-neo-amber/50 transition-all">
                  <div className="flex items-center gap-4">
                    <ExternalLink className="w-8 h-8 text-neo-amber" />
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-mono text-sm truncate">{videoLink}</div>
                      <div className="text-[10px] text-neo-slate/40 uppercase">Click to open video</div>
                    </div>
                  </div>
                </a>
              ) : (
                <div className="bg-neo-void/30 border border-white/5 rounded-2xl p-6 text-center">
                  <Video className="w-8 h-8 text-neo-slate/20 mx-auto mb-2" />
                  <div className="text-neo-slate/40 text-xs font-mono uppercase">No video link submitted</div>
                </div>
              )}
            </div>

            {/* Scoring Sheet File */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-neo-cyan font-bold uppercase tracking-widest text-xs">
                <ClipboardCheck className="w-4 h-4" />
                Scoring Sheet
              </div>
              {sheetFile ? (
                <a href={getFileUrl(sheetFile)} target="_blank" rel="noopener noreferrer" className="block bg-neo-void/50 border border-neo-cyan/20 rounded-2xl p-6 hover:border-neo-cyan/50 transition-all">
                  <div className="flex items-center gap-4">
                    <FileText className="w-8 h-8 text-neo-cyan" />
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-mono text-sm truncate">{selectedSub.original_filename}</div>
                      <div className="text-[10px] text-neo-slate/40 uppercase">Click to view scoring sheet</div>
                    </div>
                  </div>
                </a>
              ) : (
                <div className="bg-neo-void/30 border border-white/5 rounded-2xl p-6 text-center">
                  <FileText className="w-8 h-8 text-neo-slate/20 mx-auto mb-2" />
                  <div className="text-neo-slate/40 text-xs font-mono uppercase">No scoring sheet submitted</div>
                </div>
              )}
            </div>

            {/* Mission Rules Reminder */}
            <div className="p-4 bg-neo-amber/5 border border-neo-amber/20 rounded-xl space-y-2">
              <div className="text-[10px] font-mono text-neo-amber uppercase tracking-widest font-bold">Compliance Check</div>
              <div className="grid grid-cols-3 gap-2 text-[9px] font-mono text-neo-slate/40">
                <div className="flex items-center gap-1"><Timer className="w-3 h-3" /> Pre-Run: 3m</div>
                <div className="flex items-center gap-1"><Timer className="w-3 h-3" /> Run: 2m30s</div>
                <div className="flex items-center gap-1"><Timer className="w-3 h-3" /> Post-Run: 1m</div>
              </div>
              <div className="text-[9px] font-mono text-neo-slate/30">720p minimum • No edits • Visible timer</div>
            </div>
          </div>

          {/* Grading Form */}
          <div className="neo-glass rounded-[2rem] border-white/5 p-8 relative">
            <form onSubmit={handleSubmitScore} className="space-y-8">
              <div className="flex items-center justify-between border-b border-white/5 pb-6">
                <div className="text-xs font-mono font-bold text-white uppercase tracking-widest">Evaluation Matrix</div>
                <div className="text-4xl font-black font-mono text-neo-amber">{totalScore.toString().padStart(2, '0')}<span className="text-sm text-neo-slate/30 font-normal ml-1">/ 100</span></div>
              </div>

              {success && <div className="p-4 rounded-xl bg-neo-cyan/10 border border-neo-cyan/30 text-neo-cyan text-xs font-mono uppercase tracking-widest flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {success}</div>}
              {error && <div className="p-4 rounded-xl bg-neo-amber/10 border border-neo-amber/30 text-neo-amber text-xs font-mono uppercase tracking-widest flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {error}</div>}

              <div className="grid gap-6">
                {/* Autonomous Strategy (40) */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-4">
                    <label className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest">Autonomous Strategy (40)</label>
                    <span className="text-sm font-mono font-bold text-neo-amber">{scores.concept_score}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={40}
                    value={scores.concept_score}
                    onChange={e => setScores({ ...scores, concept_score: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-neo-amber"
                  />
                  <div className="text-[8px] font-mono text-neo-slate/30 px-4">Mission selection, autonomous choices, innovation, robot design</div>
                </div>

                {/* Execution (30) */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-4">
                    <label className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest">Execution (30)</label>
                    <span className="text-sm font-mono font-bold text-neo-amber">{scores.future_score}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={30}
                    value={scores.future_score}
                    onChange={e => setScores({ ...scores, future_score: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-neo-amber"
                  />
                  <div className="text-[8px] font-mono text-neo-slate/30 px-4">How well missions were completed, consistency, reliability</div>
                </div>

                {/* Documentation (20) */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-4">
                    <label className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest">Documentation (20)</label>
                    <span className="text-sm font-mono font-bold text-neo-amber">{scores.organization_score}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={20}
                    value={scores.organization_score}
                    onChange={e => setScores({ ...scores, organization_score: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-neo-amber"
                  />
                  <div className="text-[8px] font-mono text-neo-slate/30 px-4">Scoring sheet completeness, accuracy, clear annotations</div>
                </div>

                {/* Video Compliance (10) */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-4">
                    <label className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest">Video Compliance (10)</label>
                    <span className="text-sm font-mono font-bold text-neo-amber">{scores.aesthetics_score}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={10}
                    value={scores.aesthetics_score}
                    onChange={e => setScores({ ...scores, aesthetics_score: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-neo-amber"
                  />
                  <div className="text-[8px] font-mono text-neo-slate/30 px-4">Follows rules (3m/2m30s/1m), 720p+ resolution, clear footage</div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest ml-4">Evaluating Officer</label>
                <div className="relative">
                  <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-neo-slate/40" />
                  <input
                    required
                    type="text"
                    value={scores.assessed_by}
                    onChange={e => setScores({ ...scores, assessed_by: e.target.value })}
                    className="w-full bg-neo-void/50 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white font-mono text-sm focus:border-neo-amber/40 outline-none"
                    placeholder="Enter name..."
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-neo-amber text-neo-void py-4 flex items-center justify-center gap-3 font-bold uppercase tracking-widest rounded-2xl hover:shadow-[0_0_30px_rgba(255,179,0,0.4)] transition-all">
                <Save className="w-4 h-4" /> Finalize Evaluation
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
          Performance <span className="text-neo-amber">Logs</span>
        </h1>
        <p className="text-xs font-mono text-neo-slate/40 uppercase tracking-[0.2em] mt-1">Robot Run Submissions</p>
      </div>

      <div className="neo-glass rounded-3xl border-white/5 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><Activity className="animate-spin text-neo-amber" /></div>
        ) : submissions.length === 0 ? (
          <div className="p-20 text-center">
            <Cpu className="w-12 h-12 text-neo-slate/20 mx-auto mb-4" />
            <div className="text-neo-slate/40 font-mono text-xs uppercase tracking-widest">No robot performance submissions yet</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-8 py-4 text-left text-[10px] font-mono text-neo-slate/40 uppercase tracking-[0.2em]">Package ID</th>
                  <th className="px-8 py-4 text-left text-[10px] font-mono text-neo-slate/40 uppercase tracking-[0.2em]">Unit</th>
                  <th className="px-8 py-4 text-left text-[10px] font-mono text-neo-slate/40 uppercase tracking-[0.2em]">Video</th>
                  <th className="px-8 py-4 text-left text-[10px] font-mono text-neo-slate/40 uppercase tracking-[0.2em]">Sheet</th>
                  <th className="px-8 py-4 text-center text-[10px] font-mono text-neo-slate/40 uppercase tracking-[0.2em]">Score</th>
                  <th className="px-8 py-4 text-center text-[10px] font-mono text-neo-slate/40 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-8 py-4 text-right text-[10px] font-mono text-neo-slate/40 uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {submissions.map(sub => {
                  const hasScore = sub.concept_score && sub.concept_score > 0;
                  return (
                    <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-6 font-mono text-xs text-neo-amber/60">#RP-{sub.id}</td>
                      <td className="px-8 py-6">
                        <div className="text-sm font-bold text-white group-hover:text-neo-amber transition-colors">{sub.team_name}</div>
                        <div className="text-[10px] font-mono text-neo-slate/40 uppercase">{sub.school_name}</div>
                      </td>
                      <td className="px-8 py-6">
                        {sub.external_link ? (
                          <a href={sub.external_link} target="_blank" rel="noopener noreferrer" className="text-neo-cyan hover:underline text-xs font-mono truncate max-w-[150px] block">
                            View Video
                          </a>
                        ) : (
                          <span className="text-neo-slate/30 text-xs font-mono">--</span>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        {sub.file_path ? (
                          <a href={getFileUrl(sub.file_path)} target="_blank" rel="noopener noreferrer" className="text-neo-cyan hover:underline text-xs font-mono truncate max-w-[150px] block">
                            View Sheet
                          </a>
                        ) : (
                          <span className="text-neo-slate/30 text-xs font-mono">--</span>
                        )}
                      </td>
                      <td className="px-8 py-6 text-center font-mono font-bold text-white">
                        {hasScore ? ((sub.concept_score || 0) + (sub.future_score || 0) + (sub.organization_score || 0) + (sub.aesthetics_score || 0)) : '--'}
                      </td>
                      <td className="px-8 py-6 text-center">
                        {hasScore ? (
                          <span className="inline-flex items-center gap-2 text-[10px] font-mono text-neo-cyan uppercase">
                            <CheckCircle2 className="w-3 h-3" /> Evaluated
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 text-[10px] font-mono text-neo-amber uppercase animate-pulse">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => handleSelect(sub)}
                          className={`btn-neo py-2 px-4 text-[10px] ${hasScore ? 'opacity-50 hover:opacity-100' : 'neo-text-glow border-neo-amber shadow-[0_0_10px_rgba(255,179,0,0.2)]'}`}
                        >
                          {hasScore ? 'Re-Evaluate' : 'Evaluate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
