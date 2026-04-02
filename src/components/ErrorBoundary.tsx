import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

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
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-[32px] p-10 text-center backdrop-blur-xl shadow-2xl">
            <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
            <p className="text-white/50 mb-10 leading-relaxed">
              We encountered an unexpected error. This might be due to a connection issue or a temporary glitch.
            </p>
            
            {this.state.error && (
              <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-left overflow-hidden">
                <p className="text-xs font-mono text-red-400 break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-white/90 transition-all flex items-center justify-center gap-2 group"
              >
                <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                Reload Page
              </button>
              <Link
                to="/"
                className="w-full py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
