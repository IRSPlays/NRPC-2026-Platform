import { Link } from 'react-router-dom';
import { Calculator, Upload, ArrowRight, Zap, Target, BookOpen, Cpu, ShieldAlert } from 'lucide-react';
import CountdownTimer from '../components/home/CountdownTimer';
import Announcements from '../components/home/Announcements';

const COMPETITION_DATE = '2026-05-09T17:00:00';

export default function Home() {
  return (
    <div className="space-y-16 md:space-y-24 py-6 md:py-10">
      {/* Hero Section - High Tech "De-Extinction" Command Center */}
      <section className="relative text-center space-y-8 md:space-y-12">
        {/* Ambient Glows */}
        <div className="absolute inset-0 -top-20 -z-10 flex justify-center opacity-30 pointer-events-none">
          <div className="w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-neo-cyan/10 blur-[80px] md:blur-[120px] rounded-full animate-pulse-slow"></div>
        </div>

        <div className="space-y-4 md:space-y-6">
          <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full border border-neo-cyan/30 bg-neo-cyan/5 text-neo-cyan text-[8px] md:text-xs font-mono tracking-[0.2em] uppercase mb-2 md:mb-4 neo-text-glow">
            <Cpu className="w-3 h-3 animate-spin" />
            System Status: Operational // NRPC-2026
          </div>
          
          <div className="flex justify-center mb-6 md:mb-12">
            <img 
              src="/NRPC Logo.png" 
              alt="NRPC Logo" 
              className="h-32 sm:h-48 md:h-64 w-auto filter drop-shadow-[0_0_30px_rgba(102,252,241,0.2)] animate-float"
            />
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-9xl font-heading font-black text-white tracking-tighter uppercase leading-[0.85]">
            De-<span className="text-neo-cyan neo-text-glow">Extinction</span>
          </h1>
          
          <p className="text-base md:text-2xl text-neo-slate/80 font-mono tracking-tight max-w-3xl mx-auto px-4">
            Synthesizing biological recovery through <span className="text-neo-amber text-glow">advanced robotics</span> and genomic innovation.
          </p>
        </div>

        <div className="flex justify-center w-full max-w-5xl mx-auto px-2">
          <div className="w-full">
            <CountdownTimer targetDate={COMPETITION_DATE} />
          </div>
        </div>

        {/* Hosted By Section */}
        <div className="pt-8 md:pt-16 flex flex-col items-center gap-6 md:gap-10 px-4">
          <p className="text-[8px] md:text-[10px] font-mono text-neo-slate/40 uppercase tracking-[0.4em] md:tracking-[0.6em] neo-text-glow">Tournament Hosting Partners</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-32">
            <div className="flex flex-col items-center gap-3 md:gap-4 group">
              <img 
                src="/ADSS Logo.png" 
                className="h-16 sm:h-24 md:h-32 w-auto filter drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all duration-500 group-hover:scale-110" 
                alt="ADSS"
              />
              <span className="text-[8px] md:text-[10px] font-mono text-neo-slate/40 group-hover:text-neo-cyan transition-colors uppercase tracking-widest text-center">Admiralty Secondary School</span>
            </div>
            <div className="flex flex-col items-center gap-3 md:gap-4 group">
              <img 
                src="/NYP Lgo.svg" 
                className="h-16 sm:h-24 md:h-32 w-auto filter drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all duration-500 group-hover:scale-110" 
                alt="NYP"
              />
              <span className="text-[8px] md:text-[10px] font-mono text-neo-slate/40 group-hover:text-neo-amber transition-colors uppercase tracking-widest text-center">Nanyang Polytechnic</span>
            </div>
          </div>
        </div>
      </section>

      {/* Announcements Glass Panel */}
      <section className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-neo-cyan to-neo-amber opacity-10 group-hover:opacity-20 blur transition-all rounded-3xl"></div>
          <div className="relative neo-glass rounded-3xl p-1 overflow-hidden">
            <div className="scanning-line absolute w-full top-0 left-0"></div>
            <div className="p-4 md:p-6">
              <div className="flex items-center gap-3 mb-4 md:mb-6 border-b border-neo-cyan/10 pb-4">
                <ShieldAlert className="w-5 h-5 text-neo-amber" />
                <h2 className="text-[10px] md:text-sm font-mono uppercase tracking-[0.3em] text-white">Broadcast Feed</h2>
              </div>
              <Announcements />
            </div>
          </div>
        </div>
      </section>

      {/* Core Objectives */}
      <section className="grid lg:grid-cols-2 gap-6 md:gap-8 items-stretch px-4 relative z-10">
        <div className="neo-glass rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 border-l-4 border-neo-amber group hover:bg-neo-surface/60 transition-all relative overflow-hidden">
          <div className="flex items-center gap-4 md:gap-5 mb-6 md:mb-8">
            <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-neo-amber/10 text-neo-amber border border-neo-amber/20">
              <BookOpen className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div>
              <h2 className="text-xl md:text-3xl font-heading font-bold text-white uppercase tracking-tight">
                Research <span className="text-neo-amber text-glow">Poster</span>
              </h2>
              <p className="text-neo-amber/60 text-[8px] md:text-xs font-mono tracking-widest uppercase">ID: RP-100</p>
            </div>
          </div>
          
          <p className="text-sm md:text-lg text-neo-slate/70 mb-8 md:mb-10 leading-relaxed">
            Architect the biological framework of de-extinction. Detail synthesis of DNA recovery and future preservation.
          </p>
          
          <div className="grid grid-cols-2 gap-2 md:gap-4">
            {[
              { label: 'DNA Recovery', val: '40%' },
              { label: 'Future Vision', val: '30%' },
              { label: 'Logic Flow', val: '20%' },
              { label: 'Aesthetics', val: '10%' }
            ].map(item => (
              <div key={item.label} className="p-3 md:p-4 border border-white/5 rounded-xl md:rounded-2xl bg-white/[0.02] flex justify-between items-center">
                <span className="text-[8px] md:text-xs font-mono text-neo-slate/40 uppercase">{item.label}</span>
                <span className="text-xs md:text-base font-bold text-neo-amber">{item.val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="neo-glass rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 border-l-4 border-neo-cyan group hover:bg-neo-surface/60 transition-all relative overflow-hidden">
          <div className="flex items-center gap-4 md:gap-5 mb-6 md:mb-8">
            <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-neo-cyan/10 text-neo-cyan border border-neo-cyan/20">
              <Zap className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div>
              <h2 className="text-xl md:text-3xl font-heading font-bold text-white uppercase tracking-tight">
                Robot <span className="text-neo-cyan text-glow">Missions</span>
              </h2>
              <p className="text-neo-cyan/60 text-[8px] md:text-xs font-mono tracking-widest uppercase">ID: RM-155</p>
            </div>
          </div>
          
          <p className="text-sm md:text-lg text-neo-slate/70 mb-8 md:mb-10 leading-relaxed">
            Deploy autonomous units to field ops. 7 high-stakes missions designed to test precision navigation.
          </p>
          
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map(m => (
                <div key={m} className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl border border-neo-cyan/20 flex items-center justify-center text-neo-cyan font-bold text-xs md:text-sm bg-neo-cyan/5">
                  {m}
                </div>
              ))}
            </div>
            <div className="p-3 md:p-4 border border-white/5 rounded-xl md:rounded-2xl bg-white/[0.02] flex justify-between items-center">
              <span className="text-[8px] md:text-xs font-mono text-neo-slate/40 uppercase tracking-tighter md:tracking-normal">Max Operational Rating</span>
              <span className="text-xs md:text-base font-bold text-neo-cyan">155 PTS</span>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Actions - Floating Dock Style */}
      <section className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 pt-6 md:pt-10 px-4 relative z-10">
        <Link to="/calculator" className="w-full sm:w-auto btn-neo group flex items-center justify-center gap-3 py-4 md:py-5 px-8 md:px-12 text-base md:text-lg">
          <Target className="w-5 h-5 md:w-6 md:h-6 group-hover:rotate-90 transition-transform" />
          Calculator
          <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-2 transition-transform" />
        </Link>
        <Link to="/team-login" className="w-full sm:w-auto btn-neo-amber flex items-center justify-center gap-3 py-4 md:py-5 px-8 md:px-12 text-base md:text-lg">
          <Upload className="w-5 h-5 md:w-6 md:h-6" />
          Submit Poster
        </Link>
      </section>

      <footer className="text-center py-12 md:py-20 border-t border-white/5 opacity-50 relative z-10">
        <p className="text-[8px] md:text-[10px] font-mono text-neo-slate/30 uppercase tracking-[0.2em] md:tracking-[0.4em] px-4">
          Powered by NRPC Intelligence // © 2026 De-Extinction Taskforce
        </p>
      </footer>
    </div>
  );
}
