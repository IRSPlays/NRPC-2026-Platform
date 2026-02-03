import React, { useState, useMemo } from 'react';
import { Calculator, RotateCcw, AlertTriangle } from 'lucide-react';
import MissionCard from '../components/calculator/MissionCard';
import ScoreDisplay from '../components/calculator/ScoreDisplay';

// Mission 1: Rock Collection (30 pts max)
// 5 rocks × 5 pts + 5 bonus if all collected
interface Mission1State {
  rocksCollected: number;
}

// Mission 2: Meat Transport (15 pts max)
// 2 meat × 5 pts + 5 bonus if both launched
interface Mission2State {
  meatLaunched: number;
  bothLaunched: boolean;
}

// Mission 3: Hay Bale Transport (30 pts max)
// 3 bales × (5 pickup + 5 forest) = 30 total
interface Mission3State {
  bales: {
    pickedUp: boolean;
    inForest: boolean;
  }[];
}

// Mission 4: Bone Sorting (20 pts max)
// 3 bones × (2 pickup + 3 base) + 5 bonus if all in base
interface Mission4State {
  bones: {
    pickedUp: boolean;
    inBase: boolean;
  }[];
  allInBase: boolean;
}

// Mission 5: Researcher Path (30 pts max)
// CRITICAL: If researcher toppled OR not all locations visited OR base not last = 0 pts
interface Mission5State {
  allLocationsVisited: boolean;
  baseIsLast: boolean;
  researcherToppled: boolean;
}

// Mission 6: Eagle Nest (15 pts max)
// CRITICAL: If nest fell OR not on stump = 0 pts
interface Mission6State {
  nestOnStump: boolean;
  nestFell: boolean;
}

// Mission 7: Robot Alignment (15 pts max)
// Binary 0 or 15
interface Mission7State {
  aligned: boolean;
}

const MAX_TOTAL_SCORE = 155;

