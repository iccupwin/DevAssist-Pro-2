/**
 * ErrorBoundary - Компонент для перехвата ошибок React
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="bg-red-800 text-white p-8 rounded-lg max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <div className="mb-4">
              <p className="mb-2">Error: {this.state.error?.message}</p>
              <details className="bg-red-900 p-4 rounded">
                <summary className="cursor-pointer">Error Details</summary>
                <pre className="mt-2 text-xs overflow-auto">
                  {this.state.error?.stack}
                </pre>
                <pre className="mt-2 text-xs overflow-auto">
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            </div>
            <div className="space-y-2">
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
              >
                Reload Page
              </button>
              <button 
                onClick={() => window.location.href = '/simple-admin-test'}
                className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
              >
                Go to Simple Admin Test
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;