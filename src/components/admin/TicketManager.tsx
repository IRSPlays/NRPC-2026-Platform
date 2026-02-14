import { useState, useEffect, useRef } from 'react';
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
  ShieldAlert, 
  Send 
} from 'lucide-react';
import { ticketsAPI, getFileUrl } from '../../lib/api';
import { Ticket } from '../../types';

export default function TicketManager() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      scrollToBottom();
    }
  }, [selectedTicket?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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

  const handleSelectTicket = async (ticket: Ticket) => {
    // When clicking a ticket, fetch fresh details including messages
    try {
      const details = await ticketsAPI.getDetails(ticket.id);
      setSelectedTicket(details);
    } catch (err) {
      console.error("Failed to load ticket details", err);
      setSelectedTicket(ticket); // Fallback
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await ticketsAPI.updateStatus(id, status);
      loadTickets(); // Refresh list
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

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    setSendingReply(true);
    try {
      const res = await ticketsAPI.reply(selectedTicket.id, replyMessage);
      
      // Refresh details to show the new message immediately
      const updated = await ticketsAPI.getDetails(selectedTicket.id);
      setSelectedTicket(updated);
      setReplyMessage('');
      
      // Update the list status if it changed (e.g. to Pending)
      if (res.newStatus) {
        setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: res.newStatus as any } : t));
      }
    } catch (err) {
      alert('Failed to transmit reply.');
    } finally {
      setSendingReply(false);
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
        <div className="lg:col-span-5 space-y-4 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-20"><Zap className="animate-spin text-neo-cyan w-8 h-8" /></div>
          ) : filteredTickets.length === 0 ? (
            <div className="neo-glass p-12 rounded-3xl text-center text-neo-slate/20 font-mono text-xs uppercase">No active signals in sector</div>
          ) : (
            filteredTickets.map(ticket => (
              <div 
                key={ticket.id}
                onClick={() => handleSelectTicket(ticket)}
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

        {/* Details & Chat Panel */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <div className="neo-glass rounded-3xl border-neo-cyan/20 p-8 space-y-6 sticky top-24 animate-fade-in flex flex-col h-[85vh]">
              {/* Ticket Header */}
              <div className="flex items-start justify-between border-b border-white/5 pb-4 shrink-0">
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

              {/* Sender Info */}
              <div className="grid md:grid-cols-2 gap-4 shrink-0">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-[8px] font-mono text-neo-slate/40 uppercase tracking-widest"><User className="w-3 h-3" /> Source Identifier</div>
                  <div className="text-sm font-bold text-white uppercase">{selectedTicket.name}</div>
                  {selectedTicket.team_name && (
                    <div className="text-[10px] font-mono text-neo-cyan uppercase mt-1">
                      Unit: {selectedTicket.team_name}
                    </div>
                  )}
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-[8px] font-mono text-neo-slate/40 uppercase tracking-widest"><Mail className="w-3 h-3" /> Comm Endpoint</div>
                  <div className="text-sm font-bold text-neo-cyan truncate">{selectedTicket.email}</div>
                </div>
              </div>

              {/* Chat History */}
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2 bg-neo-void/30 rounded-2xl p-4 border border-white/5">
                {/* Original Description */}
                <div className="flex justify-start">
                  <div className="max-w-[90%] p-4 rounded-2xl border bg-white/5 border-white/10 text-neo-slate/80 rounded-bl-none">
                    <div className="text-[8px] font-mono uppercase opacity-50 mb-1">Incoming Transmission // {new Date(selectedTicket.created_at).toLocaleTimeString()}</div>
                    <div className="text-sm whitespace-pre-wrap">{selectedTicket.description}</div>
                    {selectedTicket.file_path && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <a href={getFileUrl(selectedTicket.file_path)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-mono text-neo-cyan hover:underline">
                          <Eye className="w-3 h-3" /> View Evidence Artifact
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages */}
                {selectedTicket.messages?.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl border ${msg.sender_role === 'admin' ? 'bg-neo-cyan/10 border-neo-cyan/20 text-white rounded-br-none' : 'bg-white/5 border-white/10 text-neo-slate/80 rounded-bl-none'}`}>
                      <div className="text-[8px] font-mono uppercase opacity-50 mb-1">{msg.sender_role === 'admin' ? 'Command Response' : 'Operator Reply'} // {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      <div className="text-sm whitespace-pre-wrap">{msg.message}</div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Box */}
              <div className="shrink-0 space-y-4">
                <form onSubmit={handleReply} className="flex gap-4">
                  <input
                    type="text"
                    value={replyMessage}
                    onChange={e => setReplyMessage(e.target.value)}
                    placeholder="Transmit instructions to operator..."
                    className="flex-1 bg-neo-void/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-neo-cyan/40 outline-none transition-all"
                  />
                  <button 
                    type="submit" 
                    disabled={sendingReply || !replyMessage.trim()}
                    className="p-3 bg-neo-cyan text-neo-void rounded-xl hover:shadow-[0_0_15px_rgba(102,252,241,0.4)] transition-all disabled:opacity-50"
                  >
                    {sendingReply ? <Zap className="w-5 h-5 animate-pulse" /> : <Send className="w-5 h-5" />}
                  </button>
                </form>

                <div className="flex gap-2 justify-end">
                  {[
                    { s: 'Open', color: 'text-neo-cyan border-neo-cyan/30 hover:bg-neo-cyan/10' },
                    { s: 'Pending', color: 'text-neo-amber border-neo-amber/30 hover:bg-neo-amber/10' },
                    { s: 'Resolved', color: 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10' }
                  ].map(action => (
                    <button
                      key={action.s}
                      onClick={() => handleUpdateStatus(selectedTicket.id, action.s)}
                      disabled={selectedTicket.status === action.s}
                      className={`px-3 py-1.5 rounded-lg border text-[9px] font-mono uppercase tracking-widest transition-all ${
                        selectedTicket.status === action.s ? 'opacity-50 cursor-not-allowed bg-white/5 border-white/5 text-white' : action.color
                      }`}
                    >
                      Mark {action.s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="neo-glass rounded-3xl border-white/5 p-20 flex flex-col items-center justify-center text-center space-y-6 opacity-40 h-full">
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
