import React from 'react';

const Card = ({ children, title, subtitle, icon: Icon, actions, noPadding = false, className = "" }) => (
  <div
    className={`rounded-2xl shadow-sm flex flex-col overflow-hidden transition-all duration-300 ${className}`}
    style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-primary)',
      boxShadow: 'var(--shadow-sm)'
    }}
  >
    {(title || subtitle) && (
      <div
        className="px-6 py-5 flex items-center justify-between"
        style={{
          borderBottom: '1px solid var(--border-secondary)',
          backgroundColor: 'var(--bg-secondary)'
        }}
      >
        <div className="space-y-0.5">
          {title && (
            <h3
              className="text-sm font-semibold tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {title}
            </h3>
          )}
          {subtitle && (
            <p
              className="text-xs font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {actions && <div className="flex items-center">{actions}</div>}
          {Icon && (
            <div
              className="p-2.5 rounded-lg"
              style={{
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--accent-indigo)'
              }}
            >
              <Icon size={18} />
            </div>
          )}
        </div>
      </div>
    )}
    <div className={`${noPadding ? '' : 'p-6'} flex-1`}>{children}</div>
  </div>
);

export default Card;
