import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Download, Upload, AlertCircle, CheckCircle2, RefreshCw, History, FileArchive } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { backupAPI } from '../../lib/api';
import { BackupFile } from '../../types';

export default function BackupManager() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin/dashboard');
      return;
    }
    loadBackups();
  }, [isAdmin]);

  const loadBackups = async () => {
    setLoading(true);
    setError('');
    
    try {
      const data = await backupAPI.list();
      setBackups(data.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()));
    } catch (err: any) {
      setError(err.message || 'Failed to load backups');
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    setCreating(true);
    setError('');
    setSuccess('');
    
    try {
      await backupAPI.create();
      setSuccess('Backup created successfully');
      loadBackups();
    } catch (err: any) {
      setError(err.message || 'Failed to create backup');
    } finally {
      setCreating(false);
    }
  };

  const downloadBackup = async (filename: string) => {
    try {
      const blob = await backupAPI.download(filename);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Failed to download backup');
    }
  };

  const restoreBackup = async (filename: string) => {
    if (!confirm(`Are you sure you want to restore from ${filename}? This will replace all current data.`)) {
      return;
    }

    setRestoring(true);
    setError('');
    setSuccess('');

    try {
      // First download the backup data
      const blob = await backupAPI.download(filename);
      const backupData = await blob.text();
      
      // Then restore it
      await backupAPI.restore(JSON.parse(backupData));
      
      setSuccess('Backup restored successfully. Please refresh the page.');
    } catch (err: any) {
      setError(err.message || 'Failed to restore backup');
    } finally {
      setRestoring(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setError('Please select a backup file');
      return;
    }

    if (!confirm('Are you sure you want to restore from this file? This will replace all current data.')) {
      return;
    }

    setRestoring(true);
    setError('');
    setSuccess('');

    try {
      const text = await selectedFile.text();
      const backupData = JSON.parse(text);
      await backupAPI.restore(backupData);
      setSuccess('Backup restored successfully. Please refresh the page.');
      setSelectedFile(null);
    } catch (err: any) {
      setError(err.message || 'Failed to restore backup');
    } finally {
      setRestoring(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-SG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-heading text-slate-900 dark:text-white flex items-center gap-3">
          <Database className="w-8 h-8 text-[#0D7377]" />
          Backup Manager
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Create, download, and restore database backups
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-5 h-5" />
            <span>{success}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <FileArchive className="w-5 h-5 text-[#0D7377]" />
            Create Backup
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Create a new backup of all competition data including teams, scores, and submissions.
          </p>
          <button
            onClick={createBackup}
            disabled={creating}
            className="w-full py-3 bg-[#0D7377] text-white rounded-lg font-medium hover:bg-[#0A5A5D] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {creating ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Database className="w-5 h-5" />
                Create New Backup
              </>
            )}
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#0D7377]" />
            Upload & Restore
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Upload a backup file from your computer to restore the database.
          </p>
          <div className="space-y-3">
            <input
              type="file"
              accept=".json"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
            />
            <button
              onClick={handleFileUpload}
              disabled={!selectedFile || restoring}
              className="w-full py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {restoring ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Restore from File
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Backup List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-[#0D7377]" />
            Backup History
          </h2>
          <button
            onClick={loadBackups}
            disabled={loading}
            className="text-sm text-[#0D7377] hover:underline flex items-center gap-1"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#0D7377] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400">No backups created yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {backups.map((backup) => (
              <div 
                key={backup.name} 
                className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                    <FileArchive className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white text-sm">
                      {backup.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(backup.created)} • {formatSize(backup.size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadBackup(backup.name)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4 text-slate-500" />
                  </button>
                  <button
                    onClick={() => restoreBackup(backup.name)}
                    disabled={restoring}
                    className="p-2 hover:bg-amber-100 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                    title="Restore"
                  >
                    <RefreshCw className={`w-4 h-4 text-amber-600 ${restoring ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Warning */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-700 dark:text-amber-300">
            <p className="font-medium mb-1">Important:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Backups include all teams, scores, and submissions</li>
              <li>Restoring from a backup will replace all current data</li>
              <li>Download backups regularly to keep local copies</li>
              <li>Always create a backup before making major changes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
