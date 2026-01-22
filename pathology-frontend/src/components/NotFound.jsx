import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, AlertTriangle } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex items-center justify-center p-8"
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}
    >
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="mb-8">
          <div
            className="w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <AlertTriangle
              size={48}
              style={{ color: 'var(--status-error)' }}
            />
          </div>
        </div>

        {/* Error Content */}
        <div className="space-y-4">
          <h1
            className="text-4xl font-black tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            404
          </h1>
          <h2
            className="text-xl font-semibold"
            style={{ color: 'var(--text-secondary)' }}
          >
            Page Not Found
          </h2>
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--text-muted)' }}
          >
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-colors"
            style={{
              backgroundColor: 'var(--button-secondary)',
              color: 'var(--text-primary)'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--button-secondary-hover)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--button-secondary)'}
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-colors"
            style={{
              backgroundColor: 'var(--accent-indigo)',
              color: 'var(--text-inverse)'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--button-primary-hover)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--accent-indigo)'}
          >
            <Home size={16} />
            Go Home
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
          <p
            className="text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
