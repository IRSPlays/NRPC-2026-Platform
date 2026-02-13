import { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  ExternalLink, 
  Eye, 
  X, 
  Filter, 
  User, 
  Mail, 
  Activity, 
  Zap,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { ticketsAPI, getFileUrl } from '../../lib/api';
import { Ticket } from '../../types';

export default function TicketManager() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await ticketsAPI.getAll();
      setTickets(data);
    } catch (err: any) {
      setError('Signal Retrieval Failure: Central database unreachable.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await ticketsAPI.updateStatus(id, status);
      loadTickets();
      if (selectedTicket?.id === id) {
        setSelectedTicket({ ...selectedTicket, status: status as any });
      }
    } catch (err) {
      setError('Status Update Failure.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('DANGER: Terminate signal permanently?')) return;
    try {
      await ticketsAPI.delete(id);
      loadTickets();
      setSelectedTicket(null);
    } catch (err) {
      setError('Signal Termination Failure.');
    }
  };

  const filteredTickets = tickets.filter(t => 
    statusFilter === 'All' ? true : t.status === statusFilter
  );

  const getUrgencyStyle = (urgency: string) => {
    switch (urgency) {
      case 'Critical': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'High': return 'bg-neo-amber/10 text-neo-amber border-neo-amber/20';
      case 'Low': return 'bg-neo-cyan/10 text-neo-cyan border-neo-cyan/20';
      default: return 'bg-white/5 text-neo-slate/40 border-white/10';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-4xl font-heading font-black text-white uppercase tracking-tighter mb-2">Signal <span className="text-neo-cyan">Intelligence</span></h1>
          <p className="text-xs font-mono text-neo-slate/40 uppercase tracking-[0.3em]">Support Dispatch Control Center</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
            {['All', 'Open', 'Pending', 'Resolved'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest transition-all ${
                  statusFilter === status ? 'bg-neo-cyan text-neo-void shadow-[0_0_15px_rgba(102,252,241,0.3)]' : 'text-neo-slate/40 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <button 
            onClick={loadTickets}
            className="p-3 bg-white/5 rounded-xl hover:bg-neo-cyan/10 text-neo-cyan transition-all"
          >
            <Activity className={`w-5 h-5 ${loading ? 'animate-pulse' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Ticket List */}
        <div className="lg:col-span-5 space-y-4">
          {loading ? (
            <div className="flex justify-center py-20"><Zap className="animate-spin text-neo-cyan w-8 h-8" /></div>
          ) : filteredTickets.length === 0 ? (
            <div className="neo-glass p-12 rounded-3xl text-center text-neo-slate/20 font-mono text-xs uppercase">No active signals in sector</div>
          ) : (
            filteredTickets.map(ticket => (
              <div 
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={`neo-glass p-6 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${
                  selectedTicket?.id === ticket.id ? 'border-neo-cyan/40 bg-neo-cyan/5' : 'border-white/5 hover:border-white/20'
                }`}
              >
                {selectedTicket?.id === ticket.id && <div className="scanning-line absolute w-full top-0 left-0 opacity-20"></div>}
                <div className="flex items-start justify-between mb-4">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${getUrgencyStyle(ticket.urgency)}`}>
                    {ticket.urgency}
                  </span>
                  <span className={`text-[8px] font-mono uppercase tracking-widest ${
                    ticket.status === 'Open' ? 'text-neo-cyan animate-pulse' : 
                    ticket.status === 'Pending' ? 'text-neo-amber' : 'text-neo-slate/40'
                  }`}>
                    {ticket.status}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-bold text-white group-hover:text-neo-cyan transition-colors">{ticket.category}</div>
                  <div className="text-[10px] font-mono text-neo-slate/40 uppercase truncate">{ticket.name} // {ticket.email}</div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[8px] font-mono text-neo-slate/20 uppercase">{new Date(ticket.created_at).toLocaleString()}</span>
                  <ArrowRight className={`w-4 h-4 text-neo-cyan transition-transform ${selectedTicket?.id === ticket.id ? 'translate-x-1' : 'opacity-0'}`} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Details Panel */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <div className="neo-glass rounded-3xl border-neo-cyan/20 p-8 space-y-8 sticky top-24 animate-fade-in">
              <div className="flex items-start justify-between border-b border-white/5 pb-6">
                <div>
                  <h2 className="text-2xl font-heading font-black text-white uppercase tracking-tight">{selectedTicket.category}</h2>
                  <p className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest mt-1">Signal Protocol ID: #{selectedTicket.id}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleDelete(selectedTicket.id)}
                    className="p-3 bg-red-500/10 rounded-xl text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setSelectedTicket(null)}
                    className="p-3 bg-white/5 rounded-xl text-neo-slate/40 hover:text-white transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-[8px] font-mono text-neo-slate/40 uppercase tracking-widest"><User className="w-3 h-3" /> Source Identifier</div>
                  <div className="text-sm font-bold text-white uppercase">{selectedTicket.name}</div>
                  {selectedTicket.team_name && (
                    <div className="text-[10px] font-mono text-neo-cyan uppercase mt-1">
                      Unit: {selectedTicket.team_name} ({selectedTicket.school_name})
                    </div>
                  )}
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-[8px] font-mono text-neo-slate/40 uppercase tracking-widest"><Mail className="w-3 h-3" /> Comm Endpoint</div>
                  <div className="text-sm font-bold text-neo-cyan">{selectedTicket.email}</div>
                  <a href={`mailto:${selectedTicket.email}?subject=NRPC Support: ${selectedTicket.category}`} className="text-[8px] font-mono text-neo-slate/40 uppercase hover:text-white underline mt-1 block">
                    Reply via secure link
                  </a>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-[0.3em]">Signal Payload</div>
                <div className="p-6 rounded-2xl bg-neo-void/50 border border-white/5 text-neo-slate/80 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedTicket.description}
                </div>
              </div>

              {selectedTicket.file_path && (
                <div className="space-y-3">
                  <div className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-[0.3em]">Visual Evidence Artifact</div>
                  <div className="relative group rounded-2xl overflow-hidden border border-white/10 aspect-video bg-neo-void flex items-center justify-center">
                    <img 
                      src={getFileUrl(selectedTicket.file_path)} 
                      alt="Ticket Evidence" 
                      className="max-h-full w-auto object-contain"
                    />
                    <a 
                      href={getFileUrl(selectedTicket.file_path)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-neo-void/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-neo-cyan font-mono text-xs uppercase font-black"
                    >
                      <Eye className="w-5 h-5" /> Open full-res source
                    </a>
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-white/5">
                <div className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-[0.3em] mb-4">Triage Actions</div>
                <div className="flex flex-wrap gap-4">
                  {[
                    { s: 'Open', color: 'bg-neo-cyan text-neo-void', icon: MessageSquare },
                    { s: 'Pending', color: 'bg-neo-amber text-neo-void', icon: Clock },
                    { s: 'Resolved', color: 'bg-emerald-500 text-white', icon: CheckCircle2 }
                  ].map(action => (
                    <button
                      key={action.s}
                      onClick={() => handleUpdateStatus(selectedTicket.id, action.s)}
                      disabled={selectedTicket.status === action.s}
                      className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-mono text-[10px] font-black uppercase tracking-widest transition-all ${
                        selectedTicket.status === action.s ? 'opacity-20 cursor-not-allowed border border-white/10' : `${action.color} hover:scale-[1.02] shadow-lg`
                      }`}
                    >
                      <action.icon className="w-4 h-4" />
                      Set {action.s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="neo-glass rounded-3xl border-white/5 p-20 flex flex-col items-center justify-center text-center space-y-6 opacity-40 h-[600px]">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-neo-slate/20 flex items-center justify-center">
                <ShieldAlert className="w-10 h-10 text-neo-slate/20" />
              </div>
              <div>
                <h3 className="text-xl font-heading font-bold text-white uppercase">Waiting for Signal Selection</h3>
                <p className="text-xs font-mono text-neo-slate/40 mt-2">Select a dispatch from the logs to view telemetry</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
