import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Link2, FileText, AlertCircle, CheckCircle2, FileUp, Info, Zap, Video, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { submissionsAPI, teamsAPI } from '../lib/api';

type TabType = 'poster' | 'robot_run';

export default function Submit() {
  const { isTeam, teamId, teamName, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>('poster');
  const [posterMethod, setPosterMethod] = useState<'file' | 'link'>('file');
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterLink, setPosterLink] = useState('');
  const [posterFilename, setPosterFilename] = useState('');
  const [posterFilenameTouched, setPosterFilenameTouched] = useState(false);
  const [posterCategory, setPosterCategory] = useState<'Primary' | 'Secondary'>('Primary');

  const [robotVideoLink, setRobotVideoLink] = useState('');
  const [robotVideoFilename, setRobotVideoFilename] = useState('');
  const [robotVideoFilenameTouched, setRobotVideoFilenameTouched] = useState(false);
  const [robotSheetFile, setRobotSheetFile] = useState<File | null>(null);
  const [robotSheetFilename, setRobotSheetFilename] = useState('');
  const [robotSheetFilenameTouched, setRobotSheetFilenameTouched] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [posterIsDragging, setPosterIsDragging] = useState(false);
  const [robotIsDragging, setRobotIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const sanitizedTeamName = teamName ? teamName.replace(/\s+/g, '') : 'Team';
  const sanitizedSchoolName = schoolName ? schoolName.replace(/\s+/g, '') : 'School';

  const posterFileInputRef = useRef<HTMLInputElement>(null);
  const robotSheetInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isTeam && !authLoading) {
      navigate('/team-login');
    }
  }, [isTeam, authLoading, navigate]);

  if (!isTeam || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="w-12 h-12 border-2 border-neo-cyan/20 border-t-neo-cyan rounded-full animate-spin" />
        <span className="text-xs font-mono text-neo-cyan/60 animate-pulse uppercase tracking-[0.4em]">Loading...</span>
      </div>
    );
  }

  const validatePosterFile = (selectedFile: File) => {
    const validTypes = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', 
      'application/vnd.ms-powerpoint', 
      'image/jpeg', 
      'image/png', 
      'image/jpg',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload PDF, PPTX, Images, or Excel.');
      return;
    }
    setPosterFile(selectedFile);
    if (!posterFilenameTouched) {
      setPosterFilename(selectedFile.name);
    }
    setError('');
  };

  const validateRobotSheetFile = (selectedFile: File) => {
    const validTypes = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', 
      'application/vnd.ms-powerpoint', 
      'image/jpeg', 
      'image/png', 
      'image/jpg',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload PDF, PPTX, Images, or Excel.');
      return;
    }
    setRobotSheetFile(selectedFile);
    if (!robotSheetFilenameTouched) {
      setRobotSheetFilename(generateRobotFilename('ScoringSheet'));
    }
    setError('');
  };

  const handlePosterDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setPosterIsDragging(true);
  };

  const handlePosterDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setPosterIsDragging(false);
  };

  const handlePosterDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setPosterIsDragging(false);
    const droppedFile = e.dataTransfer?.files?.[0];
    if (droppedFile) validatePosterFile(droppedFile);
  };

  const handleRobotDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setRobotIsDragging(true);
  };

  const handleRobotDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setRobotIsDragging(false);
  };

  const handleRobotDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setRobotIsDragging(false);
    const droppedFile = e.dataTransfer?.files?.[0];
    if (droppedFile) validateRobotSheetFile(droppedFile);
  };

  const validateFilename = (filename: string) => {
    if (!teamName) return false;
    
    if (activeTab === 'poster') {
      const pattern = new RegExp(`^${teamName.replace(/\s+/g, '')}_[A-Za-z0-9]+_DeExtinction_(Primary|Secondary)\\.(pdf|pptx?|png|jpg|jpeg)$`, 'i');
      return pattern.test(filename);
    } else {
      // Robot run validation: (TeamName)_(School)_RunVideo or (TeamName)_(School)_ScoringSheet
      const pattern = new RegExp(`^${teamName.replace(/\s+/g, '')}_[A-Za-z0-9]+_(RunVideo|ScoringSheet).*`, 'i');
      return pattern.test(filename);
    }
  };

  const generateRobotFilename = useCallback((kind: 'RunVideo' | 'ScoringSheet') => {
    if (!teamName) return '';
    return `${sanitizedTeamName}_${sanitizedSchoolName}_${kind}`;
  }, [teamName, sanitizedTeamName, sanitizedSchoolName]);

  useEffect(() => {
    if (!teamId) return;
    const loadTeamSchool = async () => {
      try {
        const teams = await teamsAPI.getAll();
        const team = teams.find((t) => String(t.id) === String(teamId));
        if (team) {
          setSchoolName(team.school_name);
        }
      } catch {
        // ignore
      }
    };
    loadTeamSchool();
  }, [teamId]);

  useEffect(() => {
    if (activeTab !== 'robot_run') return;
      if (!robotVideoFilenameTouched) {
        const generated = generateRobotFilename('RunVideo');
        if (generated) {
          setRobotVideoFilename(generated);
        }
      }
    if (!robotSheetFilenameTouched) {
      const generated = generateRobotFilename('ScoringSheet');
      if (generated) {
        setRobotSheetFilename(generated);
      }
    }
  }, [activeTab, robotVideoFilenameTouched, robotSheetFilenameTouched, generateRobotFilename]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (activeTab === 'poster') {
      if (!validateFilename(posterFilename)) {
        setError(`Filename format error.\nCorrect format: TEAMNAME_SCHOOLNAME_DeExtinction_Category.ext`);
        return;
      }
      if (posterMethod === 'file' && !posterFile) {
        setError('Please upload a poster file.');
        return;
      }
      if (posterMethod === 'link' && !posterLink) {
        setError('Please provide a poster link.');
        return;
      }

      setLoading(true);
      try {
        if (posterMethod === 'file' && posterFile) {
          await submissionsAPI.uploadFile(Number(teamId), posterFile, posterFilename, 'file');
        } else if (posterMethod === 'link' && posterLink) {
          await submissionsAPI.submitLink(Number(teamId), posterLink, posterFilename, 'link');
        }

        setSuccess('Submission successful! Returning to dashboard...');
        setTimeout(() => navigate('/team-dashboard'), 2000);
      } catch (err: any) {
        setError(err.message || 'Submission failed.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!robotVideoLink) {
      setError('Please provide a video link.');
      return;
    }

    if (!robotSheetFile) {
      setError('Please upload the scoring sheet file.');
      return;
    }

    if (!validateFilename(robotVideoFilename) || !validateFilename(robotSheetFilename)) {
      setError('Filename format error.\nCorrect format: TEAMNAME_SCHOOLNAME_RunVideo OR TEAMNAME_SCHOOLNAME_ScoringSheet');
      return;
    }

    setLoading(true);
    try {
      await submissionsAPI.submitLink(Number(teamId), robotVideoLink, robotVideoFilename, 'link');
      await submissionsAPI.uploadFile(Number(teamId), robotSheetFile, robotSheetFilename, 'file');

      setSuccess('Robot performance submission successful! Returning to dashboard...');
      setTimeout(() => navigate('/team-dashboard'), 2000);
    } catch (err: any) {
      setError(err.message || 'Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab: TabType) => {
    setActiveTab(tab);
    setError('');
    setSuccess('');
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="neo-glass rounded-[2rem] border-neo-cyan/10 overflow-hidden relative">
        <div className="scanning-line absolute w-full top-0 left-0 opacity-20"></div>

        {/* Primary Type Selection */}
        <div className="flex bg-white/5 border-b border-white/5 p-2">
          <button
            onClick={() => switchTab('poster')}
            className={`flex-1 py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all font-heading font-bold uppercase tracking-widest ${
              activeTab === 'poster' ? 'bg-neo-cyan text-neo-void shadow-[0_0_20px_rgba(102,252,241,0.3)]' : 'text-neo-slate/40 hover:text-white'
            }`}
          >
            <FileText className="w-5 h-5" />
            Research Poster
          </button>
          <button
            onClick={() => switchTab('robot_run')}
            className={`flex-1 py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all font-heading font-bold uppercase tracking-widest ${
              activeTab === 'robot_run' ? 'bg-neo-amber text-neo-void shadow-[0_0_20px_rgba(255,179,0,0.3)]' : 'text-neo-slate/40 hover:text-white'
            }`}
          >
            <Video className="w-5 h-5" />
            Robot Performance
          </button>
        </div>

        {/* Content Header */}
        <div className="bg-neo-cyan/5 p-10 border-b border-neo-cyan/10">
          <div className="flex items-center gap-5 mb-4">
            <div className={`p-4 rounded-2xl bg-white/5 border flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.05)] ${
              activeTab === 'poster' ? 'text-neo-cyan border-neo-cyan/30' : 'text-neo-amber border-neo-amber/30'
            }`}>
              {activeTab === 'poster' ? <Upload className="w-8 h-8" /> : <Video className="w-8 h-8" />}
            </div>
            <div>
              <h1 className="text-3xl font-heading font-black text-white uppercase tracking-tight">
                {activeTab === 'poster' ? 'Research Poster' : 'Robot Performance'} <span className={activeTab === 'poster' ? 'text-neo-cyan' : 'text-neo-amber'}>Uplink</span>
              </h1>
              <p className="text-xs font-mono text-neo-slate/40 uppercase tracking-widest mt-1">
                {activeTab === 'poster' ? 'Module: Project Analysis' : 'Module: Performance Validation'}
              </p>
            </div>
          </div>
        </div>

        {/* Robot Performance Rules */}
        {activeTab === 'robot_run' && (
          <div className="p-8 bg-neo-amber/5 border-b border-neo-amber/10 space-y-6">
            <div className="flex items-center gap-3 text-neo-amber font-heading font-bold uppercase tracking-widest text-sm">
              <ClipboardCheck className="w-5 h-5" />
              Mission Protocols (Mandatory)
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="text-[10px] font-mono text-neo-amber uppercase mb-2">Pre-Run (Max 3m)</div>
                <p className="text-[10px] text-neo-slate/60 leading-relaxed">Landscape view. Show playfield. Zoom in to measure robot (25x25x25cm) with all attachments in base.</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="text-[10px] font-mono text-neo-amber uppercase mb-2">Actual Run (Max 2m 30s)</div>
                <p className="text-[10px] text-neo-slate/60 leading-relaxed">Visible timer. Max 2 members. No touching robot outside base. Single take, NO EDITS.</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="text-[10px] font-mono text-neo-amber uppercase mb-2">Post-Run (Max 1m)</div>
                <p className="text-[10px] text-neo-slate/60 leading-relaxed">Show all scoring elements from different angles at steady speed. 720p minimum resolution.</p>
              </div>
            </div>
            <p className="text-[10px] font-mono text-red-400 uppercase text-center animate-pulse">
              Deadline: 9th May 2026, 5:00 PM // EDITED VIDEOS = DISQUALIFIED
            </p>
          </div>
        )}

        {/* Submission Method Selection (Poster only) */}
        {activeTab === 'poster' && (
          <div className="flex border-b border-white/5">
            <button
              onClick={() => { setPosterMethod('file'); }}
              className={`flex-1 py-6 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                posterMethod === 'file' ? 'text-neo-cyan bg-white/5 border-b-2 border-neo-cyan' : 'text-neo-slate/40 hover:text-neo-slate'
              }`}
            >
              <FileUp className="w-4 h-4" />
              Local File
            </button>
            <button
              onClick={() => { setPosterMethod('link'); }}
              className={`flex-1 py-6 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                posterMethod === 'link' ? 'text-neo-cyan bg-white/5 border-b-2 border-neo-cyan' : 'text-neo-slate/40 hover:text-neo-slate'
              }`}
            >
              <Link2 className="w-4 h-4" />
              External Link
            </button>
          </div>
        )}

        {activeTab === 'robot_run' && (
          <div className="flex border-b border-white/5">
            <div className="flex-1 py-4 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 text-neo-amber bg-white/5 border-b-2 border-neo-amber">
              <Video className="w-4 h-4" />
              Run Video Link
            </div>
            <div className="flex-1 py-4 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 text-neo-amber bg-white/5 border-b-2 border-neo-amber">
              <FileText className="w-4 h-4" />
              Scoring Sheet File
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          {/* Format Info */}
          <div className="p-6 rounded-2xl bg-neo-void/50 border border-white/5 flex gap-4">
            <Info className="w-5 h-5 text-neo-cyan shrink-0" />
            <div className="text-sm space-y-2">
              <span className="text-neo-cyan font-bold block uppercase tracking-tighter">Protocol: Filename Specification</span>
              <code className="text-white/80 bg-white/5 px-2 py-1 rounded block w-fit font-mono text-xs">
                {activeTab === 'poster' 
                  ? 'TEAMNAME_SCHOOLNAME_DeExtinction_Category.ext'
                  : 'TEAMNAME_SCHOOLNAME_(RunVideo or ScoringSheet)'}
              </code>
              <p className="text-neo-slate/40 text-[10px] uppercase">
                 Example: <span className="font-mono text-white/60">
            {activeTab === 'poster' 
                     ? `${sanitizedTeamName}_${sanitizedSchoolName}_DeExtinction_${posterCategory}.pdf`
                     : `${sanitizedTeamName}_${sanitizedSchoolName}_RunVideo / ${sanitizedTeamName}_${sanitizedSchoolName}_ScoringSheet`}
                </span>
              </p>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-neo-amber/10 border border-neo-amber/30 text-neo-amber text-xs font-bold font-mono uppercase flex items-center gap-3">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-neo-cyan/10 border border-neo-cyan/30 text-neo-cyan text-xs font-bold font-mono uppercase flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4" /> {success}
            </div>
          )}

          {activeTab === 'poster' ? (
            posterMethod === 'file' ? (
              <div className="space-y-6">
                <div
                  onDragOver={handlePosterDragOver}
                  onDragLeave={handlePosterDragLeave}
                  onDrop={handlePosterDrop}
                  onClick={() => {
                    posterFileInputRef.current?.click();
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label="Upload poster file"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      posterFileInputRef.current?.click();
                    }
                  }}
                  className={`border-2 border-dashed rounded-[2rem] p-12 text-center cursor-pointer transition-all ${
                    posterIsDragging
                      ? 'border-neo-cyan bg-neo-cyan/5'
                      : posterFile
                      ? 'border-neo-cyan bg-neo-cyan/10'
                      : 'border-white/10 hover:border-neo-cyan/30'
                  }`}
                >
                  <input
                    ref={posterFileInputRef}
                    type="file"
                    aria-label="Select poster file"
                    onChange={(e) => {
                      const selected = e.target.files?.[0];
                      if (selected) validatePosterFile(selected);
                    }}
                    className="hidden"
                  />
                  {posterFile ? (
                    <div className="flex flex-col items-center gap-4">
                      <FileText className="w-12 h-12 text-neo-cyan" />
                      <div>
                        <div className="text-white font-bold mb-1">{posterFile.name}</div>
                        <div className="text-[10px] font-mono text-neo-slate/40 uppercase">{(posterFile.size / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPosterFile(null);
                        }}
                        className="text-neo-amber text-[10px] font-bold uppercase hover:underline"
                      >
                        Flush Buffer
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="w-12 h-12 text-neo-cyan/40 mx-auto mb-4" />
                      <p className="text-sm font-bold uppercase tracking-widest text-neo-slate/60">Drag Artifact or <span className="text-neo-cyan">Manual Load</span></p>
                      <p className="text-[10px] font-mono text-neo-slate/30 uppercase tracking-tighter">PDF / PPTX / Images / XLSX // MAX 50MB</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold text-neo-slate/40 uppercase tracking-widest ml-4">
                    External Source (Canva/Drive)
                  </label>
                  <div className="relative">
                    <Link2 className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-neo-cyan/40" />
                    <input
                      type="url"
                      value={posterLink}
                      onChange={(e) => setPosterLink(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-neo-void/50 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white font-mono text-sm focus:border-neo-cyan/40 outline-none transition-all"
                    />
                  </div>
                  <p className="text-[10px] font-mono text-neo-slate/30 mt-2 px-4">
                    Ensure link permissions are set to "Anyone with the link"
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold text-neo-slate/40 uppercase tracking-widest ml-4">
                  Transmission Link (YouTube/Google Drive)
                </label>
                <div className="relative">
                  <Link2 className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-neo-cyan/40" />
                  <input
                    type="url"
                    value={robotVideoLink}
                    onChange={(e) => setRobotVideoLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-neo-void/50 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white font-mono text-sm focus:border-neo-cyan/40 outline-none transition-all"
                  />
                </div>
                <p className="text-[10px] font-mono text-neo-slate/30 mt-2 px-4">
                  Ensure link permissions are set to "Anyone with the link"
                </p>
              </div>

              <div className="space-y-6">
                <div
                  onDragOver={handleRobotDragOver}
                  onDragLeave={handleRobotDragLeave}
                  onDrop={handleRobotDrop}
                  onClick={() => {
                    robotSheetInputRef.current?.click();
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label="Upload scoring sheet file"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      robotSheetInputRef.current?.click();
                    }
                  }}
                  className={`border-2 border-dashed rounded-[2rem] p-12 text-center cursor-pointer transition-all ${
                    robotIsDragging
                      ? 'border-neo-cyan bg-neo-cyan/5'
                      : robotSheetFile
                      ? 'border-neo-cyan bg-neo-cyan/10'
                      : 'border-white/10 hover:border-neo-cyan/30'
                  }`}
                >
                  <input
                    ref={robotSheetInputRef}
                    type="file"
                    aria-label="Select scoring sheet file"
                    onChange={(e) => {
                      const selected = e.target.files?.[0];
                      if (selected) validateRobotSheetFile(selected);
                    }}
                    className="hidden"
                  />
                  {robotSheetFile ? (
                    <div className="flex flex-col items-center gap-4">
                      <FileText className="w-12 h-12 text-neo-cyan" />
                      <div>
                        <div className="text-white font-bold mb-1">{robotSheetFile.name}</div>
                        <div className="text-[10px] font-mono text-neo-slate/40 uppercase">{(robotSheetFile.size / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRobotSheetFile(null);
                        }}
                        className="text-neo-amber text-[10px] font-bold uppercase hover:underline"
                      >
                        Flush Buffer
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="w-12 h-12 text-neo-cyan/40 mx-auto mb-4" />
                      <p className="text-sm font-bold uppercase tracking-widest text-neo-slate/60">Drag Scoring Sheet or <span className="text-neo-cyan">Manual Load</span></p>
                      <p className="text-[10px] font-mono text-neo-slate/30 uppercase tracking-tighter">PDF / PPTX / Images / XLSX // MAX 50MB</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'poster' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold text-neo-slate/40 uppercase tracking-widest ml-4">Category</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setPosterCategory('Primary')}
                    className={`flex-1 py-4 px-6 rounded-2xl font-heading font-bold uppercase tracking-widest transition-all ${
                      posterCategory === 'Primary'
                        ? 'bg-neo-cyan text-neo-void shadow-[0_0_20px_rgba(102,252,241,0.3)]'
                        : 'bg-white/5 text-neo-slate/40 hover:text-white border border-white/10'
                    }`}
                  >
                    Primary
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosterCategory('Secondary')}
                    className={`flex-1 py-4 px-6 rounded-2xl font-heading font-bold uppercase tracking-widest transition-all ${
                      posterCategory === 'Secondary'
                        ? 'bg-neo-cyan text-neo-void shadow-[0_0_20px_rgba(102,252,241,0.3)]'
                        : 'bg-white/5 text-neo-slate/40 hover:text-white border border-white/10'
                    }`}
                  >
                    Secondary
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold text-neo-slate/40 uppercase tracking-widest ml-4">Identifier Label (Filename)</label>
                <input
                  type="text"
                  value={posterFilename}
                  onChange={(e) => {
                    setPosterFilename(e.target.value);
                    setPosterFilenameTouched(true);
                  }}
                  placeholder={`${sanitizedTeamName}_${sanitizedSchoolName}_DeExtinction_${posterCategory}.pdf`}
                  className="w-full bg-neo-void/50 border border-white/10 rounded-2xl py-5 px-6 text-white font-mono text-sm focus:border-neo-cyan/40 outline-none transition-all"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold text-neo-slate/40 uppercase tracking-widest ml-4">Run Video Filename</label>
                <input
                  type="text"
                  value={robotVideoFilename}
                  onChange={(e) => {
                    setRobotVideoFilename(e.target.value);
                    setRobotVideoFilenameTouched(true);
                  }}
                  placeholder="Ex: TeamAlpha_School_RunVideo"
                  className="w-full bg-neo-void/50 border border-white/10 rounded-2xl py-5 px-6 text-white font-mono text-sm focus:border-neo-cyan/40 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold text-neo-slate/40 uppercase tracking-widest ml-4">Scoring Sheet Filename</label>
                <input
                  type="text"
                  value={robotSheetFilename}
                  onChange={(e) => {
                    setRobotSheetFilename(e.target.value);
                    setRobotSheetFilenameTouched(true);
                  }}
                  placeholder="Ex: TeamAlpha_School_ScoringSheet"
                  className="w-full bg-neo-void/50 border border-white/10 rounded-2xl py-5 px-6 text-white font-mono text-sm focus:border-neo-cyan/40 outline-none transition-all"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (activeTab === 'poster' ? (posterMethod === 'file' ? !posterFile : !posterLink) || !posterFilename : (!robotVideoLink || !robotSheetFile || !robotVideoFilename || !robotSheetFilename))}
            className={`w-full py-6 text-xl font-heading font-black uppercase tracking-widest group transition-all rounded-[1.5rem] flex items-center justify-center gap-4 ${
              activeTab === 'poster' 
                ? 'btn-neo-cyan bg-neo-cyan text-neo-void hover:shadow-[0_0_30px_rgba(102,252,241,0.4)]' 
                : 'bg-neo-amber text-neo-void hover:shadow-[0_0_30px_rgba(255,179,0,0.4)]'
            } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            {loading ? <div className="w-6 h-6 border-2 border-neo-void border-t-transparent rounded-full animate-spin" /> : <Zap className="w-6 h-6" />}
            Initiate Submission
          </button>
        </form>
      </div>
    </div>
  );
}
