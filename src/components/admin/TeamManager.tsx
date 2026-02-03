import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Pencil, Trash2, AlertCircle, X, School, Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { teamsAPI } from '../../lib/api';
import { Team } from '../../types';

export default function TeamManager() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    team_name: '',
    school_name: '',
    category: 'Primary' as 'Primary' | 'Secondary',
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin/dashboard');
      return;
    }
    loadTeams();
  }, [isAdmin]);

  const loadTeams = async () => {
    setLoading(true);
    try {
      const data = await teamsAPI.getAll();
      setTeams(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isEditing && editId) {
        await teamsAPI.update(editId, formData);
      } else {
        await teamsAPI.create(formData);
      }
      
      setShowForm(false);
      setIsEditing(false);
      setEditId(null);
      setFormData({ team_name: '', school_name: '', category: 'Primary' });
      loadTeams();
    } catch (err: any) {
      setError(err.message || 'Failed to save team');
    }
  };

  const handleEdit = (team: Team) => {
    setFormData({
      team_name: team.team_name,
      school_name: team.school_name,
      category: team.category,
    });
    setEditId(team.id);
    setIsEditing(true);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      return;
    }
    
    try {
      await teamsAPI.delete(id);
      loadTeams();
    } catch (err: any) {
      setError(err.message || 'Failed to delete team');
    }
  };

  const resetForm = () => {
    setFormData({ team_name: '', school_name: '', category: 'Primary' });
    setIsEditing(false);
    setEditId(null);
    setShowForm(false);
    setError('');
  };

  const filteredTeams = teams.filter(team =>
    team.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.school_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-slate-900 dark:text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-[#0D7377]" />
            Team Manager
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage participating teams
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0D7377] text-white rounded-lg hover:bg-[#0A5A5D] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Team
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {isEditing ? 'Edit Team' : 'Add New Team'}
            </h2>
            <button
              onClick={resetForm}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Team Name
              </label>
              <input
                type="text"
                value={formData.team_name}
                onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                placeholder="e.g., Aquila Robotics"
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0D7377] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                School Name
              </label>
              <input
                type="text"
                value={formData.school_name}
                onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                placeholder="e.g., ACS (Barker Road)"
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0D7377] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as 'Primary' | 'Secondary' })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0D7377] focus:border-transparent"
              >
                <option value="Primary">Primary</option>
                <option value="Secondary">Secondary</option>
              </select>
            </div>
            <div className="md:col-span-3 flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-[#0D7377] text-white rounded-lg font-medium hover:bg-[#0A5A5D] transition-colors"
              >
                {isEditing ? 'Update Team' : 'Create Team'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search teams..."
          className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0D7377] focus:border-transparent"
        />
      </div>

      {/* Teams Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-[#0D7377] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              {searchTerm ? 'No teams found matching your search' : 'No teams added yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Team Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    School
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredTeams.map((team) => (
                  <tr key={team.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      #{team.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-slate-900 dark:text-white">
                        {team.team_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <School className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {team.school_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        team.category === 'Primary'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      }`}>
                        {team.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(team)}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4 text-slate-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(team.id)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="text-sm text-slate-500 dark:text-slate-400">
        Showing {filteredTeams.length} of {teams.length} teams
      </div>
    </div>
  );
}
