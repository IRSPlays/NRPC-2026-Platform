import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, RotateCcw, AlertTriangle, CheckCircle2, Users, Clock, User, Settings, Settings2, Zap, Edit2, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { scoresAPI, teamsAPI } from '../../lib/api';
import type { Team, Score } from '../../types';
import MissionCard from '../calculator/MissionCard';

// Mission states
interface Mission1State { rocksCollected: number; }
interface Mission2State { meatLaunched: number; bothLaunched: boolean; }
interface Mission3State { bales: { moved: boolean; inForest: boolean; }[]; }
interface Mission4State { fossils: { pickedUp: boolean; inBase: boolean; }[]; allInBase: boolean; }
interface Mission5State { scientistsInBase: number; scientistFell: boolean; }
interface Mission6State { nestOut: boolean; nestOnStump: boolean; nestFell: boolean; }
interface Mission7State { active: boolean; }

export default function ScoreManager() {
  const { isAdmin, isJudge } = useAuth();
  const navigate = useNavigate();
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [judgeName, setJudgeName] = useState('');
  const [timeSeconds, setTimeSeconds] = useState('150');
  const [mechScore, setMechScore] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [teamsLoaded, setTeamsLoaded] = useState(false);
  
  // Edit mode state
  const [editingScoreId, setEditingScoreId] = useState<number | null>(null);
  const [existingScores, setExistingScores] = useState<Score[]>([]);
  const [showScoreDropdown, setShowScoreDropdown] = useState(false);

  // Mission states
  const [mission1, setMission1] = useState<Mission1State>({ rocksCollected: 0 });
  const [mission2, setMission2] = useState<Mission2State>({ meatLaunched: 0, bothLaunched: false });
  
  // Auto-update bothLaunched when meatLaunched changes
  useEffect(() => {
    setMission2(prev => ({ ...prev, bothLaunched: prev.meatLaunched === 2 }));
  }, [mission2.meatLaunched]);
  const [mission3, setMission3] = useState<Mission3State>({
    bales: [{ moved: false, inForest: false }, { moved: false, inForest: false }, { moved: false, inForest: false }]
  });
  const [mission4, setMission4] = useState<Mission4State>({
    fossils: [{ pickedUp: false, inBase: false }, { pickedUp: false, inBase: false }, { pickedUp: false, inBase: false }],
    allInBase: false
  });
  
  // Auto-update allInBase when fossils change
  useEffect(() => {
    const allInBaseNow = mission4.fossils.every(f => f.inBase);
    if (mission4.allInBase !== allInBaseNow) {
      setMission4(prev => ({ ...prev, allInBase: allInBaseNow }));
    }
  }, [mission4.fossils]);
  const [mission5, setMission5] = useState<Mission5State>({ scientistsInBase: 0, scientistFell: false });
  const [mission6, setMission6] = useState<Mission6State>({ nestOut: false, nestOnStump: false, nestFell: false });
  const [mission7, setMission7] = useState<Mission7State>({ active: false });

  // Auth check - must be after all useState hooks
  useEffect(() => {
    if (!isAdmin && !isJudge) {
      navigate('/admin');
    }
  }, [isAdmin, isJudge, navigate]);

  const loadTeams = async () => {
    if (!teamsLoaded) {
      try {
        const data = await teamsAPI.getAll();
        setTeams(data);
        setTeamsLoaded(true);
      } catch (err: any) {
        setError(err.message || 'Failed to load teams');
      }
    }
  };

  const loadExistingScores = async (teamId: number) => {
    try {
      const scores = await scoresAPI.getByTeam(teamId);
      setExistingScores(scores);
    } catch (err: any) {
      console.error('Failed to load existing scores:', err);
    }
  };

  useEffect(() => { 
    loadTeams(); 
  }, []);

  // Load existing scores when team is selected
  useEffect(() => {
    if (selectedTeam) {
      loadExistingScores(parseInt(selectedTeam));
    } else {
      setExistingScores([]);
    }
    setEditingScoreId(null);
    handleReset();
  }, [selectedTeam]);

  // Logic
  const mission1Score = useMemo(() => mission1.rocksCollected * 5 + (mission1.rocksCollected === 5 ? 5 : 0), [mission1.rocksCollected]);
  const mission2Score = useMemo(() => mission2.meatLaunched * 5 + (mission2.bothLaunched && mission2.meatLaunched === 2 ? 5 : 0), [mission2.meatLaunched, mission2.bothLaunched]);
  const mission3Score = useMemo(() => mission3.bales.reduce((t, b) => t + (b.moved ? 5 : 0) + (b.inForest ? 5 : 0), 0), [mission3.bales]);
  const mission4Score = useMemo(() => {
    const base = mission4.fossils.reduce((t, f) => t + (f.pickedUp ? 2 : 0) + (f.inBase ? 3 : 0), 0);
    return base + (mission4.allInBase && mission4.fossils.every(f => f.inBase) ? 5 : 0);
  }, [mission4.fossils, mission4.allInBase]);
  const mission5Score = useMemo(() => mission5.scientistFell ? 0 : mission5.scientistsInBase * 10, [mission5.scientistsInBase, mission5.scientistFell]);
  const mission6Score = useMemo(() => {
    if (mission6.nestFell) return 0;
    return (mission6.nestOut ? 5 : 0) + (mission6.nestOnStump ? 10 : 0);
  }, [mission6.nestOut, mission6.nestOnStump, mission6.nestFell]);
  const mission7Score = useMemo(() => mission7.active ? 15 : 0, [mission7.active]);

  const totalScore = useMemo(() => mission1Score + mission2Score + mission3Score + mission4Score + mission5Score + mission6Score + mission7Score, [mission1Score, mission2Score, mission3Score, mission4Score, mission5Score, mission6Score, mission7Score]);

  const handleReset = () => {
    setMission1({ rocksCollected: 0 });
    setMission2({ meatLaunched: 0, bothLaunched: false });
    setMission3({ bales: [{ moved: false, inForest: false }, { moved: false, inForest: false }, { moved: false, inForest: false }] });
    setMission4({ fossils: [{ pickedUp: false, inBase: false }, { pickedUp: false, inBase: false }, { pickedUp: false, inBase: false }], allInBase: false });
    setMission5({ scientistsInBase: 0, scientistFell: false });
    setMission6({ nestOut: false, nestOnStump: false, nestFell: false });
    setMission7({ active: false });
    setMechScore(0);
    setTimeSeconds('150');
    setNotes('');
    setError('');
    setSuccess('');
    setEditingScoreId(null);
  };

  const loadScoreToForm = (score: Score) => {
    let missionData;
    try {
      missionData = typeof score.mission_data === 'string' ? JSON.parse(score.mission_data) : score.mission_data;
    } catch (parseError) {
      console.error('Failed to parse mission_data:', parseError);
      setError('Failed to load score data. The score may be corrupted.');
      return;
    }
    
    if (missionData.mission1) {
      const rocks = [missionData.mission1.rock1, missionData.mission1.rock2, missionData.mission1.rock3, missionData.mission1.rock4, missionData.mission1.rock5].filter(Boolean).length;
      setMission1({ rocksCollected: rocks });
    }
    
    if (missionData.mission2) {
      const meat = (missionData.mission2.meat1 ? 1 : 0) + (missionData.mission2.meat2 ? 1 : 0);
      setMission2({ meatLaunched: meat, bothLaunched: meat === 2 });
    }
    
    if (missionData.mission3) {
      setMission3({
        bales: [
          { moved: missionData.mission3.bale1_pickup || false, inForest: missionData.mission3.bale1_forest || false },
          { moved: missionData.mission3.bale2_pickup || false, inForest: missionData.mission3.bale2_forest || false },
          { moved: missionData.mission3.bale3_pickup || false, inForest: missionData.mission3.bale3_forest || false },
        ]
      });
    }
    
    if (missionData.mission4) {
      setMission4({
        fossils: [
          { pickedUp: missionData.mission4.bone1_pickup || false, inBase: missionData.mission4.bone1_base || false },
          { pickedUp: missionData.mission4.bone2_pickup || false, inBase: missionData.mission4.bone2_base || false },
          { pickedUp: missionData.mission4.bone3_pickup || false, inBase: missionData.mission4.bone3_base || false },
        ],
        allInBase: missionData.mission4.bonus || false
      });
    }
    
    if (missionData.mission5) {
      let scientistsInBase = 0;
      if (typeof missionData.mission5.scientists_in_base === 'number') {
        scientistsInBase = missionData.mission5.scientists_in_base;
      } else {
        const locationFields = ['river', 'forest', 'fossil_pit', 'base', 'base_last'];
        scientistsInBase = locationFields.filter(field => missionData.mission5[field]).length;
      }
      setMission5({ 
        scientistsInBase, 
        scientistFell: missionData.mission5.researcher_toppled || false 
      });
    }
    
    if (missionData.mission6) {
      setMission6({ 
        nestOut: missionData.mission6.nest_picked_up || false, 
        nestOnStump: missionData.mission6.nest_on_stump || false, 
        nestFell: missionData.mission6.nest_fell || false 
      });
    }
    
    if (missionData.mission7) {
      setMission7({ active: missionData.mission7.plate_pressed || false });
    }
    
    setMechScore(score.mechanical_design_score || 0);
    setTimeSeconds(String(score.completion_time_seconds || 150));
    setNotes(score.judge_notes || '');
    setJudgeName(score.judge_name || '');
    setEditingScoreId(score.id);
    setShowScoreDropdown(false);
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    const teamId = parseInt(selectedTeam);
    if (!selectedTeam || isNaN(teamId)) { setError('Please select a valid team'); return; }
    if (!judgeName.trim()) { setError('Please enter Assessor ID'); return; }

    const missionData = {
      mission1: { rock1: mission1.rocksCollected >= 1, rock2: mission1.rocksCollected >= 2, rock3: mission1.rocksCollected >= 3, rock4: mission1.rocksCollected >= 4, rock5: mission1.rocksCollected >= 5, bonus: mission1.rocksCollected === 5 },
      mission2: { meat1: mission2.meatLaunched >= 1, meat2: mission2.meatLaunched >= 2, bonus: mission2.meatLaunched === 2 },
      mission3: { 
        bale1_pickup: mission3.bales[0].moved, bale1_forest: mission3.bales[0].inForest,
        bale2_pickup: mission3.bales[1].moved, bale2_forest: mission3.bales[1].inForest,
        bale3_pickup: mission3.bales[2].moved, bale3_forest: mission3.bales[2].inForest,
      },
      mission4: {
        bone1_pickup: mission4.fossils[0].pickedUp, bone1_base: mission4.fossils[0].inBase,
        bone2_pickup: mission4.fossils[1].pickedUp, bone2_base: mission4.fossils[1].inBase,
        bone3_pickup: mission4.fossils[2].pickedUp, bone3_base: mission4.fossils[2].inBase,
        bonus: mission4.fossils.every(f => f.inBase)
      },
      mission5: {
        scientists_in_base: mission5.scientistsInBase, researcher_toppled: mission5.scientistFell
      },
      mission6: { nest_picked_up: mission6.nestOut, nest_on_stump: mission6.nestOnStump, nest_fell: mission6.nestFell },
      mission7: { plate_pressed: mission7.active }
    };

    setLoading(true);
    try {
      if (editingScoreId) {
        await scoresAPI.update(editingScoreId, {
          team_id: teamId,
          judge_name: judgeName,
          missionData,
          completion_time_seconds: parseInt(timeSeconds) || 150,
          mechanical_design_score: mechScore,
          judge_notes: notes,
        });
        setSuccess('Assessment updated successfully.');
      } else {
        await scoresAPI.save({
          team_id: teamId,
          judge_name: judgeName,
          missionData,
          completion_time_seconds: parseInt(timeSeconds) || 150,
          mechanical_design_score: mechScore,
          judge_notes: notes,
        });
        setSuccess('Assessment finalized.');
      }
      handleReset();
      if (selectedTeam) {
        loadExistingScores(teamId);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || 'Error saving assessment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 pb-20 px-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-4xl font-heading font-black text-white uppercase tracking-tighter mb-2">Scoring <span className="text-neo-amber">Engine</span></h1>
          <p className="text-xs font-mono text-neo-slate/40 uppercase tracking-[0.3em]">Official Tournament Assessment Terminal</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right mr-4">
            <div className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest">Total Score</div>
            <div className="text-3xl font-black font-mono text-neo-cyan">{totalScore}<span className="text-sm text-neo-slate/30">/155</span></div>
          </div>
          <button onClick={handleReset} className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-neo-slate/60 hover:text-white transition-all font-mono text-xs uppercase tracking-widest font-bold"><RotateCcw className="w-4 h-4" /> Reset</button>
          <button onClick={handleSave} disabled={loading || !selectedTeam || !judgeName} className="btn-neo-amber flex items-center gap-3 py-3 px-8 shadow-[0_0_20px_rgba(255,179,0,0.2)] disabled:opacity-30">
            {loading ? <div className="w-4 h-4 border-2 border-neo-void border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />} {editingScoreId ? 'Update Score' : 'Finalize Assessment'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-neo-amber/10 border border-neo-amber/30 text-neo-amber text-xs font-mono uppercase tracking-widest flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-neo-cyan/10 border border-neo-cyan/30 text-neo-cyan text-xs font-mono uppercase tracking-widest flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {success}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 neo-glass p-8 rounded-3xl border-white/5 space-y-8">
          <h2 className="text-xs font-mono font-bold text-white uppercase tracking-[0.3em] flex items-center gap-2"><Users className="w-4 h-4 text-neo-cyan" /> Unit Selection</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest ml-4">Select Team</label>
              <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)} className="w-full bg-neo-void/50 border border-white/10 rounded-2xl py-4 px-6 text-white font-mono outline-none focus:border-neo-cyan/40 appearance-none">
                <option value="">-- SELECT UNIT --</option>
            {teams.map(team => (
              <option key={team.id} value={team.id}>{team.team_name} ({team.school_name})</option>
            ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest ml-4">Assessor ID</label>
              <div className="relative"><User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-neo-slate/40" />
                <input type="text" value={judgeName} onChange={(e) => setJudgeName(e.target.value)} placeholder="Your Name..." className="w-full bg-neo-void/50 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white font-mono outline-none focus:border-neo-cyan/40" />
              </div>
            </div>
          </div>
          
          {existingScores.length > 0 && (
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest ml-4 flex items-center gap-2">
                <Edit2 className="w-3 h-3" /> Load Existing Score
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowScoreDropdown(!showScoreDropdown)}
                  className="w-full bg-neo-void/50 border border-white/10 rounded-2xl py-4 px-6 text-white font-mono outline-none focus:border-neo-cyan/40 appearance-none flex items-center justify-between"
                >
                  <span>
                    {editingScoreId 
                      ? `Editing Score #${editingScoreId}` 
                      : `-- SELECT SCORE TO EDIT --`}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showScoreDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showScoreDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-neo-void border border-white/10 rounded-2xl overflow-hidden z-10 max-h-60 overflow-y-auto">
                    {existingScores.map((score) => (
                      <button
                        key={score.id}
                        type="button"
                        onClick={() => loadScoreToForm(score)}
                        className="w-full px-6 py-3 text-left font-mono text-sm hover:bg-white/5 flex items-center justify-between border-b border-white/5 last:border-0"
                      >
                        <span className="text-white">
                          Score #{score.id} - {score.total_score} pts
                        </span>
                        <span className="text-neo-slate/40 text-xs">
                          {score.judge_name} - {new Date(score.created_at).toLocaleDateString()}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {editingScoreId && (
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingScoreId(null);
                      handleReset();
                    }}
                    className="text-neo-amber text-[10px] font-bold uppercase hover:underline"
                  >
                    Cancel Edit
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="neo-glass p-8 rounded-3xl border-white/5 space-y-6">
          <h2 className="text-xs font-mono font-bold text-white uppercase tracking-[0.3em] flex items-center gap-2"><Clock className="w-4 h-4 text-neo-amber" /> Mission Timer</h2>
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest ml-4">Duration (SEC)</label>
            <input type="number" value={timeSeconds} onChange={(e) => setTimeSeconds(e.target.value)} className="w-full bg-neo-void/50 border border-neo-amber/20 rounded-2xl py-5 px-6 text-3xl font-black font-mono text-neo-amber outline-none text-center" />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <MissionCard number={1} title="Clear the way" maxPoints={30} currentPoints={mission1Score} isComplete={mission1Score === 30}>
          <div className="grid grid-cols-5 gap-3 mb-4">
            {[0, 1, 2, 3, 4].map(i => (
              <button key={i} onClick={() => setMission1({ rocksCollected: mission1.rocksCollected === i + 1 ? i : i + 1 })} aria-label={`Set rocks collected to ${i + 1}`}
                className={`aspect-square rounded-xl border-2 font-mono font-bold transition-all ${i < mission1.rocksCollected ? 'border-neo-cyan bg-neo-cyan/20 text-neo-cyan shadow-[0_0_15px_rgba(102,252,241,0.2)]' : 'border-white/5 text-white/10'}`}
              >{i < mission1.rocksCollected ? '✓' : i + 1}</button>
            ))}
          </div>
          <div className="text-[9px] font-mono uppercase space-y-1">
            <div className="text-neo-slate/40">i. For each rock dropped off in Processing Plant: 5 PTS</div>
            <div className={mission1.rocksCollected === 5 ? 'text-neo-cyan font-bold' : 'text-neo-slate/40'}>ii. If all rocks are dropped off: 5 PTS EXTRA</div>
          </div>
        </MissionCard>

        <MissionCard number={2} title="Feeding time!" maxPoints={15} currentPoints={mission2Score} isComplete={mission2Score === 15}>
          <div className="flex gap-4 mb-4">
            {[0, 1, 2].map(n => (
              <button key={n} onClick={() => setMission2({ ...mission2, meatLaunched: n })} aria-label={`Set meat launched to ${n}`} className={`flex-1 py-3 rounded-xl border-2 font-mono font-bold transition-all ${mission2.meatLaunched === n ? 'border-neo-cyan bg-neo-cyan/20 text-neo-cyan' : 'border-white/5 text-white/10'}`}>{n} Meat</button>
            ))}
          </div>
          <div className={`w-full p-3 rounded-xl border font-mono text-[9px] font-bold uppercase transition-all mb-2 ${mission2.bothLaunched && mission2.meatLaunched === 2 ? 'border-neo-cyan text-neo-cyan bg-neo-cyan/5 shadow-[0_0_10px_rgba(102,252,241,0.3)]' : 'border-white/5 text-white/10'}`}>
            ii. Both pieces launched: 5 PTS EXTRA {mission2.bothLaunched && mission2.meatLaunched === 2 && <span className="ml-2">✓</span>}
          </div>
        </MissionCard>

        <MissionCard number={3} title="Store the hay bales" maxPoints={30} currentPoints={mission3Score} isComplete={mission3Score === 30}>
          <div className="space-y-3">
            {mission3.bales.map((b, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="text-[10px] font-mono font-bold text-neo-slate/40 w-10">B-0{i+1}</div>
                <div className="flex gap-2 flex-1">
                  <button onClick={() => { const n=[...mission3.bales]; n[i].moved=!n[i].moved; setMission3({bales:n}); }} aria-label={`Bale ${i + 1} moved from start`} className={`flex-1 py-2 rounded-lg font-mono text-[8px] font-bold uppercase border transition-all ${b.moved ? 'border-neo-cyan bg-neo-cyan/10 text-neo-cyan' : 'border-white/5 text-white/10'}`}>i. MOVED</button>
                  <button onClick={() => { const n=[...mission3.bales]; n[i].inForest=!n[i].inForest; setMission3({bales:n}); }} aria-label={`Bale ${i + 1} moved into forest`} className={`flex-1 py-2 rounded-lg font-mono text-[8px] font-bold uppercase border transition-all ${b.inForest ? 'border-neo-cyan bg-neo-cyan/10 text-neo-cyan' : 'border-white/5 text-white/10'}`}>ii. FOREST</button>
                </div>
              </div>
            ))}
          </div>
        </MissionCard>

        <MissionCard number={4} title="Collect the fossils" maxPoints={20} currentPoints={mission4Score} isComplete={mission4Score === 20}>
          <div className="space-y-3">
            {mission4.fossils.map((f, i) => (
              <div key={i} className="flex items-center gap-4 p-2 rounded-xl bg-white/5 border border-white/5">
                <div className="text-[9px] font-mono font-bold text-neo-slate/40 w-8">F-0{i+1}</div>
                <div className="flex gap-2 flex-1">
                  <button onClick={() => { const n=[...mission4.fossils]; n[i].pickedUp=!n[i].pickedUp; setMission4({...mission4, fossils:n}); }} aria-label={`Fossil ${i + 1} picked up`} className={`flex-1 py-1.5 rounded-lg font-mono text-[8px] font-bold uppercase border transition-all ${f.pickedUp ? 'border-neo-cyan bg-neo-cyan/10 text-neo-cyan' : 'border-white/5 text-white/10'}`}>i. PICKED</button>
                  <button onClick={() => { const n=[...mission4.fossils]; n[i].inBase=!n[i].inBase; setMission4({...mission4, fossils:n}); }} aria-label={`Fossil ${i + 1} inside base`} className={`flex-1 py-1.5 rounded-lg font-mono text-[8px] font-bold uppercase border transition-all ${f.inBase ? 'border-neo-cyan bg-neo-cyan/10 text-neo-cyan' : 'border-white/5 text-white/10'}`}>ii. BASE</button>
                </div>
              </div>
            ))}
            <div className={`w-full p-2.5 rounded-lg border font-mono text-[8px] font-bold uppercase transition-all ${mission4.allInBase && mission4.fossils.every(f => f.inBase) ? 'border-neo-cyan text-neo-cyan bg-neo-cyan/5 shadow-[0_0_10px_rgba(102,252,241,0.3)]' : 'border-white/5 text-white/10'}`}>
              iii. All 3 fossils in base: 5 PTS EXTRA {mission4.allInBase && mission4.fossils.every(f => f.inBase) && <span className="ml-2">✓</span>}
            </div>
          </div>
        </MissionCard>

        <MissionCard number={5} title="Sanctuary Tour" maxPoints={30} currentPoints={mission5Score} isCritical={true} isComplete={mission5Score === 30}>
          <div className="flex gap-2 mb-4">
            {[0, 1, 2, 3].map(n => (
              <button key={n} onClick={() => setMission5({ ...mission5, scientistsInBase: n })} aria-label={`Set scientists in base to ${n}`} className={`flex-1 py-3 rounded-xl border-2 font-mono font-bold transition-all ${mission5.scientistsInBase === n ? 'border-neo-cyan bg-neo-cyan/20 text-neo-cyan' : 'border-white/5 text-white/10'}`}>{n}</button>
            ))}
          </div>
            <button onClick={() => setMission5({ ...mission5, scientistFell: !mission5.scientistFell })} aria-label="Toggle scientist fell" className={`w-full p-4 rounded-xl border-2 font-mono text-[9px] font-bold uppercase tracking-widest transition-all ${mission5.scientistFell ? 'border-neo-amber text-neo-amber bg-neo-amber/5' : 'border-white/5 text-white/10'}`}>ii. If a scientist falls over: 0 PTS TOTAL</button>
        </MissionCard>

        <MissionCard number={6} title="Rescue" maxPoints={15} currentPoints={mission6Score} isCritical={true} isComplete={mission6Score === 15}>
          <div className="space-y-3">
            <button onClick={() => setMission6({ ...mission6, nestOut: !mission6.nestOut })} aria-label="Toggle nest out of starting position" className={`w-full p-3 rounded-xl border font-mono text-[9px] font-bold uppercase transition-all ${mission6.nestOut ? 'border-neo-cyan text-neo-cyan bg-neo-cyan/5' : 'border-white/5 text-white/10'}`}>i. Nest is out of starting position: 5 PTS</button>
            <button onClick={() => setMission6({ ...mission6, nestOnStump: !mission6.nestOnStump })} aria-label="Toggle nest on stump" className={`w-full p-3 rounded-xl border font-mono text-[9px] font-bold uppercase transition-all ${mission6.nestOnStump ? 'border-neo-cyan text-neo-cyan bg-neo-cyan/5' : 'border-white/5 text-white/10'}`}>ii. Nest is upright on tree stump: 10 PTS</button>
            <button onClick={() => setMission6({ ...mission6, nestFell: !mission6.nestFell })} aria-label="Toggle nest fell" className={`w-full p-3 rounded-xl border font-mono text-[9px] font-bold uppercase transition-all ${mission6.nestFell ? 'border-neo-amber text-neo-amber bg-neo-amber/5' : 'border-white/5 text-white/10'}`}>iii. If the nest falls: 0 PTS TOTAL</button>
          </div>
        </MissionCard>

        <MissionCard number={7} title="Power it Up!" maxPoints={15} currentPoints={mission7Score} isComplete={mission7Score === 15}>
          <button onClick={() => setMission7({ active: !mission7.active })} aria-label="Toggle fan blades move" className={`w-full h-24 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 font-mono uppercase tracking-[0.2em] font-black transition-all ${mission7.active ? 'border-neo-cyan bg-neo-cyan/20 text-neo-cyan neo-text-glow' : 'border-white/5 bg-white/[0.02] text-white/10'}`}>
            <Settings2 className={`w-6 h-6 ${mission7.active ? 'animate-spin-slow' : ''}`} />{mission7.active ? 'i. FAN BLADES MOVE' : 'INACTIVE'}
          </button>
        </MissionCard>

        <div className="neo-glass p-8 rounded-3xl border-neo-amber/20 space-y-6">
          <div className="flex items-center justify-between"><h2 className="text-xs font-mono font-bold text-white uppercase tracking-[0.3em] flex items-center gap-2"><Settings className="w-4 h-4 text-neo-amber" /> Mechanical Design</h2>
            <div className="text-2xl font-black font-mono text-neo-amber">{mechScore}<span className="text-sm text-neo-slate/20 font-normal">/100</span></div>
          </div>
          <input type="range" min="0" max="100" value={mechScore} onChange={(e) => setMechScore(parseInt(e.target.value))} className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-neo-amber" />
        </div>
      </div>

      <div className="neo-glass p-8 rounded-3xl border-white/5"><h3 className="text-xs font-mono font-bold text-white uppercase tracking-[0.3em] mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-neo-amber" /> Observations</h3>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observations regarding mission performance..." rows={4} className="w-full bg-neo-void/50 border border-white/10 rounded-2xl py-4 px-6 text-white font-mono text-sm outline-none focus:border-neo-cyan/40 resize-none" />
      </div>
    </div>
  );
}
