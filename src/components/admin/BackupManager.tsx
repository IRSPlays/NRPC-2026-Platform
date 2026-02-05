import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Download, Upload, AlertCircle, CheckCircle2, RefreshCw, History, FileArchive, HardDrive, Cpu, ShieldAlert, Zap } from 'lucide-react';
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
      setError(err.message || 'Data Retrieval Failure');
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
      setSuccess('Archive Protocol Complete: Backup Created');
      loadBackups();
    } catch (err: any) {
      setError(err.message || 'Archive Synthesis Failure');
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
      setError('Download Interrupted');
    }
  };

  const restoreBackup = async (filename: string) => {
    if (!confirm(`DANGER: Restore from ${filename}? This will OVERWRITE the active database state.`)) {
      return;
    }

    setRestoring(true);
    setError('');
    setSuccess('');

    try {
      const blob = await backupAPI.download(filename);
      const backupData = await blob.text();
      await backupAPI.restore(JSON.parse(backupData));
      setSuccess('State Restoration Successful. System Refresh Required.');
    } catch (err: any) {
      setError('Restoration Sequence Failure');
    } finally {
      setRestoring(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setError('No Archive Selected');
      return;
    }

    if (!confirm('DANGER: Restore from local file? This will OVERWRITE the active database state.')) {
      return;
    }

    setRestoring(true);
    setError('');
    setSuccess('');

    try {
      const text = await selectedFile.text();
      const backupData = JSON.parse(text);
      await backupAPI.restore(backupData);
      setSuccess('Local Archive Restored. System Refresh Required.');
      setSelectedFile(null);
    } catch (err: any) {
      setError('Invalid Archive Format');
    } finally {
      setRestoring(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-SG', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-4xl font-heading font-black text-white uppercase tracking-tighter mb-2">
            Data <span className="text-neo-amber">Archive</span>
          </h1>
          <p className="text-xs font-mono text-neo-slate/40 uppercase tracking-[0.3em]">
            System Backup & Recovery Hub // ID: ARCH-CORE
          </p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-neo-cyan/10 border border-neo-cyan/20 rounded-lg">
          <HardDrive className="w-4 h-4 text-neo-cyan" />
          <span className="text-xs font-mono font-bold text-neo-cyan uppercase tracking-widest">Storage Online</span>
        </div>
      </div>

      {error && <div className="p-4 rounded-xl bg-neo-amber/10 border border-neo-amber/30 text-neo-amber text-xs font-mono uppercase tracking-widest flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> {error}</div>}
      {success && <div className="p-4 rounded-xl bg-neo-cyan/10 border border-neo-cyan/30 text-neo-cyan text-xs font-mono uppercase tracking-widest flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {success}</div>}

      {/* Main Controls */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="neo-glass rounded-3xl border-white/5 p-8 relative overflow-hidden group hover:border-neo-cyan/30 transition-all">
          <div className="scanning-line absolute w-full top-0 left-0 opacity-10"></div>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-neo-cyan/10 rounded-xl border border-neo-cyan/30 text-neo-cyan">
              <Database className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-heading font-bold text-white uppercase tracking-tight">Generate Backup</h2>
          </div>
          <p className="text-sm text-neo-slate/50 mb-8 leading-relaxed">
            Create a comprehensive system snapshot of all units, mission logs, and analysis packages.
          </p>
          <button
            onClick={createBackup}
            disabled={creating}
            className="w-full btn-neo py-4 flex items-center justify-center gap-3 group disabled:opacity-30"
          >
            {creating ? <RefreshCw className="animate-spin w-5 h-5" /> : <Zap className="w-5 h-5 group-hover:animate-pulse" />}
            Initiate Snapshot protocol
          </button>
        </div>

        <div className="neo-glass rounded-3xl border-white/5 p-8 relative overflow-hidden group hover:border-neo-amber/30 transition-all">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-neo-amber/10 rounded-xl border border-neo-amber/30 text-neo-amber">
              <Upload className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-heading font-bold text-white uppercase tracking-tight">External Import</h2>
          </div>
          <p className="text-sm text-neo-slate/50 mb-8 leading-relaxed">
            Load local .json archive files to overwrite the current system state. Use with caution.
          </p>
          <div className="space-y-4">
            <input
              type="file"
              accept=".json"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full bg-neo-void/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-xs outline-none focus:border-neo-amber/40"
            />
            <button
              onClick={handleFileUpload}
              disabled={!selectedFile || restoring}
              className="w-full btn-neo-amber py-4 flex items-center justify-center gap-3 disabled:opacity-30"
            >
              {restoring ? <RefreshCw className="animate-spin w-5 h-5" /> : <History className="w-5 h-5" />}
              Execute State Overwrite
            </button>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="neo-glass rounded-3xl border-white/5 overflow-hidden">
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <h2 className="text-sm font-mono font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2">
            <History className="w-4 h-4 text-neo-cyan" />
            Archive Registry
          </h2>
          <button
            onClick={loadBackups}
            disabled={loading}
            className="text-[10px] font-mono text-neo-cyan hover:neo-text-glow uppercase tracking-widest flex items-center gap-2"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh Buffer
          </button>
        </div>

        {loading ? (
          <div className="p-20 flex justify-center"><RefreshCw className="animate-spin text-neo-cyan" /></div>
        ) : backups.length === 0 ? (
          <div className="p-20 text-center text-neo-slate/40 font-mono text-xs uppercase tracking-widest">Archive empty</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-8 py-4 text-left text-[10px] font-mono text-neo-slate/40 uppercase tracking-[0.2em]">Snapshot ID</th>
                  <th className="px-8 py-4 text-left text-[10px] font-mono text-neo-slate/40 uppercase tracking-[0.2em]">Timestamp / Size</th>
                  <th className="px-8 py-4 text-right text-[10px] font-mono text-neo-slate/40 uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {backups.map((backup) => (
                  <tr key={backup.name} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <FileArchive className="w-5 h-5 text-neo-cyan/40 group-hover:text-neo-cyan transition-colors" />
                        <span className="font-mono text-sm text-white">{backup.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-[10px] font-mono text-neo-slate/40 uppercase">{formatDate(backup.created)}</div>
                      <div className="text-[10px] font-mono text-neo-cyan/60">{formatSize(backup.size)}</div>
                    </td>
                    <td className="px-8 py-6 text-right space-x-2">
                      <button
                        onClick={() => downloadBackup(backup.name)}
                        className="p-3 bg-white/5 rounded-xl hover:bg-neo-cyan/10 hover:text-neo-cyan transition-all"
                        title="Download Source"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => restoreBackup(backup.name)}
                        disabled={restoring}
                        className="p-3 bg-white/5 rounded-xl hover:bg-neo-amber/10 hover:text-neo-amber transition-all"
                        title="Deploy snapshot"
                      >
                        <RefreshCw className={`w-4 h-4 ${restoring ? 'animate-spin' : ''}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Warning Protocol */}
      <div className="p-6 rounded-2xl bg-neo-amber/5 border border-neo-amber/20 flex gap-4">
        <ShieldAlert className="w-6 h-6 text-neo-amber shrink-0" />
        <div className="text-[10px] font-mono uppercase tracking-wider space-y-2">
          <span className="text-neo-amber font-bold block mb-2 underline">Caution: Archive Modification Protocols</span>
          <ul className="list-disc list-inside space-y-1 text-neo-slate/60">
            <li>State restoration is destructive and replaces the entire environment database.</li>
            <li>Snapshot includes all operating units, mission telemetry, and uplink packages.</li>
            <li>Local downloads are recommended before executing any state overwrite commands.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
