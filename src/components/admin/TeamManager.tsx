import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Edit2, AlertCircle, CheckCircle2, Search, X } from 'lucide-react';
import { teamsAPI } from '../../lib/api';
import type { Team } from '../../types';

export default function TeamManager() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    team_name: '',
    school_name: '',
    category: 'Secondary' as 'Primary' | 'Secondary'
  });

  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const data = await teamsAPI.getAll();
      setTeams(data);
    } catch (err) {
      setError('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (editingId) {
        await teamsAPI.update(editingId, formData);
        setSuccess('Team unit updated!');
      } else {
        await teamsAPI.create(formData);
        setSuccess('New team unit deployed!');
      }
      setFormData({ team_name: '', school_name: '', category: 'Secondary' });
      setShowAdd(false);
      setEditingId(null);
      loadTeams();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    }
  };

  const handleEdit = (team: Team) => {
    setFormData({
      team_name: team.team_name,
      school_name: team.school_name,
      category: team.category
    });
    setEditingId(team.id);
    setShowAdd(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('DANGER: Permanently decommission this team and all their data?')) return;
    try {
      await teamsAPI.delete(id);
      loadTeams();
    } catch (err) {
      setError('Decommission failed');
    }
  };

  const filteredTeams = teams.filter(t => 
    t.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.school_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-heading font-black text-white uppercase tracking-tighter">
            Team <span className="text-neo-cyan">Database</span>
          </h1>
          <p className="text-xs font-mono text-neo-slate/40 uppercase tracking-[0.2em] mt-1">Operating Units Registry</p>
        </div>
        <button
          onClick={() => { setShowAdd(!showAdd); setEditingId(null); setFormData({ team_name: '', school_name: '', category: 'Secondary' }); }}
          className="btn-neo flex items-center gap-2"
        >
          {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAdd ? 'Cancel' : 'Register Team'}
        </button>
      </div>

      {success && <div className="p-4 rounded-xl bg-neo-cyan/10 border border-neo-cyan/30 text-neo-cyan text-xs font-mono uppercase tracking-widest flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {success}</div>}
      {error && <div className="p-4 rounded-xl bg-neo-amber/10 border border-neo-amber/30 text-neo-amber text-xs font-mono uppercase tracking-widest flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}

      {showAdd && (
        <div className="neo-glass p-8 rounded-[2rem] border-neo-cyan/20 animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest ml-4">Team Name</label>
                <input
                  required
                  type="text"
                  value={formData.team_name}
                  onChange={e => setFormData({ ...formData, team_name: e.target.value })}
                  className="w-full bg-neo-void/50 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-neo-cyan/40"
                  placeholder="Enter team name..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest ml-4">School</label>
                <input
                  required
                  type="text"
                  value={formData.school_name}
                  onChange={e => setFormData({ ...formData, school_name: e.target.value })}
                  className="w-full bg-neo-void/50 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-neo-cyan/40"
                  placeholder="Enter school name..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest ml-4">Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value as 'Primary' | 'Secondary' })}
                  className="w-full bg-neo-void/50 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-neo-cyan/40 appearance-none"
                >
                  <option value="Primary">Primary</option>
                  <option value="Secondary">Secondary</option>
                </select>
              </div>
            </div>
            <button type="submit" className="w-full btn-neo py-4">{editingId ? 'Update Registration' : 'Confirm Registration'}</button>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-neo-slate/40 group-focus-within:text-neo-cyan transition-colors" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Filter registry by name or school..."
          className="w-full bg-neo-void/50 border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white outline-none focus:border-neo-cyan/20 transition-all"
        />
      </div>

      {/* Registry Table */}
      <div className="neo-glass rounded-3xl border-white/5 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><Users className="animate-spin text-neo-cyan" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th scope="col" className="px-8 py-4 text-left text-[10px] font-mono text-neo-slate/40 uppercase tracking-[0.2em]">Unit ID</th>
                  <th scope="col" className="px-8 py-4 text-left text-[10px] font-mono text-neo-slate/40 uppercase tracking-[0.2em]">Team / School</th>
                  <th scope="col" className="px-8 py-4 text-left text-[10px] font-mono text-neo-slate/40 uppercase tracking-[0.2em]">Category</th>
                  <th scope="col" className="px-8 py-4 text-right text-[10px] font-mono text-neo-slate/40 uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTeams.map(team => (
                  <tr key={team.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6 font-mono text-xs text-neo-cyan/60">#{team.id}</td>
                    <td className="px-8 py-6">
                      <div className="text-sm font-bold text-white group-hover:text-neo-cyan transition-colors">{team.team_name}</div>
                      <div className="text-xs text-neo-slate/40">{team.school_name}</div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest ${
                        team.category === 'Primary' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        {team.category}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right space-x-2">
                      <button onClick={() => handleEdit(team)} aria-label={`Edit ${team.team_name}`} className="p-2 bg-white/5 rounded-lg hover:bg-neo-cyan/10 hover:text-neo-cyan transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(team.id)} aria-label={`Delete ${team.team_name}`} className="p-2 bg-white/5 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
