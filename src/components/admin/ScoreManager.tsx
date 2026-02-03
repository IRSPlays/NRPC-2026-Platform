import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, Save, RotateCcw, AlertTriangle, CheckCircle2, Users, Clock, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { scoresAPI, teamsAPI } from '../../lib/api';
import MissionCard from '../calculator/MissionCard';

// Mission states (same as Calculator)
interface Mission1State { rocksCollected: number; }
interface Mission2State { meatLaunched: number; bothLaunched: boolean; }
interface Mission3State { bales: { pickedUp: boolean; inForest: boolean; }[]; }
interface Mission4State { bones: { pickedUp: boolean; inBase: boolean; }[]; allInBase: boolean; }
interface Mission5State { allLocationsVisited: boolean; baseIsLast: boolean; researcherToppled: boolean; }
interface Mission6State { nestOnStump: boolean; nestFell: boolean; }
interface Mission7State { aligned: boolean; }

const MAX_TOTAL_SCORE = 155;

export default function ScoreManager() {
  const { isAdmin, isJudge } = useAuth();
  const navigate = useNavigate();
  
  const [teams, setTeams] = useState<{ id: number; team_name: string; school_name: string }[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [judgeName, setJudgeName] = useState('');
  const [timeSeconds, setTimeSeconds] = useState('180');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [teamsLoaded, setTeamsLoaded] = useState(false);

  // Mission states
  const [mission1, setMission1] = useState<Mission1State>({ rocksCollected: 0 });
  const [mission2, setMission2] = useState<Mission2State>({ meatLaunched: 0, bothLaunched: false });
  const [mission3, setMission3] = useState<Mission3State>({
    bales: [{ pickedUp: false, inForest: false }, { pickedUp: false, inForest: false }, { pickedUp: false, inForest: false }]
  });
  const [mission4, setMission4] = useState<Mission4State>({
    bones: [{ pickedUp: false, inBase: false }, { pickedUp: false, inBase: false }, { pickedUp: false, inBase: false }],
    allInBase: false
  });
  const [mission5, setMission5] = useState<Mission5State>({ allLocationsVisited: false, baseIsLast: false, researcherToppled: false });
  const [mission6, setMission6] = useState<Mission6State>({ nestOnStump: false, nestFell: false });
  const [mission7, setMission7] = useState<Mission7State>({ aligned: false });

  if (!isAdmin && !isJudge) {
    navigate('/admin');
    return null;
  }

  const loadTeams = async () => {
    if (!teamsLoaded) {
      try {
        const data = await teamsAPI.getAll();
        setTeams(data);
        setTeamsLoaded(true);
      } catch (err) {
        console.error('Failed to load teams:', err);
      }
    }
  };

  // Calculate scores
  const mission1Score = useMemo(() => {
    const basePoints = mission1.rocksCollected * 5;
    const bonus = mission1.rocksCollected === 5 ? 5 : 0;
    return Math.min(basePoints + bonus, 30);
  }, [mission1.rocksCollected]);

  const mission2Score = useMemo(() => {
    const basePoints = mission2.meatLaunched * 5;
    const bonus = mission2.bothLaunched && mission2.meatLaunched === 2 ? 5 : 0;
    return Math.min(basePoints + bonus, 15);
  }, [mission2.meatLaunched, mission2.bothLaunched]);

  const mission3Score = useMemo(() => {
    return mission3.bales.reduce((total, bale) => {
      return total + (bale.pickedUp ? 5 : 0) + (bale.inForest ? 5 : 0);
    }, 0);
  }, [mission3.bales]);

  const mission4Score = useMemo(() => {
    const bonePoints = mission4.bones.reduce((total, bone) => {
      return total + (bone.pickedUp ? 2 : 0) + (bone.inBase ? 3 : 0);
    }, 0);
    const allBonesInBase = mission4.bones.every(b => b.inBase);
    const bonus = mission4.allInBase && allBonesInBase ? 5 : 0;
    return Math.min(bonePoints + bonus, 20);
  }, [mission4.bones, mission4.allInBase]);

  const mission5Score = useMemo(() => {
    if (mission5.researcherToppled) return 0;
    if (!mission5.allLocationsVisited) return 0;
    if (!mission5.baseIsLast) return 0;
    return 30;
  }, [mission5.researcherToppled, mission5.allLocationsVisited, mission5.baseIsLast]);

  const mission6Score = useMemo(() => {
    if (mission6.nestFell) return 0;
    if (!mission6.nestOnStump) return 0;
    return 15;
  }, [mission6.nestFell, mission6.nestOnStump]);

  const mission7Score = useMemo(() => mission7.aligned ? 15 : 0, [mission7.aligned]);

  const totalScore = useMemo(() => {
    return mission1Score + mission2Score + mission3Score + mission4Score + mission5Score + mission6Score + mission7Score;
  }, [mission1Score, mission2Score, mission3Score, mission4Score, mission5Score, mission6Score, mission7Score]);

  const handleReset = () => {
    setMission1({ rocksCollected: 0 });
    setMission2({ meatLaunched: 0, bothLaunched: false });
    setMission3({ bales: [{ pickedUp: false, inForest: false }, { pickedUp: false, inForest: false }, { pickedUp: false, inForest: false }] });
    setMission4({ bones: [{ pickedUp: false, inBase: false }, { pickedUp: false, inBase: false }, { pickedUp: false, inBase: false }], allInBase: false });
    setMission5({ allLocationsVisited: false, baseIsLast: false, researcherToppled: false });
    setMission6({ nestOnStump: false, nestFell: false });
    setMission7({ aligned: false });
    setTimeSeconds('180');
    setNotes('');
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    if (!selectedTeam) {
      setError('Please select a team');
      return;
    }
    if (!judgeName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await scoresAPI.save({
        team_id: parseInt(selectedTeam),
        judge_name: judgeName,
        missionData: {
          mission1: {
            rock1: mission1.rocksCollected >= 1,
            rock2: mission1.rocksCollected >= 2,
            rock3: mission1.rocksCollected >= 3,
            rock4: mission1.rocksCollected >= 4,
            rock5: mission1.rocksCollected >= 5,
            bonus: mission1.rocksCollected === 5,
          },
          mission2: {
            meat1: mission2.meatLaunched >= 1,
            meat2: mission2.meatLaunched >= 2,
            bonus: mission2.bothLaunched && mission2.meatLaunched === 2,
          },
          mission3: {
            bale1_pickup: mission3.bales[0].pickedUp,
            bale1_forest: mission3.bales[0].inForest,
            bale2_pickup: mission3.bales[1].pickedUp,
            bale2_forest: mission3.bales[1].inForest,
            bale3_pickup: mission3.bales[2].pickedUp,
            bale3_forest: mission3.bales[2].inForest,
          },
          mission4: {
            bone1_pickup: mission4.bones[0].pickedUp,
            bone1_base: mission4.bones[0].inBase,
            bone2_pickup: mission4.bones[1].pickedUp,
            bone2_base: mission4.bones[1].inBase,
            bone3_pickup: mission4.bones[2].pickedUp,
            bone3_base: mission4.bones[2].inBase,
            bonus: mission4.allInBase && mission4.bones.every(b => b.inBase),
          },
          mission5: {
            river: mission5.allLocationsVisited,
            forest: mission5.allLocationsVisited,
            fossil_pit: mission5.allLocationsVisited,
            base: mission5.allLocationsVisited,
            base_last: mission5.baseIsLast,
            researcher_toppled: mission5.researcherToppled,
          },
          mission6: {
            nest_picked_up: true,
            nest_on_stump: mission6.nestOnStump,
            nest_fell: mission6.nestFell,
          },
          mission7: {
            plate_pressed: mission7.aligned,
          },
        },
        completion_time_seconds: parseInt(timeSeconds) || 180,
        judge_notes: notes,
      });

      setSuccess('Score saved successfully!');
      handleReset();
    } catch (err: any) {
      setError(err.message || 'Failed to save score');
    } finally {
      setLoading(false);
    }
  };

  // Mission update helpers
  const updateMission1Rocks = (index: number) => {
    const newRocks = mission1.rocksCollected === index + 1 ? index : index + 1;
    setMission1({ rocksCollected: newRocks });
  };

  const updateMission3Bale = (index: number, field: 'pickedUp' | 'inForest') => {
    const newBales = [...mission3.bales];
    newBales[index] = { ...newBales[index], [field]: !newBales[index][field] };
    setMission3({ bales: newBales });
  };

  const updateMission4Bone = (index: number, field: 'pickedUp' | 'inBase') => {
    const newBones = [...mission4.bones];
    newBones[index] = { ...newBones[index], [field]: !newBones[index][field] };
    setMission4({ ...mission4, bones: newBones });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-heading text-slate-900 dark:text-white flex items-center gap-3">
          <Calculator className="w-8 h-8 text-[#0D7377]" />
          Score Manager
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Calculate and save scores for robot missions
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-5 h-5" />
            <span>{success}</span>
          </div>
        </div>
      )}

      {/* Team & Judge Selection */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-[#0D7377]" />
          Run Details
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Select Team *
            </label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              onFocus={loadTeams}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0D7377] focus:border-transparent"
            >
              <option value="">-- Select Team --</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.team_name} ({team.school_name})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Judge Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={judgeName}
                onChange={(e) => setJudgeName(e.target.value)}
                placeholder="Your name"
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0D7377] focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Time (seconds)
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="number"
                value={timeSeconds}
                onChange={(e) => setTimeSeconds(e.target.value)}
                placeholder="180"
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0D7377] focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Score Display */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-400 mb-1">Current Score</div>
            <div className="text-5xl font-bold font-heading">
              {totalScore}
              <span className="text-2xl text-slate-400 font-normal"> / {MAX_TOTAL_SCORE}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !selectedTeam || !judgeName}
              className="px-6 py-2 bg-[#0D7377] hover:bg-[#0A5A5D] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Score
            </button>
          </div>
        </div>
      </div>

      {/* Mission Cards */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Mission 1: Rock Collection */}
        <MissionCard
          number={1}
          title="Rock Collection"
          maxPoints={30}
          currentPoints={mission1Score}
          isComplete={mission1Score === 30}
          warning={mission1.rocksCollected > 0 && mission1.rocksCollected < 5 ? "Collect all 5 rocks for 5 bonus points!" : undefined}
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">5 rocks × 5 pts + 5 bonus if all collected</p>
            <div className="grid grid-cols-5 gap-3">
              {[0, 1, 2, 3, 4].map((index) => (
                <button
                  key={index}
                  onClick={() => updateMission1Rocks(index)}
                  className={`aspect-square rounded-lg border-2 flex items-center justify-center text-lg font-bold transition-all ${
                    index < mission1.rocksCollected
                      ? 'border-[#0D7377] bg-[#0D7377] text-white'
                      : 'border-slate-200 dark:border-slate-700 hover:border-[#0D7377]/50'
                  }`}
                >
                  {index < mission1.rocksCollected ? '✓' : index + 1}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Base: {mission1.rocksCollected * 5} pts</span>
              <span className="text-[#0D7377] font-medium">
                {mission1.rocksCollected === 5 ? '+5 bonus!' : 'No bonus yet'}
              </span>
            </div>
          </div>
        </MissionCard>

        {/* Mission 2: Meat Transport */}
        <MissionCard
          number={2}
          title="Meat Transport"
          maxPoints={15}
          currentPoints={mission2Score}
          isComplete={mission2Score === 15}
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">2 meat × 5 pts + 5 bonus if both launched</p>
            <div className="flex gap-4">
              {[0, 1, 2].map((num) => (
                <button
                  key={num}
                  onClick={() => setMission2({ ...mission2, meatLaunched: num })}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                    mission2.meatLaunched === num
                      ? 'border-[#0D7377] bg-[#0D7377]/10 text-[#0D7377]'
                      : 'border-slate-200 dark:border-slate-700 hover:border-[#0D7377]/50'
                  }`}
                >
                  {num} launched
                </button>
              ))}
            </div>
            <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 cursor-pointer">
              <input
                type="checkbox"
                checked={mission2.bothLaunched}
                onChange={(e) => setMission2({ ...mission2, bothLaunched: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-[#0D7377] focus:ring-[#0D7377]"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Both successfully launched (+5 bonus)
              </span>
            </label>
          </div>
        </MissionCard>

        {/* Mission 3: Hay Bale Transport */}
        <MissionCard
          number={3}
          title="Hay Bale Transport"
          maxPoints={30}
          currentPoints={mission3Score}
          isComplete={mission3Score === 30}
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">3 bales × (5 pickup + 5 forest) = 30 pts max</p>
            <div className="space-y-3">
              {mission3.bales.map((bale, index) => (
                <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-16">Bale {index + 1}</span>
                  <div className="flex gap-4 flex-1">
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={bale.pickedUp}
                        onChange={() => updateMission3Bale(index, 'pickedUp')}
                        className="w-4 h-4 rounded border-slate-300 text-[#0D7377] focus:ring-[#0D7377]"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Picked up (+5)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={bale.inForest}
                        onChange={() => updateMission3Bale(index, 'inForest')}
                        className="w-4 h-4 rounded border-slate-300 text-[#0D7377] focus:ring-[#0D7377]"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400">In forest (+5)</span>
                    </label>
                  </div>
                  <div className="text-sm font-bold text-[#0D7377] w-12 text-right">
                    {(bale.pickedUp ? 5 : 0) + (bale.inForest ? 5 : 0)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </MissionCard>

        {/* Mission 4: Bone Sorting */}
        <MissionCard
          number={4}
          title="Bone Sorting"
          maxPoints={20}
          currentPoints={mission4Score}
          isComplete={mission4Score === 20}
          warning={mission4.bones.every(b => b.inBase) && !mission4.allInBase ? "Check 'All in base' for +5 bonus!" : undefined}
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">3 bones × (2 pickup + 3 base) + 5 bonus if all in base</p>
            <div className="space-y-3">
              {mission4.bones.map((bone, index) => (
                <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-16">Bone {index + 1}</span>
                  <div className="flex gap-4 flex-1">
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={bone.pickedUp}
                        onChange={() => updateMission4Bone(index, 'pickedUp')}
                        className="w-4 h-4 rounded border-slate-300 text-[#0D7377] focus:ring-[#0D7377]"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Picked up (+2)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={bone.inBase}
                        onChange={() => updateMission4Bone(index, 'inBase')}
                        className="w-4 h-4 rounded border-slate-300 text-[#0D7377] focus:ring-[#0D7377]"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400">In base (+3)</span>
                    </label>
                  </div>
                  <div className="text-sm font-bold text-[#0D7377] w-12 text-right">
                    {(bone.pickedUp ? 2 : 0) + (bone.inBase ? 3 : 0)}
                  </div>
                </div>
              ))}
            </div>
            <label className="flex items-center gap-3 p-3 rounded-lg bg-[#0D7377]/10 border border-[#0D7377]/20 cursor-pointer">
              <input
                type="checkbox"
                checked={mission4.allInBase}
                onChange={(e) => setMission4({ ...mission4, allInBase: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-[#0D7377] focus:ring-[#0D7377]"
              />
              <span className="text-sm font-medium text-[#0D7377]">All bones in base (+5 bonus)</span>
            </label>
          </div>
        </MissionCard>

        {/* Mission 5: Researcher Path - CRITICAL */}
        <MissionCard
          number={5}
          title="Researcher Path"
          maxPoints={30}
          currentPoints={mission5Score}
          isCritical={true}
          isComplete={mission5Score === 30}
          warning={mission5Score === 0 ? 
            (mission5.researcherToppled ? "Researcher toppled - MISSION FAILED (0 pts)" :
             !mission5.allLocationsVisited ? "Must visit ALL locations" :
             !mission5.baseIsLast ? "Base must be LAST location visited" : "") 
            : undefined}
        >
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">
                <strong>CRITICAL:</strong> If researcher toppled OR not all locations visited OR base not last = <strong>0 points</strong>
              </p>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mission5.allLocationsVisited}
                  onChange={(e) => setMission5({ ...mission5, allLocationsVisited: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-[#0D7377] focus:ring-[#0D7377]"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">All locations visited</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mission5.baseIsLast}
                  onChange={(e) => setMission5({ ...mission5, baseIsLast: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-[#0D7377] focus:ring-[#0D7377]"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Base was last location visited</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mission5.researcherToppled}
                  onChange={(e) => setMission5({ ...mission5, researcherToppled: e.target.checked })}
                  className="w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm font-medium text-red-700 dark:text-red-400">Researcher toppled (FAILS MISSION)</span>
              </label>
            </div>
          </div>
        </MissionCard>

        {/* Mission 6: Eagle Nest - CRITICAL */}
        <MissionCard
          number={6}
          title="Eagle Nest"
          maxPoints={15}
          currentPoints={mission6Score}
          isCritical={true}
          isComplete={mission6Score === 15}
          warning={mission6Score === 0 ? 
            (mission6.nestFell ? "Nest fell - MISSION FAILED (0 pts)" :
             !mission6.nestOnStump ? "Nest must be on stump" : "") 
            : undefined}
        >
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">
                <strong>CRITICAL:</strong> If nest fell OR not on stump = <strong>0 points</strong>
              </p>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mission6.nestOnStump}
                  onChange={(e) => setMission6({ ...mission6, nestOnStump: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-[#0D7377] focus:ring-[#0D7377]"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Nest is on stump</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mission6.nestFell}
                  onChange={(e) => setMission6({ ...mission6, nestFell: e.target.checked })}
                  className="w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm font-medium text-red-700 dark:text-red-400">Nest fell (FAILS MISSION)</span>
              </label>
            </div>
          </div>
        </MissionCard>

        {/* Mission 7: Robot Alignment */}
        <MissionCard
          number={7}
          title="Robot Alignment"
          maxPoints={15}
          currentPoints={mission7Score}
          isComplete={mission7Score === 15}
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">Binary: 0 or 15 points</p>
            <div className="flex gap-4">
              <button
                onClick={() => setMission7({ aligned: false })}
                className={`flex-1 py-4 px-4 rounded-lg border-2 font-medium transition-all ${
                  !mission7.aligned
                    ? 'border-[#0D7377] bg-[#0D7377] text-white'
                    : 'border-slate-200 dark:border-slate-700 hover:border-[#0D7377]/50'
                }`}
              >
                Not Aligned (0 pts)
              </button>
              <button
                onClick={() => setMission7({ aligned: true })}
                className={`flex-1 py-4 px-4 rounded-lg border-2 font-medium transition-all ${
                  mission7.aligned
                    ? 'border-[#0D7377] bg-[#0D7377] text-white'
                    : 'border-slate-200 dark:border-slate-700 hover:border-[#0D7377]/50'
                }`}
              >
                Aligned (15 pts)
              </button>
            </div>
          </div>
        </MissionCard>

        {/* Notes */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Judge Notes (Optional)</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any observations or comments about this run..."
            rows={4}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0D7377] focus:border-transparent resize-none"
          />
        </div>
      </div>
    </div>
  );
}
