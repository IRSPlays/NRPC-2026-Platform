'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Download, Upload, Server, Shield, HardDrive, AlertTriangle } from 'lucide-react';
import axios from 'axios';

interface Backup {
  name: string;
  size: number;
  date: string;
}

export default function Home() {
  const [config, setConfig] = useState({ url: '', key: '' });
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('nrpc_backup_config');
    if (saved) setConfig(JSON.parse(saved));
    loadBackups();
  }, []);

  const saveConfig = () => {
    localStorage.setItem('nrpc_backup_config', JSON.stringify(config));
    setMsg('Configuration saved locally');
    setTimeout(() => setMsg(''), 3000);
  };

  const loadBackups = async () => {
    try {
      const res = await axios.get('/api/backups');
      setBackups(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSync = async () => {
    if (!config.url || !config.key) return alert('Configure server first');
    setSyncing(true);
    setMsg('');
    try {
      await axios.post('/api/sync', config);
      setMsg('Sync Complete: Data secured locally');
      loadBackups();
    } catch (err: any) {
      setMsg('Sync Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setSyncing(false);
    }
  };

  const handleRestore = async (filename: string) => {
    if (!confirm(`EMERGENCY PROTOCOL: 

Are you sure you want to OVERWRITE the live server with ${filename}?

This cannot be undone.`)) return;
    
    setRestoring(filename);
    setMsg('');
    try {
      await axios.post('/api/restore', { ...config, filename });
      setMsg('System Restored Successfully. Live server is rebooting...');
    } catch (err: any) {
      setMsg('Restore Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setRestoring(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <main className="min-h-screen bg-cmd-dark text-white p-8 font-mono relative overflow-hidden">
      <div className="scanline"></div>
      
      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <header className="border-b border-cmd-gray pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-cmd-green">
              <Server className="w-8 h-8" />
              NRPC COMMAND CENTER
            </h1>
            <p className="text-xs text-gray-500 mt-2">OFF-SITE SATELLITE UPLINK // LOCALHOST</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 uppercase">System Status</div>
            <div className="text-cmd-green font-bold animate-pulse">ONLINE</div>
          </div>
        </header>

        {/* Config & Sync */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-cmd-gray/30 p-6 rounded-xl border border-cmd-gray">
            <h2 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2"><Shield className="w-4 h-4" /> UPLINK CONFIGURATION</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={config.url}
                onChange={e => setConfig({ ...config, url: e.target.value })}
                placeholder="Server URL (e.g. https://www.nrpc-platform.app)"
                className="w-full bg-black border border-cmd-gray p-3 rounded text-sm focus:border-cmd-green outline-none"
              />
              <div className="flex gap-4">
                <input
                  type="password"
                  value={config.key}
                  onChange={e => setConfig({ ...config, key: e.target.value })}
                  placeholder="BACKUP_SECRET_KEY"
                  className="flex-1 bg-black border border-cmd-gray p-3 rounded text-sm focus:border-cmd-green outline-none"
                />
                <button onClick={saveConfig} className="px-6 bg-cmd-gray hover:bg-white/10 rounded text-xs uppercase font-bold transition-colors">
                  Save
                </button>
              </div>
            </div>
          </div>

          <div className="bg-cmd-green/10 p-6 rounded-xl border border-cmd-green/30 flex flex-col justify-center items-center text-center">
            <HardDrive className="w-12 h-12 text-cmd-green mb-4" />
            <h2 className="text-xl font-bold text-cmd-green mb-2">SYNC DATA</h2>
            <p className="text-xs text-gray-400 mb-6">Download Full System Snapshot</p>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="w-full py-3 bg-cmd-green text-black font-bold rounded hover:bg-green-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {syncing ? <RefreshCw className="animate-spin w-4 h-4" /> : <Download className="w-4 h-4" />}
              {syncing ? 'DOWNLOADING...' : 'INITIATE SYNC'}
            </button>
          </div>
        </section>

        {msg && (
          <div className="p-4 bg-blue-900/20 border border-blue-500/50 text-blue-400 text-sm font-bold text-center rounded">
            {msg}
          </div>
        )}

        {/* Backups List */}
        <section className="bg-cmd-gray/20 rounded-xl border border-cmd-gray overflow-hidden">
          <div className="p-4 border-b border-cmd-gray bg-black/40 flex justify-between items-center">
            <h3 className="font-bold text-sm text-gray-400">LOCAL ARCHIVES</h3>
            <button onClick={loadBackups} className="text-xs hover:text-white text-gray-500"><RefreshCw className="w-3 h-3" /></button>
          </div>
          
          <table className="w-full text-sm">
            <thead className="bg-black/40 text-left text-gray-500 text-xs uppercase">
              <tr>
                <th className="p-4">Filename</th>
                <th className="p-4">Size</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Emergency Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cmd-gray/50">
              {backups.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-600">No local archives found.</td></tr>
              ) : (
                backups.map(backup => (
                  <tr key={backup.name} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4 font-mono text-gray-300">{backup.name}</td>
                    <td className="p-4 text-cmd-green">{formatSize(backup.size)}</td>
                    <td className="p-4 text-gray-500">{new Date(backup.date).toLocaleString()}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleRestore(backup.name)}
                        disabled={!!restoring}
                        className="py-2 px-4 bg-cmd-red/10 border border-cmd-red/30 text-cmd-red hover:bg-cmd-red hover:text-white rounded text-xs font-bold transition-all flex items-center gap-2 ml-auto"
                      >
                        {restoring === backup.name ? <RefreshCw className="animate-spin w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {restoring === backup.name ? 'UPLOADING...' : 'RESTORE TO LIVE'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
