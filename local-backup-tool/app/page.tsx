'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Download, Upload, Server, Shield, HardDrive, AlertTriangle, Database, Activity, Lock, Save, Key, FileArchive, FileJson, Globe } from 'lucide-react';
import axios from 'axios';

interface Backup {
  name: string;
  size: number;
  date: string;
}

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [authError, setAuthError] = useState('');
  
  const [config, setConfig] = useState({ url: '', key: '' });
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [source, setSource] = useState<'local' | 'server'>('local');

  useEffect(() => {
    const auth = sessionStorage.getItem('nrpc_local_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      loadConfig();
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadBackups();
  }, [isAuthenticated, source]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth', { code: accessCode });
      if (res.data.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem('nrpc_local_auth', 'true');
        loadConfig();
      }
    } catch (err) {
      setAuthError('Access Denied');
    }
  };

  const loadConfig = () => {
    const saved = localStorage.getItem('nrpc_backup_config');
    if (saved) setConfig(JSON.parse(saved));
  };

  const saveConfig = () => {
    localStorage.setItem('nrpc_backup_config', JSON.stringify(config));
    setMsg({ text: 'Configuration saved locally', type: 'success' });
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

  const loadBackups = async () => {
    setLoading(true);
    setMsg({ text: '', type: '' });
    try {
      let data;
      if (source === 'local') {
        console.log('Fetching local archives...');
        const res = await fetch('/api/archives', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        data = await res.json();
      } else {
        if (!config.url || !config.key) {
          throw new Error('Configure Server URL and Key for remote access');
        }
        console.log(`Fetching remote archives from ${config.url}...`);
        const res = await fetch(`${config.url}/api/admin/system/list`, {
          headers: { 'x-backup-key': config.key },
          cache: 'no-store'
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error || `HTTP ${res.status}: ${res.statusText}`);
        }
        data = await res.json();
      }

      if (Array.isArray(data)) {
        setBackups(data);
      } else {
        setBackups([]);
      }
    } catch (err: any) {
      console.error('List error:', err);
      const errorMsg = err.message || 'Unknown Network Error';
      setMsg({ text: `Listing Error (${source}): ${errorMsg}`, type: 'error' });
      setBackups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!config.url || !config.key) return alert('Configure server first');
    setSyncing(true);
    setMsg({ text: '', type: '' });
    try {
      const res = await axios.post('/api/sync', config);
      setMsg({ text: 'Sync Complete: ' + res.data.message, type: 'success' });
      loadBackups();
    } catch (err: any) {
      setMsg({ text: 'Sync Error: ' + (err.response?.data?.error || err.message), type: 'error' });
    } finally {
      setSyncing(false);
    }
  };

  const handleRestore = async (filename: string) => {
    const isZip = filename.toLowerCase().endsWith('.zip');
    const typeStr = isZip ? 'FULL SYSTEM (Database + Uploads)' : 'DATABASE ONLY (JSON)';
    
    if (!confirm(`EMERGENCY PROTOCOL: \n\nAre you sure you want to OVERWRITE the live server with ${filename}?\nType: ${typeStr}\n\nThis cannot be undone.`)) return;
    
    setRestoring(filename);
    setMsg({ text: '', type: '' });
    try {
      await axios.post('/api/restore', { ...config, filename });
      setMsg({ text: 'System Restored Successfully. Live server state updated.', type: 'success' });
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

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-neo-void flex items-center justify-center p-4 relative overflow-hidden">
        <div className="scanning-line absolute inset-0 opacity-20 pointer-events-none"></div>
        
        <div className="w-full max-w-md neo-glass rounded-[2rem] border-neo-cyan/20 p-10 relative z-10 shadow-[0_0_50px_rgba(102,252,241,0.1)]">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-neo-cyan/10 rounded-2xl border border-neo-cyan/30 flex items-center justify-center mx-auto mb-6 animate-pulse-slow">
              <Shield className="w-10 h-10 text-neo-cyan" />
            </div>
            <h1 className="text-2xl font-heading font-black text-white uppercase tracking-tight">
              Secure <span className="text-neo-cyan neo-text-glow">Gateway</span>
            </h1>
            <p className="text-[10px] font-mono text-neo-slate/60 uppercase tracking-[0.3em] mt-2">
              NRPC Command Center Access
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest ml-2">Access Code</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neo-slate/40" />
                <input 
                  type="password" 
                  value={accessCode}
                  onChange={e => setAccessCode(e.target.value)}
                  className="w-full bg-neo-void/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white font-mono text-center tracking-[0.5em] focus:border-neo-cyan/50 outline-none transition-all"
                  placeholder="••••••"
                  autoFocus
                />
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-neo-amber/10 border border-neo-amber/30 text-neo-amber text-xs font-mono text-center uppercase tracking-wider rounded-lg">
                {authError}
              </div>
            )}

            <button type="submit" className="w-full btn-neo py-4 text-sm">
              Authenticate
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neo-void text-neo-slate p-8 relative overflow-hidden">
      <div className="scanning-line absolute inset-0 opacity-20 pointer-events-none"></div>
      
      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-neo-cyan/10 rounded-2xl border border-neo-cyan/30 flex items-center justify-center">
              <Shield className="w-8 h-8 text-neo-cyan" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-black text-white uppercase tracking-tighter">
                Command <span className="text-neo-cyan neo-text-glow">Center</span>
              </h1>
              <p className="text-xs font-mono text-neo-slate/60 uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Off-Site Satellite Uplink // Localhost
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 px-4 py-2 bg-neo-cyan/5 border border-neo-cyan/20 rounded-lg">
              <Activity className="w-4 h-4 text-neo-cyan" />
              <span className="text-xs font-mono font-bold text-neo-cyan uppercase tracking-widest">System Online</span>
            </div>
            <button 
              onClick={() => { setIsAuthenticated(false); sessionStorage.removeItem('nrpc_local_auth'); }}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-mono text-neo-slate/60 hover:text-white transition-colors"
            >
              LOGOUT
            </button>
          </div>
        </header>

        {msg.text && (
          <div className={`p-4 rounded-xl font-mono text-xs uppercase tracking-widest border ${
            msg.type === 'success' ? 'bg-neo-cyan/10 border-neo-cyan/30 text-neo-cyan' : 'bg-neo-amber/10 border-neo-amber/30 text-neo-amber'
          }`}>
            {msg.text}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Config & List Section */}
          <section className="lg:col-span-2 space-y-8">
            <div className="neo-glass rounded-[2rem] border-white/5 p-8 relative overflow-hidden group">
              <div className="flex items-center gap-4 mb-8">
                <Server className="w-5 h-5 text-neo-cyan" />
                <h2 className="text-sm font-mono font-bold text-white uppercase tracking-[0.2em]">Uplink Configuration</h2>
              </div>
              
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-neo-slate/40 uppercase tracking-widest ml-2">Server Endpoint</label>
                    <div className="relative">
                      <HardDrive className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neo-slate/30" />
                      <input
                        type="text"
                        value={config.url}
                        onChange={e => setConfig({ ...config, url: e.target.value })}
                        placeholder="https://your-platform.railway.app"
                        className="w-full bg-neo-void/50 border border-white/10 rounded-xl py-4 pl-12 pr-6 text-white font-mono text-sm focus:border-neo-cyan/40 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
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
                </div>
                <button 
                  onClick={saveConfig} 
                  className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-mono font-bold text-white uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                >
                  <Save className="w-4 h-4" /> Save Local Credentials
                </button>
              </div>
            </div>

            {/* Backups List */}
            <div className="neo-glass rounded-[2rem] border-white/5 overflow-hidden">
              <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-6">
                  <h2 className="text-sm font-mono font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2">
                    <Database className="w-4 h-4 text-neo-cyan" />
                    Archive Registry
                  </h2>
                  <div className="flex bg-neo-void/50 p-1 rounded-lg border border-white/5">
                    <button 
                      onClick={() => setSource('local')}
                      className={`px-3 py-1 rounded text-[10px] font-mono uppercase tracking-widest transition-all ${
                        source === 'local' ? 'bg-neo-cyan text-neo-void font-bold shadow-[0_0_10px_rgba(102,252,241,0.3)]' : 'text-neo-slate/40 hover:text-white'
                      }`}
                    >
                      LOCAL
                    </button>
                    <button 
                      onClick={() => setSource('server')}
                      className={`px-3 py-1 rounded text-[10px] font-mono uppercase tracking-widest transition-all ${
                        source === 'server' ? 'bg-neo-cyan text-neo-void font-bold shadow-[0_0_10px_rgba(102,252,241,0.3)]' : 'text-neo-slate/40 hover:text-white'
                      }`}
                    >
                      REMOTE
                    </button>
                  </div>
                </div>
                <button 
                  onClick={loadBackups}
                  disabled={loading}
                  className="p-2 bg-white/5 rounded-lg hover:bg-neo-cyan/10 hover:text-neo-cyan transition-all disabled:opacity-30"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              <div className="divide-y divide-white/5">
                {backups.length === 0 ? (
                  <div className="p-12 text-center text-neo-slate/30 font-mono text-xs uppercase tracking-widest">
                    {loading ? 'Scanning...' : `No archives found in ${source} storage`}
                  </div>
                ) : (
                  backups.map((backup) => (
                    <div key={backup.name} className="p-6 hover:bg-white/[0.02] transition-colors flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                          backup.name.endsWith('.zip') ? 'bg-neo-cyan/5 border-neo-cyan/20 text-neo-cyan' : 'bg-neo-amber/5 border-neo-amber/20 text-neo-amber'
                        }`}>
                          {backup.name.endsWith('.zip') ? <FileArchive className="w-6 h-6" /> : <FileJson className="w-6 h-6" />}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white font-mono">{backup.name}</div>
                          <div className="text-[10px] font-mono text-neo-slate/40 uppercase mt-1">
                            {new Date(backup.date).toLocaleString('en-SG')} • {formatSize(backup.size)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {source === 'server' && (
                          <div className="px-2 py-1 bg-neo-cyan/10 border border-neo-cyan/20 rounded text-[8px] font-mono text-neo-cyan uppercase">Remote</div>
                        )}
                        <button
                          onClick={() => handleRestore(backup.name)}
                          disabled={!!restoring}
                          className="opacity-0 group-hover:opacity-100 py-2.5 px-5 bg-neo-amber/10 border border-neo-amber/30 text-neo-amber hover:bg-neo-amber hover:text-neo-void rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                        >
                          {restoring === backup.name ? <RefreshCw className="animate-spin w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          {restoring === backup.name ? 'UPLOADING...' : 'RESTORE'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* Sync Action */}
          <section className="space-y-8">
            <div className="neo-glass rounded-[2rem] border-neo-cyan/20 p-8 text-center relative overflow-hidden group">
              <div className="scanning-line absolute w-full top-0 left-0 opacity-10"></div>
              
              <div className="w-24 h-24 bg-neo-cyan/10 rounded-full border border-neo-cyan/30 flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-500">
                <HardDrive className="w-10 h-10 text-neo-cyan" />
              </div>
              
              <h2 className="text-2xl font-heading font-black text-white uppercase tracking-tight mb-2">
                Sync <span className="text-neo-cyan">Protocol</span>
              </h2>
              <p className="text-xs font-mono text-neo-slate/60 mb-8 leading-relaxed">
                Download latest system snapshot from live server. Includes database and all uploads.
              </p>
              
              <button
                onClick={handleSync}
                disabled={syncing}
                className="w-full btn-neo py-5 flex items-center justify-center gap-3 disabled:opacity-50 text-sm"
              >
                {syncing ? <RefreshCw className="animate-spin w-5 h-5" /> : <Download className="w-5 h-5" />}
                {syncing ? 'TRANSFERRING...' : 'INITIATE SYNC'}
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-neo-amber/5 border border-neo-amber/20 flex gap-4">
              <AlertTriangle className="w-6 h-6 text-neo-amber shrink-0" />
              <div className="text-[10px] font-mono uppercase tracking-wider space-y-2">
                <span className="text-neo-amber font-bold block">Caution</span>
                <p className="text-neo-slate/60 leading-relaxed">
                  Restoration protocol is destructive. Live server data will be completely replaced by the selected archive.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
