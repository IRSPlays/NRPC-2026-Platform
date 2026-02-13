import { Link } from 'react-router-dom';
import { Calculator, Upload, ArrowRight, Zap, Target, BookOpen, Cpu, ShieldAlert, ExternalLink, Award, MapPin, Star } from 'lucide-react';
import CountdownTimer from '../components/home/CountdownTimer';
import Announcements from '../components/home/Announcements';

const COMPETITION_DATE = '2026-05-08T17:00:00';

const timeline = [
  { date: '23 JAN - 4 MAR', event: 'Registration Open', active: true },
  { date: '8 MAY, 5PM', event: 'Submission Deadline', active: false },
  { date: '20 MAY, 5PM', event: 'Results of Selected Teams', active: false },
  { date: '28 MAY, 2:30PM', event: 'Surprise Mission', active: false },
  { date: '28 MAY', event: 'Prize Giving Ceremony', active: false },
];

const awards = [
  {
    rank: 'OVERALL CHAMPION (1ST)',
    title: 'Championship Award',
    criteria: [
      '60% Robot Performance',
      '20% Mechanical Design',
      '20% Research Poster'
    ],
    highlight: true
  },
  {
    rank: '1ST - 3RD PLACE',
    title: 'Best Robot Performance',
    description: 'Highest scores in mission objectives. Selection for F2F mission based on online score and timing.',
    highlight: false
  },
  {
    rank: '1ST - 3RD PLACE',
    title: 'Best Mechanical Design',
    description: 'Demonstrates sound understanding and appropriate use of mechanical principles.',
    highlight: false
  },
  {
    rank: '1ST - 3RD PLACE',
    title: 'Best Research Poster',
    description: 'Creativity in how modern science and biotech can bring back extinct species.',
    highlight: false
  }
];

