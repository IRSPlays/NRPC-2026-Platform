'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Download, Upload, Server, Shield, HardDrive, AlertTriangle, Database, Activity, Lock, Save } from 'lucide-react';
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
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    const saved = localStorage.getItem('nrpc_backup_config');
    if (saved) setConfig(JSON.parse(saved));
    loadBackups();
  }, []);

  const saveConfig = () => {
    localStorage.setItem('nrpc_backup_config', JSON.stringify(config));
    setMsg({ text: 'Configuration saved locally', type: 'success' });
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
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
    setMsg({ text: '', type: '' });
    try {
      await axios.post('/api/sync', config);
      setMsg({ text: 'Sync Complete: Data secured locally', type: 'success' });
      loadBackups();
    } catch (err: any) {
      setMsg({ text: 'Sync Error: ' + (err.response?.data?.error || err.message), type: 'error' });
    } finally {
      setSyncing(false);
    }
  };

  const handleRestore = async (filename: string) => {
    if (!confirm(`EMERGENCY PROTOCOL: \n\nAre you sure you want to OVERWRITE the live server with ${filename}?\n\nThis cannot be undone.`)) return;
    
    setRestoring(filename);
    setMsg({ text: '', type: '' });
    try {
      await axios.post('/api/restore', { ...config, filename });
      setMsg({ text: 'System Restored Successfully. Live server is rebooting...', type: 'success' });
    } catch (err: any) {
      setMsg({ text: 'Restore Error: ' + (err.response?.data?.error || err.message), type: 'error' });
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
    <main className="min-h-screen bg-neo-void text-neo-slate p-8 relative overflow-hidden">
      <div className="scanning-line absolute inset-0 opacity-20 pointer-events-none"></div>
      
      <div className="max-w-6xl mx-auto space-y-10 relative z-10">
        {/* Header */}
        <header className="border-b border-white/5 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-neo-cyan/10 rounded-3xl border border-neo-cyan/30 flex items-center justify-center shadow-[0_0_30px_rgba(102,252,241,0.15)]">
              <Server className="w-10 h-10 text-neo-cyan animate-pulse-slow" />
            </div>
            <div>
              <h1 className="text-4xl font-heading font-black text-white uppercase tracking-tighter">
                Command <span className="text-neo-cyan neo-text-glow">Center</span>
              </h1>
              <p className="text-xs font-mono text-neo-slate/60 uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-neo-green animate-pulse"></span>
                Off-Site Satellite Uplink // Localhost
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-neo-cyan/5 border border-neo-cyan/20 rounded-lg">
            <Activity className="w-4 h-4 text-neo-cyan" />
            <span className="text-xs font-mono font-bold text-neo-cyan uppercase tracking-widest">System Online</span>
          </div>
        </header>

        {/* Status Message */}
        {msg.text && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 font-mono text-sm uppercase tracking-wider animate-fade-in ${
            msg.type === 'error' 
              ? 'bg-neo-amber/10 border-neo-amber/30 text-neo-amber' 
              : 'bg-neo-cyan/10 border-neo-cyan/30 text-neo-cyan'
          }`}>
            {msg.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
            {msg.text}
          </div>
        )}

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <section className="lg:col-span-2 space-y-8">
            <div className="neo-glass rounded-[2rem] border-white/5 p-8 relative overflow-hidden group hover:border-neo-cyan/20 transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-neo-slate">
                  <Shield className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-heading font-bold text-white uppercase tracking-tight">Uplink Configuration</h2>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest ml-2">Server Endpoint</label>
                  <input
                    type="text"
                    value={config.url}
                    onChange={e => setConfig({ ...config, url: e.target.value })}
                    placeholder="https://www.nrpc-platform.app"
                    className="w-full bg-neo-void/50 border border-white/10 rounded-xl px-6 py-4 text-white font-mono text-sm focus:border-neo-cyan/40 outline-none transition-all"
                  />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest ml-2">Secret Key</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neo-slate/30" />
                      <input
                        type="password"
                        value={config.key}
                        onChange={e => setConfig({ ...config, key: e.target.value })}
                        placeholder="BACKUP_SECRET_KEY"
                        className="w-full bg-neo-void/50 border border-white/10 rounded-xl py-4 pl-12 pr-6 text-white font-mono text-sm focus:border-neo-cyan/40 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={saveConfig} 
                      className="w-full h-[54px] bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-mono font-bold text-white uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                    >
                      <Save className="w-4 h-4" /> Save
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Backups List */}
            <div className="neo-glass rounded-[2rem] border-white/5 overflow-hidden">
              <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <h2 className="text-sm font-mono font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2">
                  <Database className="w-4 h-4 text-neo-cyan" />
                  Local Archives
                </h2>
                <button 
                  onClick={loadBackups}
                  className="p-2 bg-white/5 rounded-lg hover:bg-neo-cyan/10 hover:text-neo-cyan transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              
              <div className="divide-y divide-white/5">
                {backups.length === 0 ? (
                  <div className="p-12 text-center text-neo-slate/30 font-mono text-xs uppercase tracking-widest">
                    No archives found on local drive
                  </div>
                ) : (
                  backups.map((backup) => (
                    <div key={backup.name} className="p-6 hover:bg-white/[0.02] transition-colors flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-neo-cyan/5 border border-neo-cyan/10 flex items-center justify-center text-neo-cyan font-mono text-xs">
                          ZIP
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white font-mono">{backup.name}</div>
                          <div className="text-[10px] font-mono text-neo-slate/40 uppercase mt-1">
                            {new Date(backup.date).toLocaleString()} • {formatSize(backup.size)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRestore(backup.name)}
                        disabled={!!restoring}
                        className="opacity-0 group-hover:opacity-100 py-2 px-4 bg-neo-amber/10 border border-neo-amber/30 text-neo-amber hover:bg-neo-amber hover:text-neo-void rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                      >
                        {restoring === backup.name ? <RefreshCw className="animate-spin w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {restoring === backup.name ? 'UPLOADING...' : 'RESTORE'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* Sync Action */}
          <section>
            <div className="neo-glass rounded-[2rem] border-neo-cyan/20 p-8 text-center relative overflow-hidden hover:shadow-[0_0_30px_rgba(102,252,241,0.1)] transition-all duration-500">
              <div className="scanning-line absolute w-full top-0 left-0 opacity-10"></div>
              
              <div className="w-24 h-24 bg-neo-cyan/10 rounded-full border border-neo-cyan/30 flex items-center justify-center mx-auto mb-8 animate-pulse-slow">
                <HardDrive className="w-10 h-10 text-neo-cyan" />
              </div>
              
              <h2 className="text-2xl font-heading font-black text-white uppercase tracking-tight mb-2">
                Sync <span className="text-neo-cyan">Protocol</span>
              </h2>
              <p className="text-xs font-mono text-neo-slate/60 mb-8 leading-relaxed">
                Initiate secure transfer of database and file artifacts from live server to local encrypted storage.
              </p>
              
              <button
                onClick={handleSync}
                disabled={syncing}
                className="w-full btn-neo py-5 flex items-center justify-center gap-3 disabled:opacity-50 text-sm"
              >
                {syncing ? <RefreshCw className="animate-spin w-5 h-5" /> : <Download className="w-5 h-5" />}
                {syncing ? 'TRANSFERRING PACKETS...' : 'INITIATE SYNC'}
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
