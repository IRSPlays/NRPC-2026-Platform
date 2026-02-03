import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, CheckCircle2, Clock, Eye, ExternalLink, Star, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { submissionsAPI, teamsAPI, getFileUrl } from '../../lib/api';
import { Submission } from '../../types';

export default function SubmissionReview() {
  const { isAdmin, isJudge } = useAuth();
  const navigate = useNavigate();
  
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'scored'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  
  // Scoring form
  const [scores, setScores] = useState({
    concept_score: 0,
    future_score: 0,
    organization_score: 0,
    aesthetics_score: 0,
  });
  const [judgeName, setJudgeName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin && !isJudge) {
      navigate('/admin');
      return;
    }
    loadData();
  }, [isAdmin, isJudge]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subsData, teamsData] = await Promise.all([
        submissionsAPI.getAll(),
        teamsAPI.getAll(),
      ]);
      
      // Enrich submissions with team info
      const enrichedSubs = subsData.map(sub => {
        const team = teamsData.find(t => t.id === sub.team_id);
        return {
          ...sub,
          team_name: team?.team_name,
          school_name: team?.school_name,
        };
      });
      
      setSubmissions(enrichedSubs);
    } catch (err: any) {
      setError(err.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreSubmit = async () => {
    if (!selectedSubmission) return;
    if (!judgeName.trim()) {
      setError('Please enter your name');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await submissionsAPI.score(selectedSubmission.id, {
        concept_score: scores.concept_score,
        future_score: scores.future_score,
        organization_score: scores.organization_score,
        aesthetics_score: scores.aesthetics_score,
        assessed_by: judgeName,
      });

      setSelectedSubmission(null);
      setScores({ concept_score: 0, future_score: 0, organization_score: 0, aesthetics_score: 0 });
      setJudgeName('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save scores');
    } finally {
      setSaving(false);
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'pending' ? !sub.concept_score :
      filter === 'scored' ? !!sub.concept_score :
      true;
    
    const matchesSearch = 
      (sub.team_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (sub.school_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      sub.original_filename.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-SG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTotalScore = (sub: Submission) => {
    if (!sub.concept_score) return null;
    return (sub.concept_score || 0) + (sub.future_score || 0) + (sub.organization_score || 0) + (sub.aesthetics_score || 0);
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
            <FileText className="w-8 h-8 text-[#0D7377]" />
            Submission Review
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Review and score poster submissions
          </p>
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {submissions.filter(s => !s.concept_score).length} pending
        </div>
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
            placeholder="Search teams, schools, or filenames..."
            className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0D7377] focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'scored'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                filter === f
                  ? 'bg-[#0D7377] text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#0D7377] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500 dark:text-slate-400">
            {searchTerm || filter !== 'all' ? 'No submissions match your criteria' : 'No submissions yet'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredSubmissions.map((sub) => {
            const totalScore = getTotalScore(sub);
            const isScored = !!sub.concept_score;
            
            return (
              <div
                key={sub.id}
                className={`bg-white dark:bg-slate-800 rounded-xl border transition-all overflow-hidden ${
                  isScored 
                    ? 'border-green-200 dark:border-green-800' 
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {sub.team_name}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          isScored
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {isScored ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Scored
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Pending
                            </span>
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {sub.school_name} • {formatDate(sub.submitted_at)}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 font-mono">
                        {sub.original_filename}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      {isScored && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-[#0D7377]">
                            {totalScore}
                          </div>
                          <div className="text-xs text-slate-400">/ 100</div>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        {sub.submission_type === 'link' ? (
                          <a
                            href={sub.external_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title="Open Link"
                          >
                            <ExternalLink className="w-5 h-5 text-slate-500" />
                          </a>
                        ) : (
                          <a
                            href={getFileUrl(sub.file_path)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title="View File"
                          >
                            <Eye className="w-5 h-5 text-slate-500" />
                          </a>
                        )}
                        
                        {!isScored && (
                          <button
                            onClick={() => {
                              setSelectedSubmission(sub);
                              setScores({ concept_score: 0, future_score: 0, organization_score: 0, aesthetics_score: 0 });
                            }}
                            className="px-4 py-2 bg-[#0D7377] text-white rounded-lg text-sm font-medium hover:bg-[#0A5A5D] transition-colors"
                          >
                            Score
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Score Details */}
                  {isScored && (
                    <div className="mt-4 grid grid-cols-4 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="text-center">
                        <div className="text-xs text-slate-500 dark:text-slate-400">Concept</div>
                        <div className="font-semibold text-slate-900 dark:text-white">{sub.concept_score}/40</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-slate-500 dark:text-slate-400">Future</div>
                        <div className="font-semibold text-slate-900 dark:text-white">{sub.future_score}/30</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-slate-500 dark:text-slate-400">Org</div>
                        <div className="font-semibold text-slate-900 dark:text-white">{sub.organization_score}/20</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-slate-500 dark:text-slate-400">Design</div>
                        <div className="font-semibold text-slate-900 dark:text-white">{sub.aesthetics_score}/10</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scoring Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Score Submission
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {selectedSubmission.team_name} • {selectedSubmission.school_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Judge Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={judgeName}
                  onChange={(e) => setJudgeName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0D7377] focus:border-transparent"
                />
              </div>

              {/* Scoring Categories */}
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-medium text-slate-900 dark:text-white">
                      Current Technology Concepts
                    </label>
                    <span className="text-sm text-slate-500">/ 40</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={scores.concept_score}
                    onChange={(e) => setScores({ ...scores, concept_score: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0D7377] focus:border-transparent"
                  />
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-medium text-slate-900 dark:text-white">
                      Future Innovations
                    </label>
                    <span className="text-sm text-slate-500">/ 30</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={scores.future_score}
                    onChange={(e) => setScores({ ...scores, future_score: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0D7377] focus:border-transparent"
                  />
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-medium text-slate-900 dark:text-white">
                      Organization & Clarity
                    </label>
                    <span className="text-sm text-slate-500">/ 20</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={scores.organization_score}
                    onChange={(e) => setScores({ ...scores, organization_score: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0D7377] focus:border-transparent"
                  />
                </div>

                <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-medium text-slate-900 dark:text-white">
                      Aesthetic Design
                    </label>
                    <span className="text-sm text-slate-500">/ 10</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={scores.aesthetics_score}
                    onChange={(e) => setScores({ ...scores, aesthetics_score: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0D7377] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Total */}
              <div className="bg-slate-100 dark:bg-slate-700/50 rounded-lg p-4 flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white">Total Score</span>
                <span className="text-2xl font-bold text-[#0D7377]">
                  {scores.concept_score + scores.future_score + scores.organization_score + scores.aesthetics_score}
                  <span className="text-sm font-normal text-slate-400 ml-1">/ 100</span>
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScoreSubmit}
                  disabled={saving}
                  className="flex-1 py-3 bg-[#0D7377] text-white rounded-lg font-medium hover:bg-[#0A5A5D] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Star className="w-5 h-5" />
                      Save Score
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
