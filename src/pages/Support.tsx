import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Send, AlertCircle, CheckCircle2, Upload, X, ShieldAlert, Zap, Radio, Info, Users, Clock, Trash2, ArrowRight } from 'lucide-react';
import { ticketsAPI } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Ticket } from '../types';

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
  
  // Local History State
  const [localTickets, setLocalTickets] = useState<number[]>([]);
  const [ticketHistory, setTicketHistory] = useState<Ticket[]>([]);
  const [viewTicket, setViewTicket] = useState<Ticket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isTeam && teamName) {
      setFormData(prev => ({ ...prev, name: teamName }));
    }
    
    // Load local history IDs
    const stored = localStorage.getItem('nrpc_tickets');
    if (stored) {
      setLocalTickets(JSON.parse(stored));
    }
  }, [isTeam, teamName]);

  // Fetch ticket details for history list (basic info only for now, real app would have batch endpoint)
  // For simplicity, we just won't show the list yet unless logged in or we build a batch endpoint.
  // Actually, we'll just let them click ID to load details if they have the ID.
  
  // Actually, let's just show the history if they have IDs.
  // We'll fetch details one by one for now (inefficient but works for small scale).
  useEffect(() => {
    const loadHistory = async () => {
      // If team, we should ideally fetch from server 'my-tickets' endpoint (not implemented yet).
      // For now, we rely on local storage + manual fetch.
      // IF we are a team, we can't see server-linked tickets unless we add that endpoint.
      // So let's stick to localStorage for now for public users.
      
      if (localTickets.length === 0) return;
      
      const loaded: Ticket[] = [];
      for (const id of localTickets) {
        try {
          const t = await ticketsAPI.getDetails(id);
          loaded.push(t);
        } catch (e) {
          // ignore error (maybe cleared cookies or server error)
        }
      }
      setTicketHistory(loaded.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    };
    
    loadHistory();
  }, [localTickets]);

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
      const res = await ticketsAPI.create({ ...formData, file: file || undefined });
      setSuccess(true);
      
      // Save to local history
      const newHistory = [res.ticketId, ...localTickets];
      setLocalTickets(newHistory);
      localStorage.setItem('nrpc_tickets', JSON.stringify(newHistory));
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || 'Transmission failed. Signal lost.');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewTicket || !replyMessage.trim()) return;
    
    try {
      await ticketsAPI.reply(viewTicket.id, replyMessage);
      const updated = await ticketsAPI.getDetails(viewTicket.id);
      setViewTicket(updated);
      setReplyMessage('');
    } catch (err) {
      alert('Failed to send reply');
    }
  };

  if (viewTicket) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 animate-fade-in">
        <button onClick={() => setViewTicket(null)} className="flex items-center gap-2 text-neo-slate/60 hover:text-white mb-6 uppercase text-xs font-mono tracking-widest">
          <ArrowRight className="w-4 h-4 rotate-180" /> Back to Signal Output
        </button>
        
        <div className="neo-glass rounded-[2rem] border-neo-cyan/20 overflow-hidden">
          <div className="bg-neo-cyan/5 p-8 border-b border-neo-cyan/10 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${URGENCY_LEVELS.find(u => u.id === viewTicket.urgency)?.color || 'border-white/10'}`}>
                  {viewTicket.urgency} Priority
                </span>
                <span className={`text-[10px] font-mono uppercase tracking-widest ${viewTicket.status === 'Open' ? 'text-neo-cyan' : 'text-neo-amber'}`}>
                  Status: {viewTicket.status}
                </span>
              </div>
              <h1 className="text-2xl font-heading font-black text-white uppercase tracking-tight">{viewTicket.category}</h1>
              <p className="text-xs font-mono text-neo-slate/40 mt-1">Ref ID: #{viewTicket.id}</p>
            </div>
          </div>
          
          <div className="p-8 space-y-8">
            <div className="p-6 rounded-2xl bg-neo-void/50 border border-white/5 space-y-2">
              <div className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest">Original Transmission</div>
              <p className="text-sm text-neo-slate/80 leading-relaxed whitespace-pre-wrap">{viewTicket.description}</p>
            </div>

            <div className="space-y-4">
              <div className="text-[10px] font-mono text-neo-cyan uppercase tracking-widest text-center">-- Secure Comm Link --</div>
              {viewTicket.messages?.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender_role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl border ${msg.sender_role === 'user' ? 'bg-neo-cyan/10 border-neo-cyan/20 text-white rounded-br-none' : 'bg-white/5 border-white/10 text-neo-slate/80 rounded-bl-none'}`}>
                    <div className="text-[8px] font-mono uppercase opacity-50 mb-1">{msg.sender_role === 'user' ? 'You' : 'NRPC Command'} // {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    <div className="text-sm">{msg.message}</div>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleReply} className="pt-4 border-t border-white/5 flex gap-4">
              <input
                type="text"
                value={replyMessage}
                onChange={e => setReplyMessage(e.target.value)}
                placeholder="Type your response..."
                className="flex-1 bg-neo-void/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-neo-cyan/40 outline-none"
              />
              <button type="submit" className="p-3 bg-neo-cyan text-neo-void rounded-xl hover:shadow-[0_0_15px_rgba(102,252,241,0.4)] transition-all">
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

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
            Check your history below for updates.
          </p>
        </div>
        <div className="flex justify-center gap-4">
          <button onClick={() => setSuccess(false)} className="btn-neo py-3 px-8">Submit Another</button>
          <button onClick={() => navigate('/')} className="text-neo-slate/40 hover:text-white uppercase font-mono text-xs tracking-widest py-3">Return Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 neo-glass rounded-[2rem] border-neo-cyan/10 overflow-hidden relative">
          <div className="scanning-line absolute w-full top-0 left-0 opacity-20"></div>
          {/* Header */}
          <div className="bg-neo-cyan/5 p-8 border-b border-neo-cyan/10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-neo-cyan/10 text-neo-cyan border border-neo-cyan/30">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-heading font-black text-white uppercase tracking-tight">Support <span className="text-neo-cyan">Uplink</span></h1>
                <div className="flex items-center gap-3 mt-1">
                  {isTeam && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-neo-cyan/20 border border-neo-cyan/30 text-[8px] font-mono text-neo-cyan font-bold uppercase tracking-widest">
                      <Users className="w-3 h-3" /> Team Authenticated
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && <div className="p-4 rounded-xl bg-neo-amber/10 border border-neo-amber/30 text-neo-amber text-xs font-bold flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> {error}</div>}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest ml-2">Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-neo-void/50 border border-white/10 rounded-xl py-3 px-4 text-white font-mono text-sm focus:border-neo-cyan/40 outline-none" placeholder="Operator Name" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest ml-2">Email</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-neo-void/50 border border-white/10 rounded-xl py-3 px-4 text-white font-mono text-sm focus:border-neo-cyan/40 outline-none" placeholder="Contact Email" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest ml-2">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat} type="button" onClick={() => setFormData({ ...formData, category: cat })} className={`py-2 px-3 rounded-lg border text-[9px] font-mono font-bold uppercase transition-all ${formData.category === cat ? 'bg-neo-cyan text-neo-void border-neo-cyan' : 'bg-white/5 border-white/10 text-neo-slate/40'}`}>{cat}</button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest ml-2">Description</label>
              <textarea required rows={4} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-neo-void/50 border border-white/10 rounded-xl py-3 px-4 text-white font-mono text-sm focus:border-neo-cyan/40 outline-none resize-none" placeholder="Describe issue..." />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest ml-2">Evidence (Optional)</label>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="block w-full text-xs text-neo-slate/40 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[10px] file:font-mono file:uppercase file:bg-white/5 file:text-white hover:file:bg-neo-cyan/10" />
            </div>

            <button disabled={loading} type="submit" className="w-full btn-neo-amber py-4 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3">
              {loading ? <div className="w-4 h-4 border-2 border-neo-void border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />} Transmit
            </button>
          </form>
        </div>

        {/* History Sidebar */}
        <div className="neo-glass rounded-[2rem] border-white/5 p-6 space-y-6 h-fit">
          <div className="flex items-center gap-2 text-white font-heading font-bold uppercase tracking-tight">
            <Clock className="w-5 h-5 text-neo-cyan" /> Transmission History
          </div>
          
          <div className="space-y-3">
            {ticketHistory.length === 0 ? (
              <div className="text-center py-8 text-neo-slate/30 font-mono text-xs uppercase tracking-widest">No previous signals</div>
            ) : (
              ticketHistory.map(ticket => (
                <div 
                  key={ticket.id}
                  onClick={() => setViewTicket(ticket)}
                  className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-neo-cyan/30 cursor-pointer transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded border ${ticket.status === 'Open' ? 'text-neo-cyan border-neo-cyan/30' : 'text-neo-amber border-neo-amber/30'}`}>{ticket.status}</span>
                    <span className="text-[8px] font-mono text-neo-slate/30">{new Date(ticket.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="text-xs font-bold text-white group-hover:text-neo-cyan transition-colors truncate">{ticket.category}</div>
                  <div className="text-[10px] text-neo-slate/50 truncate mt-1">{ticket.description}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
