import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Send, AlertCircle, CheckCircle2, Upload, X, ShieldAlert, Zap, Radio, Info, Users } from 'lucide-react';
import { ticketsAPI } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

const CATEGORIES = ['Rule Query', 'Technical Support', 'Submission Issue', 'Other'];
const URGENCY_LEVELS = [
  { id: 'Low', color: 'text-neo-cyan border-neo-cyan/20 bg-neo-cyan/5' },
  { id: 'Medium', color: 'text-white border-white/10 bg-white/5' },
  { id: 'High', color: 'text-neo-amber border-neo-amber/20 bg-neo-amber/5' },
  { id: 'Critical', color: 'text-red-400 border-red-400/20 bg-red-400/5' }
];

export default function Support() {
  const { isTeam, teamName } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'Rule Query',
    urgency: 'Medium',
    description: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isTeam && teamName) {
      setFormData(prev => ({ ...prev, name: teamName }));
    }
  }, [isTeam, teamName]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.size > 5 * 1024 * 1024) {
        setError('Artifact too large. Max 5MB allowed.');
        return;
      }
      setFile(selected);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await ticketsAPI.create({ ...formData, file: file || undefined });
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || 'Transmission failed. Signal lost.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-8 animate-fade-in">
        <div className="w-24 h-24 bg-neo-cyan/10 rounded-full border border-neo-cyan/30 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(102,252,241,0.2)]">
          <CheckCircle2 className="w-12 h-12 text-neo-cyan" />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-heading font-black text-white uppercase tracking-tight">Signal <span className="text-neo-cyan">Received</span></h1>
          <p className="text-neo-slate/60 font-mono text-sm uppercase tracking-widest leading-relaxed">
            Your distress signal has been captured by the central intelligence hub. <br/>
            An assessor will review your request shortly.
          </p>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="btn-neo py-4 px-12"
        >
          Return to Command
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="neo-glass rounded-[2rem] border-neo-cyan/10 overflow-hidden relative">
        <div className="scanning-line absolute w-full top-0 left-0 opacity-20"></div>

        {/* Header */}
        <div className="bg-neo-cyan/5 p-8 md:p-12 border-b border-neo-cyan/10">
          <div className="flex items-center gap-6">
            <div className="p-4 rounded-2xl bg-neo-cyan/10 text-neo-cyan border border-neo-cyan/30 shadow-[0_0_20px_rgba(102,252,241,0.1)]">
              <Radio className="w-10 h-10 animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-heading font-black text-white uppercase tracking-tight">Support <span className="text-neo-cyan">Uplink</span></h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-xs md:text-sm font-mono text-neo-cyan/60 uppercase tracking-[0.3em]">Submit technical signals</p>
                {isTeam && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-neo-cyan/20 border border-neo-cyan/30 text-[8px] font-mono text-neo-cyan font-bold uppercase tracking-widest">
                    <Users className="w-3 h-3" /> Team Authenticated
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-10">
          {error && (
            <div className="p-4 rounded-xl bg-neo-amber/10 border border-neo-amber/30 text-neo-amber text-sm font-bold flex items-center gap-3">
              <ShieldAlert className="w-5 h-5" /> {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest ml-4">Identifier (Name)</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Operator Name"
                className="w-full bg-neo-void/50 border border-white/10 rounded-2xl py-4 px-6 text-white font-mono focus:border-neo-cyan/40 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest ml-4">Comm-Link (Email)</label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className="w-full bg-neo-void/50 border border-white/10 rounded-2xl py-4 px-6 text-white font-mono focus:border-neo-cyan/40 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest ml-4">Issue Classification</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat })}
                  className={`py-3 px-4 rounded-xl border text-[10px] font-mono font-bold uppercase transition-all ${
                    formData.category === cat ? 'bg-neo-cyan text-neo-void border-neo-cyan shadow-[0_0_15px_rgba(102,252,241,0.3)]' : 'bg-white/5 border-white/10 text-neo-slate/40 hover:border-white/30'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest ml-4">Urgency Protocol</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {URGENCY_LEVELS.map(level => (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, urgency: level.id })}
                  className={`py-3 px-4 rounded-xl border text-[10px] font-mono font-bold uppercase transition-all flex items-center justify-center gap-2 ${
                    formData.urgency === level.id ? level.color.replace('border-neo-cyan/20', 'border-neo-cyan').replace('border-neo-amber/20', 'border-neo-amber').replace('border-red-400/20', 'border-red-400') : 'bg-white/5 border-white/10 text-neo-slate/40 hover:border-white/30'
                  }`}
                >
                  <Zap className={`w-3 h-3 ${formData.urgency === level.id ? '' : 'opacity-20'}`} />
                  {level.id}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest ml-4">Signal Description</label>
            <textarea
              required
              rows={5}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide detailed telemetry regarding your issue..."
              className="w-full bg-neo-void/50 border border-white/10 rounded-2xl py-4 px-6 text-white font-mono text-sm focus:border-neo-cyan/40 outline-none transition-all resize-none"
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest ml-4">Visual Evidence (Optional)</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                file ? 'border-neo-cyan bg-neo-cyan/5' : 'border-white/10 hover:border-neo-cyan/20 bg-white/[0.02]'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              {file ? (
                <div className="flex items-center justify-center gap-4">
                  <div className="p-3 bg-neo-cyan/10 rounded-xl">
                    <CheckCircle2 className="w-6 h-6 text-neo-cyan" />
                  </div>
                  <div className="text-left">
                    <div className="text-white font-mono text-xs">{file.name}</div>
                    <div className="text-[10px] font-mono text-neo-slate/40 uppercase">Ready for transmission</div>
                  </div>
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="p-2 hover:bg-red-500/10 rounded-lg text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 text-neo-slate/20 mx-auto" />
                  <p className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest">Drop screenshot or click to browse</p>
                  <p className="text-[8px] font-mono text-neo-slate/20 uppercase">JPG / PNG / WEBP // MAX 5MB</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-6">
            <button
              disabled={loading}
              type="submit"
              className="w-full btn-neo-amber py-6 text-xl group relative overflow-hidden disabled:opacity-30"
            >
              <div className="relative z-10 flex items-center justify-center gap-4">
                {loading ? (
                  <div className="w-6 h-6 border-2 border-neo-void border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                )}
                Transmit Signal
              </div>
            </button>
            <p className="text-[8px] font-mono text-neo-slate/30 text-center mt-6 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
              <Info className="w-3 h-3" />
              Signals are processed by central intelligence in chronological order
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
