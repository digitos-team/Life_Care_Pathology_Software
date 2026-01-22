import React from 'react';
import { AlertCircle } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error('App Crash:', error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-center">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-2xl max-w-md">
            <AlertCircle size={48} className="text-rose-500 mx-auto mb-6" />
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">System Error</h2>
            <p className="text-sm text-slate-500 my-6 leading-relaxed">A critical runtime error occurred. Please reload the interface.</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
            >
              Reload Interface
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
