import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // TODO[part-2]: forward to the error-reporting endpoint.
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--cream)]">
        <div className="max-w-md w-full text-center" style={{ animation: 'fadeUp .5s ease' }}>
          <img src="/images/logo.png" alt="SRI AADHYA FROZENS" className="h-14 w-auto mx-auto mb-5 object-contain" />
          <h1 className="display text-2xl font-extrabold">Something went wrong</h1>
          <p className="text-[var(--ink-soft)] text-sm mt-2">
            Sorry about that — reloading the page usually fixes it.
          </p>
          <button onClick={() => window.location.reload()} className="btn btn-primary w-full mt-6 py-3.5">
            <RefreshCw className="w-4 h-4" /> Reload
          </button>
        </div>
      </div>
    );
  }
}
