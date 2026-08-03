'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

/**
 * ErrorBoundary — catches any render-time JS error in the subtree and
 * shows a styled fallback instead of a blank/frozen page.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomePageOrComponent />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error?.message ?? 'Unknown error' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-rose-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-heading">
              {this.props.fallbackTitle ?? 'Something went wrong'}
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              This section encountered an error and could not render. Other parts of the page are unaffected.
            </p>
            {this.state.errorMessage && (
              <p className="text-[10px] font-mono text-rose-400/70 mt-2 max-w-sm break-words">
                {this.state.errorMessage}
              </p>
            )}
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false, errorMessage: '' });
              window.location.reload();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/20 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * withErrorBoundary — HOC wrapper for quick use on page-level components.
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallbackTitle?: string
): React.ComponentType<P> {
  return function WrappedWithBoundary(props: P) {
    return (
      <ErrorBoundary fallbackTitle={fallbackTitle}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
