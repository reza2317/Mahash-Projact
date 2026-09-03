import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
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

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 text-center border border-rose-100 dark:border-rose-900/30">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              ⚠️
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
              خطای غیرمنتظره
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              متأسفانه خطایی در نمایش صفحه رخ داده است. نگران نباشید، اطلاعات شما پاک نشده است. لطفاً صفحه را رفرش کنید.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={this.handleReload}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors"
              >
                تلاش مجدد (رفرش صفحه)
              </button>
            </div>
            {this.state.error && (
              <div className="mt-6 text-left bg-slate-100 dark:bg-slate-900 p-3 rounded-lg overflow-auto max-h-32">
                <code className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                  {this.state.error?.message || 'Unknown Error'}
                </code>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