export default function Home() {
  return (
    <div className="space-y-16 md:space-y-32 py-6 md:py-10">
      {/* Hero Section */}
      <section className="relative text-center space-y-8 md:space-y-12">
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
          
          <div className="max-w-3xl mx-auto px-4 space-y-6">
            <p className="text-base md:text-xl text-neo-slate/80 font-mono tracking-tight leading-relaxed">
              The 18th edition of the National Robotics Programming Competition (NRPC) is back for both <span className="text-neo-cyan">Primary and Secondary schools</span>. 
              In 2026, teams will compete within their own categories, using <span className="text-neo-amber">LEGO® MINDSTORMS™ EV3</span> or <span className="text-neo-amber">LEGO® Education SPIKE™ Prime</span> sets.
            </p>
            <p className="text-sm md:text-base text-neo-slate/60 leading-relaxed italic">
              Participating schools receive a complimentary playfield. Submissions are mostly online, with invited teams 
              attending a face-to-face Surprise Mission on 28 May for the final title.
            </p>
          </div>
        </div>

        <div className="flex justify-center w-full max-w-5xl mx-auto px-2">
          <div className="w-full">
            <CountdownTimer targetDate={COMPETITION_DATE} />
          </div>
        </div>

        {/* Hosting Partners */}
        <div className="pt-8 md:pt-16 flex flex-col items-center gap-6 md:gap-10 px-4">
          <p className="text-[8px] md:text-[10px] font-mono text-neo-slate/40 uppercase tracking-[0.4em] md:tracking-[0.6em] neo-text-glow">Tournament Hosting Partners</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-32">
            <div className="flex flex-col items-center gap-3 md:gap-4 group">
              <img src="/ADSS Logo.png" className="h-16 sm:h-24 md:h-32 w-auto filter drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all duration-500 group-hover:scale-110" alt="ADSS" />
              <span className="text-[8px] md:text-[10px] font-mono text-neo-slate/40 group-hover:text-neo-cyan transition-colors uppercase tracking-widest text-center">Admiralty Secondary School</span>
            </div>
            <div className="flex flex-col items-center gap-3 md:gap-4 group">
              <img src="/NYP Lgo.svg" className="h-16 sm:h-24 md:h-32 w-auto filter drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all duration-500 group-hover:scale-110" alt="NYP" />
              <span className="text-[8px] md:text-[10px] font-mono text-neo-slate/40 group-hover:text-neo-amber transition-colors uppercase tracking-widest text-center">Nanyang Polytechnic</span>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Section */}
      <section className="max-w-5xl mx-auto px-4 relative z-10">
        <div className="neo-glass rounded-[2rem] border-2 border-neo-cyan/20 p-8 md:p-12 overflow-hidden relative group">
          <div className="scanning-line absolute w-full top-0 left-0 opacity-20"></div>
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="shrink-0 relative">
              <div className="absolute -inset-4 bg-neo-cyan/20 blur-2xl rounded-full animate-pulse-slow"></div>
              <img 
                src="/registration-qr.png" 
                alt="Registration QR" 
                className="w-48 h-48 md:w-56 md:h-56 relative z-10 rounded-2xl border-4 border-white/10"
              />
            </div>
            <div className="flex-1 text-center md:text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-neo-cyan/10 border border-neo-cyan/30 text-neo-cyan text-xs font-mono uppercase tracking-widest animate-bounce">
                Status: Registration Open
              </div>
              <h2 className="text-3xl md:text-5xl font-heading font-black text-white uppercase tracking-tight leading-none">
                Join the <span className="text-neo-cyan">Frontier</span>
              </h2>
              <p className="text-neo-slate/60 text-sm md:text-lg leading-relaxed max-w-xl">
                The 18th Edition of NRPC is now accepting recruits. Secure your team's position in the de-extinction taskforce.
              </p>
              <a 
                href="https://go.gov.sg/18th-nrpc" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-4 bg-neo-cyan text-neo-void rounded-xl font-heading font-black uppercase tracking-widest hover:shadow-[0_0_30px_rgba(102,252,241,0.5)] transition-all group"
              >
                Register Now
                <ExternalLink className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Awards & Criteria Section */}
      <section className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center gap-12">
          <div className="text-center">
            <h2 className="text-xs font-mono text-neo-amber/60 uppercase tracking-[0.5em] mb-2">Recognition & Excellence</h2>
            <p className="text-3xl md:text-5xl font-heading font-black text-white uppercase tracking-tight">Awards & Criteria</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 w-full">
            {awards.map((award, index) => (
              <div 
                key={index}
                className={`neo-glass p-8 rounded-[2rem] border transition-all duration-500 relative overflow-hidden group ${
                  award.highlight ? 'border-neo-amber/40 bg-neo-amber/5' : 'border-white/5 hover:border-neo-cyan/30'
                }`}
              >
                <div className="relative z-10 space-y-4">
                  <div className={`text-[10px] font-mono font-bold tracking-widest ${award.highlight ? 'text-neo-amber' : 'text-neo-cyan/60'}`}>
                    {award.rank}
                  </div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl md:text-2xl font-heading font-bold text-white uppercase tracking-tight">
                      {award.title}
                    </h3>
                    {award.highlight && <Star className="w-5 h-5 text-neo-amber fill-neo-amber" />}
                  </div>
                  {award.criteria ? (
                    <ul className="space-y-2 pt-2">
                      {award.criteria.map((c, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-neo-slate/70 font-mono">
                          <div className="w-1.5 h-1.5 rounded-full bg-neo-amber"></div>
                          {c}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-neo-slate/60 leading-relaxed font-mono">
                      {award.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Venues Section */}
      <section className="max-w-5xl mx-auto px-4 relative z-10">
        <div className="neo-glass rounded-[2rem] border border-white/5 p-8 md:p-12 overflow-hidden bg-white/[0.02]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-left space-y-2">
              <div className="flex items-center justify-center md:justify-start gap-2 text-neo-cyan">
                <MapPin className="w-5 h-5" />
                <span className="text-xs font-mono font-bold uppercase tracking-widest">Surprise Mission Venues</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-white uppercase">Operational Hubs</h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 w-full md:w-auto">
              <div className="flex-1 p-6 rounded-2xl bg-neo-void/50 border border-white/5 space-y-2 min-w-[240px]">
                <div className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest">Primary Category</div>
                <div className="text-white font-bold uppercase">Admiralty Secondary School</div>
              </div>
              <div className="flex-1 p-6 rounded-2xl bg-neo-void/50 border border-white/5 space-y-2 min-w-[240px]">
                <div className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest">Secondary Category</div>
                <div className="text-white font-bold uppercase">Nanyang Polytechnic</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Announcements */}
      <section className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-neo-cyan to-neo-amber opacity-10 group-hover:opacity-20 blur transition-all rounded-3xl"></div>
          <div className="relative neo-glass rounded-3xl p-1 overflow-hidden">
            <div className="scanning-line absolute w-full top-0 left-0 opacity-20"></div>
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

      {/* Competition Timeline */}
      <section className="max-w-5xl mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center gap-12">
          <div className="text-center">
            <h2 className="text-xs font-mono text-neo-cyan/60 uppercase tracking-[0.5em] mb-2">Tournament Roadmap</h2>
            <p className="text-3xl font-heading font-black text-white uppercase tracking-tight">Mission Schedule</p>
          </div>
          
          <div className="w-full grid grid-cols-1 md:grid-cols-5 gap-4">
            {timeline.map((item, index) => (
              <div 
                key={index}
                className={`neo-glass p-6 rounded-2xl border transition-all duration-500 relative group overflow-hidden ${
                  item.active ? 'border-neo-cyan/40 bg-neo-cyan/5' : 'border-white/5 opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
                }`}
              >
                {item.active && <div className="scanning-line absolute w-full top-0 left-0 opacity-20"></div>}
                <div className="relative z-10 space-y-4">
                  <div className={`text-[10px] font-mono font-bold tracking-widest ${item.active ? 'text-neo-cyan' : 'text-neo-slate/40'}`}>
                    {item.date}
                  </div>
                  <div className={`text-sm font-heading font-bold uppercase leading-tight ${item.active ? 'text-white' : 'text-neo-slate/60'}`}>
                    {item.event}
                  </div>
                  <div className={`w-2 h-2 rounded-full ${item.active ? 'bg-neo-cyan animate-pulse shadow-[0_0_10px_rgba(102,252,241,0.8)]' : 'bg-white/10'}`}></div>
                </div>
              </div>
            ))}
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

      {/* Call to Actions */}
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

      <footer className="text-center py-12 md:py-20 border-t border-white/5 relative z-10 space-y-8">
        <div className="flex flex-col items-center gap-4">
          <p className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest">Encountering Issues?</p>
          <Link to="/support" className="text-xs font-mono text-neo-cyan hover:neo-text-glow uppercase tracking-[0.3em] flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Open Support Signal
          </Link>
        </div>
        <div className="flex justify-center gap-8 opacity-40">
           <img src="/ADSS Logo.png" alt="ADSS" className="h-10 w-auto" />
           <img src="/NYP Lgo.svg" alt="NYP" className="h-10 w-auto" />
        </div>
        <p className="text-[8px] md:text-[10px] font-mono text-neo-slate/30 uppercase tracking-[0.4em] px-4">
          Powered by NRPC Intelligence // © 2026 De-Extinction Taskforce
        </p>
      </footer>
    </div>
  );
}
