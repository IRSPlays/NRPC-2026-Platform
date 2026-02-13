import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-neo-void p-4">
          <div className="max-w-md w-full neo-glass rounded-[2rem] border-neo-amber/20 p-8 text-center space-y-6 relative overflow-hidden">
            <div className="scanning-line absolute w-full top-0 left-0 opacity-20"></div>
            
            <div className="w-20 h-20 rounded-full bg-neo-amber/10 flex items-center justify-center mx-auto border border-neo-amber/30">
              <AlertTriangle className="w-10 h-10 text-neo-amber" />
            </div>
            
            <div>
              <h1 className="text-2xl font-heading font-black text-white uppercase tracking-tight">System Malfunction</h1>
              <p className="text-xs font-mono text-neo-slate/60 mt-2 uppercase tracking-widest">
                Critical Render Failure Detected
              </p>
            </div>

            <div className="p-4 bg-black/30 rounded-xl border border-white/5 text-left overflow-auto max-h-40">
              <code className="text-[10px] font-mono text-red-400 break-all">
                {this.state.error?.message || 'Unknown Error'}
              </code>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="btn-neo-amber w-full py-4 flex items-center justify-center gap-3"
            >
              <RefreshCw className="w-4 h-4" /> Reboot System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
