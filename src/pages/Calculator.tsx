import React, { useState, useMemo, useEffect } from 'react';
import { Calculator, RotateCcw, Terminal, Settings2 } from 'lucide-react';
import MissionCard from '../components/calculator/MissionCard';
import ScoreDisplay from '../components/calculator/ScoreDisplay';

interface Mission1State { rocksCollected: number; }
interface Mission2State { meatLaunched: number; bothLaunched: boolean; }
interface Mission3State { bales: { moved: boolean; inForest: boolean; }[]; }
interface Mission4State { fossils: { pickedUp: boolean; inBase: boolean; }[]; allInBase: boolean; }
interface Mission5State { scientistsInBase: number; scientistFell: boolean; }
interface Mission6State { nestOut: boolean; nestOnStump: boolean; nestFell: boolean; }
interface Mission7State { active: boolean; }

const MAX_TOTAL_SCORE = 155;

const CalculatorPage: React.FC = () => {
  const [timeSeconds, setTimeSeconds] = useState('150');

  const [mission1, setMission1] = useState<Mission1State>({ rocksCollected: 0 });
  const [mission2, setMission2] = useState<Mission2State>({ meatLaunched: 0, bothLaunched: false });
  const [mission3, setMission3] = useState<Mission3State>({
    bales: [{ moved: false, inForest: false }, { moved: false, inForest: false }, { moved: false, inForest: false }],
  });
  const [mission4, setMission4] = useState<Mission4State>({
    fossils: [{ pickedUp: false, inBase: false }, { pickedUp: false, inBase: false }, { pickedUp: false, inBase: false }],
    allInBase: false,
  });
  const [mission5, setMission5] = useState<Mission5State>({ scientistsInBase: 0, scientistFell: false });
  const [mission6, setMission6] = useState<Mission6State>({ nestOut: false, nestOnStump: false, nestFell: false });
  const [mission7, setMission7] = useState<Mission7State>({ active: false });

  // Auto-update bonus states
  useEffect(() => {
    setMission2(prev => ({ ...prev, bothLaunched: prev.meatLaunched === 2 }));
  }, [mission2.meatLaunched]);

  useEffect(() => {
    const allInBaseNow = mission4.fossils.every(f => f.inBase);
    if (mission4.allInBase !== allInBaseNow) {
      setMission4(prev => ({ ...prev, allInBase: allInBaseNow }));
    }
  }, [mission4.fossils]);

  const mission1Score = useMemo(() => mission1.rocksCollected * 5 + (mission1.rocksCollected === 5 ? 5 : 0), [mission1.rocksCollected]);
  const mission2Score = useMemo(() => mission2.meatLaunched * 5 + (mission2.meatLaunched === 2 ? 5 : 0), [mission2.meatLaunched]);
  const mission3Score = useMemo(() => mission3.bales.reduce((t, b) => t + (b.moved ? 5 : 0) + (b.inForest ? 5 : 0), 0), [mission3.bales]);
  const mission4Score = useMemo(() => {
    const base = mission4.fossils.reduce((t, f) => t + (f.pickedUp ? 2 : 0) + (f.inBase ? 3 : 0), 0);
    return base + (mission4.fossils.every(f => f.inBase) ? 5 : 0);
  }, [mission4.fossils]);
  const mission5Score = useMemo(() => mission5.scientistFell ? 0 : mission5.scientistsInBase * 10, [mission5.scientistsInBase, mission5.scientistFell]);
  const mission6Score = useMemo(() => {
    if (mission6.nestFell) return 0;
    return (mission6.nestOut ? 5 : 0) + (mission6.nestOnStump ? 10 : 0);
  }, [mission6.nestOut, mission6.nestOnStump, mission6.nestFell]);
  const mission7Score = useMemo(() => (mission7.active ? 15 : 0), [mission7.active]);

  const totalScore = useMemo(() => mission1Score + mission2Score + mission3Score + mission4Score + mission5Score + mission6Score + mission7Score, [mission1Score, mission2Score, mission3Score, mission4Score, mission5Score, mission6Score, mission7Score]);

  const handleReset = () => {
    setMission1({ rocksCollected: 0 });
    setMission2({ meatLaunched: 0, bothLaunched: false });
    setMission3({ bales: [{ moved: false, inForest: false }, { moved: false, inForest: false }, { moved: false, inForest: false }] });
    setMission4({ fossils: [{ pickedUp: false, inBase: false }, { pickedUp: false, inBase: false }, { pickedUp: false, inBase: false }], allInBase: false });
    setMission5({ scientistsInBase: 0, scientistFell: false });
    setMission6({ nestOut: false, nestOnStump: false, nestFell: false });
    setMission7({ active: false });
    setTimeSeconds('150');
  };

  return (
    <div className="min-h-screen pb-20 space-y-12">
      <div className="relative overflow-hidden neo-glass rounded-[2rem] border-neo-cyan/10 p-10 mb-12 mt-8">
        <div className="scanning-line absolute w-full top-0 left-0 opacity-20"></div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-neo-cyan/10 flex items-center justify-center border border-neo-cyan/30">
              <Calculator className="w-8 h-8 text-neo-cyan" />
            </div>
            <div>
              <h1 className="text-4xl font-heading font-black text-white uppercase tracking-tighter">
                Mission <span className="text-neo-cyan">Calculator</span>
              </h1>
              <div className="flex items-center gap-3 mt-1 font-mono text-xs uppercase tracking-[0.2em] text-neo-cyan/60">
                <Terminal className="w-3 h-3" /> System Ready // NRPC-2026
              </div>
            </div>
          </div>
          <button onClick={handleReset} className="flex items-center gap-3 px-6 py-3 bg-neo-surface border border-white/10 hover:border-neo-amber/50 hover:text-neo-amber text-neo-slate/60 rounded-xl transition-all font-mono text-sm font-bold uppercase tracking-widest">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-8">
            {/* Mission 1 */}
            <MissionCard number={1} title="Clear the way" maxPoints={30} currentPoints={mission1Score} isComplete={mission1Score === 30}>
              <div className="space-y-6">
                <p className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest leading-relaxed">
                  5 rocks are blocking the stream. Drop off the rocks in the Processing Plant.
                </p>
                <div className="grid grid-cols-5 gap-4">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <button key={i} onClick={() => setMission1({ rocksCollected: mission1.rocksCollected === i + 1 ? i : i + 1 })}
                      className={`aspect-square rounded-2xl border-2 flex items-center justify-center text-xl font-black font-mono transition-all ${i < mission1.rocksCollected ? 'border-neo-cyan bg-neo-cyan/20 text-neo-cyan shadow-[0_0_15px_rgba(102,252,241,0.2)]' : 'border-white/5 bg-white/[0.02] text-white/10'}`}
                    >{i < mission1.rocksCollected ? '✓' : i + 1}</button>
                  ))}
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-4 bg-neo-void/30 rounded-xl border border-white/5">
                    <span className="text-[10px] font-mono text-neo-slate/40 uppercase">i. For each rock dropped off in Processing Plant</span>
                    <span className="text-sm font-bold font-mono text-neo-cyan">5 PTS</span>
                  </div>
                  <div className={`flex justify-between items-center p-4 rounded-xl border transition-all ${mission1.rocksCollected === 5 ? 'bg-neo-cyan/10 border-neo-cyan/30 text-neo-cyan' : 'bg-neo-void/30 border-white/5 text-neo-slate/20'}`}>
                    <span className="text-[10px] font-mono uppercase">ii. If all rocks are dropped off (EXTRA)</span>
                    <span className="text-sm font-bold font-mono">5 PTS</span>
                  </div>
                </div>
              </div>
            </MissionCard>

            {/* Mission 2 */}
            <MissionCard number={2} title="Feeding time!" maxPoints={15} currentPoints={mission2Score} isComplete={mission2Score === 15}>
              <div className="space-y-6">
                <p className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest leading-relaxed">
                  Launch the meat over the fence into the Tasmanian Tiger enclosure.
                </p>
                <div className="flex gap-4">
                  {[0, 1, 2].map(n => (
                    <button key={n} onClick={() => setMission2({ ...mission2, meatLaunched: n })}
                      className={`flex-1 py-4 px-4 rounded-2xl border-2 font-mono font-bold transition-all uppercase tracking-widest text-sm ${mission2.meatLaunched === n ? 'border-neo-cyan bg-neo-cyan/20 text-neo-cyan shadow-[0_0_15px_rgba(102,252,241,0.2)]' : 'border-white/5 bg-white/[0.02] text-white/10'}`}
                    >{n} Meat</button>
                  ))}
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-4 bg-neo-void/30 rounded-xl border border-white/5">
                    <span className="text-[10px] font-mono text-neo-slate/40 uppercase">i. For each piece of meat successfully launched</span>
                    <span className="text-sm font-bold font-mono text-neo-cyan">5 PTS</span>
                  </div>
                  <div
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${mission2.bothLaunched && mission2.meatLaunched === 2 ? 'bg-neo-cyan/10 border-neo-cyan/30 text-neo-cyan shadow-[0_0_10px_rgba(102,252,241,0.3)]' : 'bg-neo-void/30 border-white/5 text-neo-slate/20'}`}
                  >
                  <span className="text-[10px] font-mono uppercase">ii. Both pieces successfully launched (EXTRA)</span>
                    <span className="text-sm font-bold font-mono">5 PTS {mission2.meatLaunched === 2 && '✓'}</span>
                </div>
                </div>
              </div>
            </MissionCard>

            {/* Mission 3 */}
            <MissionCard number={3} title="Store the hay bales" maxPoints={30} currentPoints={mission3Score} isComplete={mission3Score === 30}>
              <div className="space-y-4">
                <p className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest leading-relaxed mb-4">
                  Move 3 hay bales into the forest zone for storage.
                </p>
                {mission3.bales.map((b, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="text-[10px] font-mono font-bold text-neo-slate/40 w-12 text-center border-r border-white/5 pr-4">BALE {i+1}</div>
                    <div className="flex gap-2 flex-1">
                      <button onClick={() => { const n=[...mission3.bales]; n[i].moved=!n[i].moved; setMission3({bales:n}); }}
                        className={`flex-1 py-2 rounded-xl border font-mono text-[8px] font-bold uppercase transition-all ${b.moved ? 'border-neo-cyan bg-neo-cyan/10 text-neo-cyan' : 'border-white/10 text-white/20'}`}
                      >i. MOVED FROM START</button>
                      <button onClick={() => { const n=[...mission3.bales]; n[i].inForest=!n[i].inForest; setMission3({bales:n}); }}
                        className={`flex-1 py-2 rounded-xl border font-mono text-[8px] font-bold uppercase transition-all ${b.inForest ? 'border-neo-cyan bg-neo-cyan/10 text-neo-cyan' : 'border-white/10 text-white/20'}`}
                      >ii. MOVED INTO FOREST</button>
                    </div>
                    <div className="text-xl font-black font-mono text-neo-cyan w-8 text-right">{(b.moved ? 5 : 0) + (b.inForest ? 5 : 0)}</div>
                  </div>
                ))}
              </div>
            </MissionCard>

            {/* Mission 4 */}
            <MissionCard number={4} title="Collect the fossils" maxPoints={20} currentPoints={mission4Score} isComplete={mission4Score === 20}>
              <div className="space-y-4">
                <p className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest leading-relaxed mb-4">
                  Move 3 fossils from the forest to the base.
                </p>
                {mission4.fossils.map((f, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="text-[10px] font-mono font-bold text-neo-slate/40 w-12 text-center border-r border-white/5 pr-4">FOSSIL {i+1}</div>
                    <div className="flex gap-2 flex-1">
                      <button onClick={() => { const n=[...mission4.fossils]; n[i].pickedUp=!n[i].pickedUp; setMission4({...mission4, fossils:n}); }}
                        className={`flex-1 py-2 rounded-xl border font-mono text-[8px] font-bold uppercase transition-all ${f.pickedUp ? 'border-neo-cyan bg-neo-cyan/10 text-neo-cyan' : 'border-white/10 text-white/20'}`}
                      >i. PICKED UP</button>
                      <button onClick={() => { const n=[...mission4.fossils]; n[i].inBase=!n[i].inBase; setMission4({...mission4, fossils:n}); }}
                        className={`flex-1 py-2 rounded-xl border font-mono text-[8px] font-bold uppercase transition-all ${f.inBase ? 'border-neo-cyan bg-neo-cyan/10 text-neo-cyan' : 'border-white/10 text-white/20'}`}
                      >ii. INSIDE BASE</button>
                    </div>
                    <div className="text-xl font-black font-mono text-neo-cyan w-8 text-right">{(f.pickedUp ? 2 : 0) + (f.inBase ? 3 : 0)}</div>
                  </div>
                ))}
                <div
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${mission4.allInBase && mission4.fossils.every(f => f.inBase) ? 'bg-neo-cyan/10 border-neo-cyan/30 text-neo-cyan shadow-[0_0_10px_rgba(102,252,241,0.3)]' : 'bg-neo-void/30 border-white/5 text-neo-slate/20'}`}
                >
                  <span className="text-[10px] font-mono uppercase">iii. If all 3 fossils are fully inside base (EXTRA)</span>
                  <span className="text-sm font-bold font-mono">5 PTS {mission4.fossils.every(f => f.inBase) && '✓'}</span>
                </div>
              </div>
            </MissionCard>

            {/* Mission 5 */}
            <MissionCard number={5} title="Sanctuary Tour" maxPoints={30} currentPoints={mission5Score} isCritical={true} isComplete={mission5Score === 30}>
              <div className="space-y-6">
                <p className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest leading-relaxed">
                  Bring the scientists back safely to the base!
                </p>
                <div className="flex gap-4">
                  {[0, 1, 2, 3].map(n => (
                    <button key={n} onClick={() => setMission5({ ...mission5, scientistsInBase: n })}
                      className={`flex-1 py-4 px-4 rounded-2xl border-2 font-mono font-bold transition-all uppercase tracking-widest text-sm ${mission5.scientistsInBase === n ? 'border-neo-cyan bg-neo-cyan/20 text-neo-cyan shadow-[0_0_15px_rgba(102,252,241,0.2)]' : 'border-white/5 bg-white/[0.02] text-white/10'}`}
                    >{n} Units</button>
                  ))}
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-4 bg-neo-void/30 rounded-xl border border-white/5">
                    <span className="text-[10px] font-mono text-neo-slate/40 uppercase">i. For each scientist fully in base</span>
                    <span className="text-sm font-bold font-mono text-neo-cyan">10 PTS</span>
                  </div>
                  <button onClick={() => setMission5({ ...mission5, scientistFell: !mission5.scientistFell })}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${mission5.scientistFell ? 'bg-neo-amber/10 border-neo-amber/30 text-neo-amber' : 'bg-neo-void/30 border-white/5 text-neo-slate/20'}`}
                  >
                    <span className="text-[10px] font-mono uppercase">ii. If a scientist falls over</span>
                    <span className="text-sm font-bold font-mono">0 PTS (TOTAL)</span>
                  </button>
                </div>
              </div>
            </MissionCard>

            {/* Mission 6 */}
            <MissionCard number={6} title="Rescue" maxPoints={15} currentPoints={mission6Score} isCritical={true} isComplete={mission6Score === 15}>
              <div className="space-y-4">
                <p className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest leading-relaxed mb-4">
                  Pick up the nest and place it on the tree stump!
                </p>
                <div className="space-y-3">
                  <button onClick={() => setMission6({ ...mission6, nestOut: !mission6.nestOut })}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${mission6.nestOut ? 'border-neo-cyan bg-neo-cyan/10 text-neo-cyan' : 'border-white/5 text-white/10'}`}
                  >
                    <span className="text-[10px] font-mono uppercase">i. Nest is fully out of starting position</span>
                    <span className="text-sm font-bold font-mono">5 PTS</span>
                  </button>
                  <button onClick={() => setMission6({ ...mission6, nestOnStump: !mission6.nestOnStump })}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${mission6.nestOnStump ? 'border-neo-cyan bg-neo-cyan/10 text-neo-cyan' : 'border-white/5 text-white/10'}`}
                  >
                    <span className="text-[10px] font-mono uppercase">ii. Nest is placed upright on tree stump</span>
                    <span className="text-sm font-bold font-mono">10 PTS</span>
                  </button>
                  <button onClick={() => setMission6({ ...mission6, nestFell: !mission6.nestFell })}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${mission6.nestFell ? 'bg-neo-amber/10 border-neo-amber/30 text-neo-amber' : 'border-white/5 text-white/10'}`}
                  >
                    <span className="text-[10px] font-mono uppercase">iii. If the nest falls</span>
                    <span className="text-sm font-bold font-mono">0 PTS (TOTAL)</span>
                  </button>
                </div>
              </div>
            </MissionCard>

            {/* Mission 7 */}
            <MissionCard number={7} title="Power it Up!" maxPoints={15} currentPoints={mission7Score} isComplete={mission7Score === 15}>
              <div className="space-y-6">
                <p className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest leading-relaxed">
                  Activate the Wind Turbine and make the fan blades spin!
                </p>
                <button onClick={() => setMission7({ active: !mission7.active })}
                  className={`w-full h-24 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 font-mono uppercase tracking-[0.2em] font-black transition-all ${mission7.active ? 'border-neo-cyan bg-neo-cyan/20 text-neo-cyan neo-text-glow' : 'border-white/5 bg-white/[0.02] text-white/10'}`}
                >
                  <Settings2 className={`w-6 h-6 ${mission7.active ? 'animate-spin-slow' : ''}`} />
                  {mission7.active ? 'i. FAN BLADES MOVE' : 'READY TO TRIGGER'}
                </button>
              </div>
            </MissionCard>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <ScoreDisplay totalScore={totalScore} maxScore={MAX_TOTAL_SCORE} timeSeconds={timeSeconds} onTimeChange={setTimeSeconds} />
            <div className="neo-glass rounded-3xl p-8 border-white/5">
              <h3 className="text-xs font-mono font-bold text-neo-slate/40 uppercase tracking-[0.3em] mb-6 border-b border-white/5 pb-4">Tournament Registry</h3>
              <div className="space-y-4 font-mono text-[10px]">
                <p className="text-neo-slate/60 leading-relaxed uppercase">
                  The maximum score possible for the NRPC Challenge is 155 points.
                </p>
                <p className="text-neo-amber/60 leading-relaxed uppercase border-t border-white/5 pt-4">
                  If more than one team has the same total score, rankings are decided by mission completion time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculatorPage;
