import React from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { NAV_MENU } from '../../config/navMenu';

const Sidebar = ({ isOpen, onClose }) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const { user, logout } = useAuth();

  if (!user) return null;

  // Base classes for sidebar container
  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 w-72 md:w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out md:translate-x-0 md:relative md:h-screen md:shadow-none border-r
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  // Overlay for mobile
  const Overlay = () => (
    isOpen && (
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
        onClick={onClose}
      />
    )
  );

  return (
    <>
      <Overlay />
      <aside className={`${sidebarClasses} flex flex-col`}
        style={{
          backgroundColor: 'var(--bg-sidebar)',
          borderColor: 'var(--border-primary)'
        }}>
        {/* Logo Section - Fixed at top */}
        <div className="p-5 flex items-center justify-between shrink-0 border-b"
          style={{ borderColor: 'var(--border-secondary)' }}>
          <div className="flex items-center gap-4">
            <img
              src="/Life Care Logo.jpeg"
              alt="Life Care Logo"
              className="w-14 h-14 rounded-2xl object-cover shadow-xl ring-2 ring-indigo-100"
            />
            <div>
              <h2 className="font-black tracking-tight leading-none text-xl"
                style={{ color: 'var(--text-primary)' }}>
                Life Care
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-widest block mt-1"
                style={{ color: 'var(--accent-indigo)' }}>
                Pathology Lab
              </span>
            </div>
          </div>
          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="md:hidden p-2 text-slate-400 hover:text-slate-600"
          >
            <span className="sr-only">Close sidebar</span>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Menu - Scrollable, takes available space */}
        <nav className="flex-1 px-3 py-8 space-y-2 overflow-y-auto min-h-0">
          {NAV_MENU.filter(m => m.roles.includes(user.role)).map(m => (
            <NavLink
              key={m.id}
              to={m.path}
              onClick={() => onClose && window.innerWidth < 768 && onClose()}
              style={({ isActive }) => ({
                backgroundColor: isActive ? 'var(--accent-indigo)' : 'transparent',
                color: isActive ? 'var(--text-inverse)' : 'var(--text-secondary)',
                boxShadow: isActive ? 'var(--shadow-lg)' : 'none'
              })}
              className={({ isActive }) =>
                `w-full flex items-center gap-4 px-4 py-4 rounded-[1.75rem] font-black transition-all group relative ${isActive
                  ? 'scale-[1.03]'
                  : 'hover:bg-[var(--bg-hover)]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <m.icon
                    size={22}
                    style={{
                      color: isActive ? 'var(--text-inverse)' : 'var(--text-muted)'
                    }}
                    className="group-hover:text-[var(--accent-indigo)] transition-colors"
                  />
                  <span className="text-[13px] tracking-tight uppercase font-black">
                    {m.label}
                  </span>
                  {isActive && (
                    <div className="absolute right-6 w-2 h-2 bg-[var(--text-inverse)] rounded-full"></div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Theme Toggle & Logout Section - Fixed at bottom */}
        <div className="p-3 border-t space-y-3 shrink-0"
          style={{ borderColor: 'var(--border-primary)' }}>
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl font-medium text-sm transition-all hover:scale-[1.02]"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)'
            }}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl font-medium text-sm transition-all hover:scale-[1.02]"
            style={{
              backgroundColor: 'var(--button-danger)',
              color: 'var(--text-inverse)'
            }}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