const CalculatorPage: React.FC = () => {
  // Time input
  const [timeSeconds, setTimeSeconds] = useState('180');

  // Mission 1: Rock Collection
  const [mission1, setMission1] = useState<Mission1State>({
    rocksCollected: 0,
  });

  // Mission 2: Meat Transport
  const [mission2, setMission2] = useState<Mission2State>({
    meatLaunched: 0,
    bothLaunched: false,
  });

  // Mission 3: Hay Bale Transport
  const [mission3, setMission3] = useState<Mission3State>({
    bales: [
      { pickedUp: false, inForest: false },
      { pickedUp: false, inForest: false },
      { pickedUp: false, inForest: false },
    ],
  });

  // Mission 4: Bone Sorting
  const [mission4, setMission4] = useState<Mission4State>({
    bones: [
      { pickedUp: false, inBase: false },
      { pickedUp: false, inBase: false },
      { pickedUp: false, inBase: false },
    ],
    allInBase: false,
  });

  // Mission 5: Researcher Path
  const [mission5, setMission5] = useState<Mission5State>({
    allLocationsVisited: false,
    baseIsLast: false,
    researcherToppled: false,
  });

  // Mission 6: Eagle Nest
  const [mission6, setMission6] = useState<Mission6State>({
    nestOnStump: false,
    nestFell: false,
  });

  // Mission 7: Robot Alignment
  const [mission7, setMission7] = useState<Mission7State>({
    aligned: false,
  });

  // Calculate Mission 1 Score
  const mission1Score = useMemo(() => {
    const basePoints = mission1.rocksCollected * 5;
    const bonus = mission1.rocksCollected === 5 ? 5 : 0;
    return Math.min(basePoints + bonus, 30);
  }, [mission1.rocksCollected]);

  // Calculate Mission 2 Score
  const mission2Score = useMemo(() => {
    const basePoints = mission2.meatLaunched * 5;
    const bonus = mission2.bothLaunched && mission2.meatLaunched === 2 ? 5 : 0;
    return Math.min(basePoints + bonus, 15);
  }, [mission2.meatLaunched, mission2.bothLaunched]);

  // Calculate Mission 3 Score
  const mission3Score = useMemo(() => {
    return mission3.bales.reduce((total, bale) => {
      const pickup = bale.pickedUp ? 5 : 0;
      const forest = bale.inForest ? 5 : 0;
      return total + pickup + forest;
    }, 0);
  }, [mission3.bales]);

  // Calculate Mission 4 Score
  const mission4Score = useMemo(() => {
    const bonePoints = mission4.bones.reduce((total, bone) => {
      const pickup = bone.pickedUp ? 2 : 0;
      const base = bone.inBase ? 3 : 0;
      return total + pickup + base;
    }, 0);
    const allBonesInBase = mission4.bones.every(b => b.inBase);
    const bonus = mission4.allInBase && allBonesInBase ? 5 : 0;
    return Math.min(bonePoints + bonus, 20);
  }, [mission4.bones, mission4.allInBase]);

  // Calculate Mission 5 Score (CRITICAL)
  const mission5Score = useMemo(() => {
    // Critical rule: 0 pts if researcher toppled OR not all locations visited OR base not last
    if (mission5.researcherToppled) return 0;
    if (!mission5.allLocationsVisited) return 0;
    if (!mission5.baseIsLast) return 0;
    return 30;
  }, [mission5.researcherToppled, mission5.allLocationsVisited, mission5.baseIsLast]);

  // Calculate Mission 6 Score (CRITICAL)
  const mission6Score = useMemo(() => {
    // Critical rule: 0 pts if nest fell OR not on stump
    if (mission6.nestFell) return 0;
    if (!mission6.nestOnStump) return 0;
    return 15;
  }, [mission6.nestFell, mission6.nestOnStump]);

  // Calculate Mission 7 Score
  const mission7Score = useMemo(() => {
    return mission7.aligned ? 15 : 0;
  }, [mission7.aligned]);

  // Total Score
  const totalScore = useMemo(() => {
    return mission1Score + mission2Score + mission3Score + mission4Score + mission5Score + mission6Score + mission7Score;
  }, [mission1Score, mission2Score, mission3Score, mission4Score, mission5Score, mission6Score, mission7Score]);

  // Reset all missions
  const handleReset = () => {
    setMission1({ rocksCollected: 0 });
    setMission2({ meatLaunched: 0, bothLaunched: false });
    setMission3({
      bales: [
        { pickedUp: false, inForest: false },
        { pickedUp: false, inForest: false },
        { pickedUp: false, inForest: false },
      ],
    });
    setMission4({
      bones: [
        { pickedUp: false, inBase: false },
        { pickedUp: false, inBase: false },
        { pickedUp: false, inBase: false },
      ],
      allInBase: false,
    });
    setMission5({
      allLocationsVisited: false,
      baseIsLast: false,
      researcherToppled: false,
    });
    setMission6({
      nestOnStump: false,
      nestFell: false,
    });
    setMission7({ aligned: false });
    setTimeSeconds('180');
  };

  // Update Mission 1
  const updateMission1Rocks = (index: number) => {
    const newRocks = mission1.rocksCollected === index + 1 ? index : index + 1;
    setMission1({ rocksCollected: newRocks });
  };

  // Update Mission 3 bale
  const updateMission3Bale = (index: number, field: 'pickedUp' | 'inForest') => {
    const newBales = [...mission3.bales];
    newBales[index] = { ...newBales[index], [field]: !newBales[index][field] };
    setMission3({ bales: newBales });
  };

  // Update Mission 4 bone
  const updateMission4Bone = (index: number, field: 'pickedUp' | 'inBase') => {
    const newBones = [...mission4.bones];
    newBones[index] = { ...newBones[index], [field]: !newBones[index][field] };
    setMission4({ ...mission4, bones: newBones });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-['Space_Grotesk'] flex items-center gap-3">
                <Calculator className="w-8 h-8 text-[#14FFEC]" />
                Mission Calculator
              </h1>
              <p className="text-slate-400 mt-2">
                Score calculator for NRPC competition missions
              </p>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Mission Forms */}
          <div className="lg:col-span-2 space-y-6">
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
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  5 rocks × 5 pts + 5 bonus if all collected
                </p>
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
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  2 meat × 5 pts + 5 bonus if both launched
                </p>
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
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  3 bales × (5 pickup + 5 forest) = 30 pts max
                </p>
                <div className="space-y-3">
                  {mission3.bales.map((bale, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-16">
                        Bale {index + 1}
                      </span>
                      <div className="flex gap-4 flex-1">
                        <label className="flex items-center gap-2 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={bale.pickedUp}
                            onChange={() => updateMission3Bale(index, 'pickedUp')}
                            className="w-4 h-4 rounded border-slate-300 text-[#0D7377] focus:ring-[#0D7377]"
                          />
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            Picked up (+5)
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={bale.inForest}
                            onChange={() => updateMission3Bale(index, 'inForest')}
                            className="w-4 h-4 rounded border-slate-300 text-[#0D7377] focus:ring-[#0D7377]"
                          />
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            In forest (+5)
                          </span>
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
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  3 bones × (2 pickup + 3 base) + 5 bonus if all in base
                </p>
                <div className="space-y-3">
                  {mission4.bones.map((bone, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-16">
                        Bone {index + 1}
                      </span>
                      <div className="flex gap-4 flex-1">
                        <label className="flex items-center gap-2 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={bone.pickedUp}
                            onChange={() => updateMission4Bone(index, 'pickedUp')}
                            className="w-4 h-4 rounded border-slate-300 text-[#0D7377] focus:ring-[#0D7377]"
                          />
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            Picked up (+2)
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={bone.inBase}
                            onChange={() => updateMission4Bone(index, 'inBase')}
                            className="w-4 h-4 rounded border-slate-300 text-[#0D7377] focus:ring-[#0D7377]"
                          />
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            In base (+3)
                          </span>
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
                  <span className="text-sm font-medium text-[#0D7377]">
                    All bones in base (+5 bonus)
                  </span>
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
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      All locations visited
                    </span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mission5.baseIsLast}
                      onChange={(e) => setMission5({ ...mission5, baseIsLast: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-300 text-[#0D7377] focus:ring-[#0D7377]"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Base was last location visited
                    </span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mission5.researcherToppled}
                      onChange={(e) => setMission5({ ...mission5, researcherToppled: e.target.checked })}
                      className="w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm font-medium text-red-700 dark:text-red-400">
                      Researcher toppled (FAILS MISSION)
                    </span>
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
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Nest is on stump
                    </span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mission6.nestFell}
                      onChange={(e) => setMission6({ ...mission6, nestFell: e.target.checked })}
                      className="w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm font-medium text-red-700 dark:text-red-400">
                      Nest fell (FAILS MISSION)
                    </span>
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
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Binary: 0 or 15 points
                </p>
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
          </div>

          {/* Score Display Sidebar */}
          <div className="lg:col-span-1">
            <ScoreDisplay
              totalScore={totalScore}
              maxScore={MAX_TOTAL_SCORE}
              timeSeconds={timeSeconds}
              onTimeChange={setTimeSeconds}
            />

            {/* Mission Summary */}
            <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Mission Breakdown
              </h3>
              <div className="space-y-2">
                {[
                  { name: 'Mission 1: Rocks', score: mission1Score, max: 30 },
                  { name: 'Mission 2: Meat', score: mission2Score, max: 15 },
                  { name: 'Mission 3: Bales', score: mission3Score, max: 30 },
                  { name: 'Mission 4: Bones', score: mission4Score, max: 20 },
                  { name: 'Mission 5: Researcher', score: mission5Score, max: 30 },
                  { name: 'Mission 6: Nest', score: mission6Score, max: 15 },
                  { name: 'Mission 7: Alignment', score: mission7Score, max: 15 },
                ].map((mission) => (
                  <div key={mission.name} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400 truncate">{mission.name}</span>
                    <span className={`font-medium ${mission.score === mission.max ? 'text-[#0D7377]' : 'text-slate-900 dark:text-slate-100'}`}>
                      {mission.score}/{mission.max}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculatorPage;
