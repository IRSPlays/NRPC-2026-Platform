import { useState, useEffect } from 'react';
import { Plus, Trash2, Pin, PinOff, AlertCircle, CheckCircle2, Clock, X } from 'lucide-react';
import { announcementsAPI } from '../../lib/api';
import type { Announcement } from '../../types';

export default function AnnouncementsManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    is_pinned: false,
    expires_at: ''
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await announcementsAPI.getAll();
      setAnnouncements(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await announcementsAPI.create(formData);
      setSuccess('Announcement broadcasted!');
      setFormData({ title: '', content: '', priority: 'medium', is_pinned: false, expires_at: '' });
      setShowAdd(false);
      loadAnnouncements();
    } catch (err: any) {
      setError(err.message || 'Failed to post announcement');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Permanently delete this announcement?')) return;
    try {
      await announcementsAPI.delete(id);
      loadAnnouncements();
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
    }
  };

  const handleTogglePin = async (id: number) => {
    try {
      await announcementsAPI.togglePin(id);
      loadAnnouncements();
    } catch (err: any) {
      setError(err.message || 'Failed to toggle pin');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-heading font-black text-white uppercase tracking-tighter">
            Broadcast <span className="text-neo-cyan">Manager</span>
          </h1>
          <p className="text-xs font-mono text-neo-slate/40 uppercase tracking-[0.2em] mt-1">Global Messaging System</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="btn-neo flex items-center gap-2"
        >
          {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAdd ? 'Close' : 'New Broadcast'}
        </button>
      </div>

      {success && <div className="p-4 rounded-xl bg-neo-cyan/10 border border-neo-cyan/30 text-neo-cyan text-xs font-mono uppercase tracking-widest flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {success}</div>}
      {error && <div className="p-4 rounded-xl bg-neo-amber/10 border border-neo-amber/30 text-neo-amber text-xs font-mono uppercase tracking-widest flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}

      {showAdd && (
        <div className="neo-glass p-8 rounded-[2rem] border-neo-cyan/20 animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest ml-4">Title</label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-neo-void/50 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-neo-cyan/40"
                  placeholder="Enter broadcast title..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest ml-4">Priority</label>
                <select
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                  className="w-full bg-neo-void/50 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-neo-cyan/40 appearance-none"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest ml-4">Content</label>
              <textarea
                required
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                rows={4}
                className="w-full bg-neo-void/50 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-neo-cyan/40 resize-none"
                placeholder="Message body..."
              />
            </div>
            <div className="flex items-center gap-4">
               <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-neo-cyan/20 transition-all">
                <input
                  type="checkbox"
                  checked={formData.is_pinned}
                  onChange={e => setFormData({ ...formData, is_pinned: e.target.checked })}
                  className="w-5 h-5 rounded border-white/10 text-neo-cyan bg-neo-void focus:ring-neo-cyan"
                />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-widest">Pin to Top</span>
              </label>
              <button type="submit" className="flex-1 btn-neo-amber py-4">Publish Broadcast</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-6">
        {loading ? (
          <div className="flex justify-center py-20"><Clock className="animate-spin text-neo-cyan" /></div>
        ) : announcements.length === 0 ? (
          <div className="neo-glass p-20 rounded-[2rem] text-center text-neo-slate/40 font-mono text-sm uppercase tracking-widest">No active broadcasts</div>
        ) : (
          announcements.map(ann => (
            <div key={ann.id} className="neo-glass p-8 rounded-3xl border-white/5 flex items-start justify-between group hover:border-neo-cyan/20 transition-all">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {ann.is_pinned && <Pin className="w-4 h-4 text-neo-cyan fill-neo-cyan" />}
                  <span className={`text-[10px] font-mono px-3 py-1 rounded-full uppercase tracking-widest ${
                    ann.priority === 'high' ? 'bg-neo-amber/10 text-neo-amber border border-neo-amber/20' : 
                    ann.priority === 'medium' ? 'bg-neo-cyan/10 text-neo-cyan border border-neo-cyan/20' : 'bg-white/5 text-neo-slate/40 border border-white/10'
                  }`}>
                    {ann.priority} priority
                  </span>
                  <span className="text-[10px] font-mono text-neo-slate/30 uppercase tracking-tighter">
                    {new Date(ann.created_at).toLocaleString()}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-neo-cyan transition-colors">{ann.title}</h3>
                  <p className="text-neo-slate/60 text-sm mt-2 whitespace-pre-wrap">{ann.content}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => handleTogglePin(ann.id)} className="p-3 bg-white/5 rounded-xl hover:bg-neo-cyan/10 hover:text-neo-cyan transition-all">
                  {ann.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                </button>
                <button onClick={() => handleDelete(ann.id)} className="p-3 bg-white/5 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
