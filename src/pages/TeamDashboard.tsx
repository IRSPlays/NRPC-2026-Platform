import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Upload, FileText, Clock, AlertCircle, CheckCircle2, ExternalLink, Eye } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { scoresAPI, submissionsAPI, getFileUrl } from '../lib/api';
import { Score, Submission } from '../types';

export default function TeamDashboard() {
  const { isTeam, teamId, teamName } = useAuth();
  const navigate = useNavigate();
  
  const [scores, setScores] = useState<Score[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isTeam) {
      navigate('/team-login');
      return;
    }
    loadData();
  }, [isTeam, teamId]);

  const loadData = async () => {
    if (!teamId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const [scoresData, submissionsData] = await Promise.all([
        scoresAPI.getByTeam(teamId),
        submissionsAPI.getByTeam(teamId)
      ]);
      
      setScores(scoresData);
      setSubmissions(submissionsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
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
    return new Date(dateString).toLocaleString('en-SG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getBestScore = () => {
    if (scores.length === 0) return null;
    return scores.reduce((best, current) => 
      current.total_score > (best?.total_score ?? -1) ? current : best
    );
  };

  const getTotalPosterScore = (sub: Submission) => {
    if (!sub.concept_score) return null;
    return (sub.concept_score || 0) + 
           (sub.future_score || 0) + 
           (sub.organization_score || 0) + 
           (sub.aesthetics_score || 0);
  };

  if (!isTeam) {
    return null;
  }

  const bestScore = getBestScore();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 rounded-2xl p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
              <Trophy className="w-8 h-8 text-[#14FFEC]" />
              Team Dashboard
            </h1>
            <p className="text-slate-400 mt-2 text-lg">
              Welcome back, <span className="text-white font-semibold">{teamName}</span>
            </p>
          </div>
          <button
            onClick={() => navigate('/submit')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0D7377] hover:bg-[#0A5A5D] rounded-lg font-medium transition-colors"
          >
            <Upload className="w-5 h-5" />
            Submit Poster
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#0D7377] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Robot Runs</div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{scores.length}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Best Score</div>
              <div className="text-3xl font-bold text-[#0D7377]">
                {bestScore ? bestScore.total_score : '-'}
              </div>
              <div className="text-xs text-slate-400 mt-1">/ 155 points</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Poster Submissions</div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{submissions.length}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Poster Score</div>
              <div className="text-3xl font-bold text-[#0D7377]">
                {submissions.length > 0 && submissions[0].concept_score 
                  ? getTotalPosterScore(submissions[0]) 
                  : '-'}
              </div>
              <div className="text-xs text-slate-400 mt-1">/ 100 points</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Robot Scores */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#0D7377]" />
                  Robot Mission Scores
                </h2>
                <a 
                  href="/calculator" 
                  className="text-sm text-[#0D7377] hover:underline flex items-center gap-1"
                >
                  Calculator <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              
              {scores.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">No scores recorded yet</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Your scores will appear here after judging
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {scores.map((score) => (
                    <div key={score.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-900 dark:text-white">
                          Run #{score.id}
                        </span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {formatDate(score.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-[#0D7377] font-semibold">
                          <Trophy className="w-4 h-4" />
                          {score.total_score} pts
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                          <Clock className="w-4 h-4" />
                          {formatTime(score.completion_time_seconds)}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400">
                          Judge: {score.judge_name}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                        Missions: {score.mission1}+{score.mission2}+{score.mission3}+{score.mission4}+{score.mission5}+{score.mission6}+{score.mission7}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Poster Submissions */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#0D7377]" />
                  Poster Submissions
                </h2>
                <button
                  onClick={() => navigate('/submit')}
                  className="text-sm text-[#0D7377] hover:underline"
                >
                  + New Submission
                </button>
              </div>
              
              {submissions.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">No submissions yet</p>
                  <button
                    onClick={() => navigate('/submit')}
                    className="mt-4 px-4 py-2 bg-[#0D7377] text-white rounded-lg text-sm hover:bg-[#0A5A5D] transition-colors"
                  >
                    Submit Your Poster
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {submissions.map((sub) => (
                    <div key={sub.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="font-medium text-slate-900 dark:text-white block">
                            {sub.original_filename}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(sub.submitted_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {sub.concept_score ? (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Scored
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {sub.concept_score && (
                        <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                          <div className="bg-slate-50 dark:bg-slate-700 p-2 rounded text-center">
                            <div className="text-slate-500 dark:text-slate-400">Concept</div>
                            <div className="font-semibold text-slate-900 dark:text-white">{sub.concept_score}/40</div>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-700 p-2 rounded text-center">
                            <div className="text-slate-500 dark:text-slate-400">Future</div>
                            <div className="font-semibold text-slate-900 dark:text-white">{sub.future_score}/30</div>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-700 p-2 rounded text-center">
                            <div className="text-slate-500 dark:text-slate-400">Org</div>
                            <div className="font-semibold text-slate-900 dark:text-white">{sub.organization_score}/20</div>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-700 p-2 rounded text-center">
                            <div className="text-slate-500 dark:text-slate-400">Design</div>
                            <div className="font-semibold text-slate-900 dark:text-white">{sub.aesthetics_score}/10</div>
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-3 flex items-center gap-2">
                        {sub.submission_type === 'link' ? (
                          <a
                            href={sub.external_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[#0D7377] hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View Link
                          </a>
                        ) : (
                          <a
                            href={getFileUrl(sub.file_path)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[#0D7377] hover:underline flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View File
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
