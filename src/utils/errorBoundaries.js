import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// ── Generic Error Boundary ────────────────────────────────
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    // In production, send to error tracking service here
    console.error('[SOC ErrorBoundary]', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const { fallback: Fallback, compact } = this.props;

    if (Fallback) return <Fallback error={this.state.error} reset={() =>
      this.setState({ hasError: false, error: null, info: null })
    } />;

    if (compact) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px',
          background: 'rgba(255,45,109,0.08)',
          border: '1px solid rgba(255,45,109,0.22)',
          borderRadius: 7, fontSize: 12.5, color: '#ff2d6d',
        }}>
          <AlertTriangle size={13} />
          Component error — {this.state.error?.message || 'Unknown error'}
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              cursor: 'pointer', color: '#ff2d6d', padding: 2,
            }}
          >
            <RefreshCw size={12} />
          </button>
        </div>
      );
    }

    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '48px 24px',
        background: 'rgba(13,21,48,0.65)',
        border: '1px solid rgba(255,45,109,0.25)', borderRadius: 12,
        textAlign: 'center', minHeight: 200,
      }}>
        <AlertTriangle size={36} color="#ff2d6d" style={{ opacity:0.7, marginBottom:14 }} />
        <div style={{ fontSize:16, fontWeight:600, color:'#e8f4ff', marginBottom:6 }}>
          Something went wrong
        </div>
        <div style={{ fontSize:12.5, color:'#6b7fa3', marginBottom:16,
          fontFamily:'JetBrains Mono,monospace', maxWidth:500 }}>
          {this.state.error?.message || 'An unexpected error occurred in this component.'}
        </div>
        <button
          onClick={() => this.setState({ hasError:false, error:null, info:null })}
          style={{
            display:'flex', alignItems:'center', gap:7,
            background:'rgba(0,229,255,0.12)',
            border:'1px solid rgba(0,229,255,0.28)',
            borderRadius:7, padding:'8px 18px',
            cursor:'pointer', color:'#00e5ff', fontSize:13,
          }}
        >
          <RefreshCw size={14} /> Try again
        </button>
      </div>
    );
  }
}

// ── HOC wrapper ───────────────────────────────────────────
export function withErrorBoundary(Component, options = {}) {
  const Wrapped = (props) => (
    <ErrorBoundary {...options}>
      <Component {...props} />
    </ErrorBoundary>
  );
  Wrapped.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return Wrapped;
}

// ── Hook: useErrorHandler ─────────────────────────────────
import { useState, useCallback } from 'react';

export function useErrorHandler() {
  const [error, setError] = useState(null);

  const handleError = useCallback((err) => {
    console.error('[SOC useErrorHandler]', err);
    setError(err);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const ErrorDisplay = error ? () => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 12px',
      background: 'rgba(255,45,109,0.08)',
      border: '1px solid rgba(255,45,109,0.22)',
      borderRadius: 7, fontSize: 12.5, color: '#ff2d6d',
    }}>
      <AlertTriangle size={13} />
      {error.message || String(error)}
      <button onClick={clearError} style={{
        marginLeft: 'auto', background: 'none', border: 'none',
        cursor: 'pointer', color: '#ff2d6d', padding: 2,
      }}>✕</button>
    </div>
  ) : () => null;

  return { error, handleError, clearError, ErrorDisplay };
}