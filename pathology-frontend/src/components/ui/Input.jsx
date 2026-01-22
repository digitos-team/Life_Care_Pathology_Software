import React from 'react';

const Input = ({ label, icon: Icon, error, ...props }) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && (
      <label
        className="text-[10px] font-black uppercase tracking-widest ml-1"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </label>
    )}
    <div className="relative group">
      {Icon && (
        <Icon
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300"
          style={{
            color: error ? 'var(--status-error)' : 'var(--text-placeholder)'
          }}
        />
      )}
      <input
        className={`w-full ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-3 rounded-2xl outline-none transition-all duration-300 text-sm font-semibold ${error ? '' : ''}`}
        style={{
          backgroundColor: 'var(--input-bg)',
          border: `1px solid ${error ? 'var(--status-error)' : 'var(--input-border)'}`,
          color: 'var(--input-text)'
        }}
        {...props}
      />
    </div>
    {error && (
      <span
        className="text-[9px] font-bold ml-1 uppercase tracking-tighter"
        style={{ color: 'var(--status-error)' }}
      >
        {error}
      </span>
    )}
  </div>
);

export default Input;
