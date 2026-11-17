import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, Phone, AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-extrabold text-slate-900">
                Localdrivers
              </h1>
              <p className="text-sm text-slate-600">
                We encountered an unexpected issue while loading the application.
              </p>
            </div>

            <div className="pt-2 space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-bold rounded-2xl transition-all shadow-md shadow-brand-500/20 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>

              <a
                href="tel:+918500274288"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-2xl border border-emerald-200 transition-colors text-sm"
              >
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>Call 24/7 Helpline: 85002 74288</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
