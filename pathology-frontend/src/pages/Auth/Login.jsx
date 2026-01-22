
import React, { useState } from 'react';
import { Stethoscope, ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';
import Input from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: '', pass: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Updated styling constants to match the design system
  const styles = {
    background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
    overlay1: 'radial-gradient(circle at 30% 40%, rgba(99,102,241,0.1), transparent 50%)',
    overlay2: 'radial-gradient(circle at 70% 60%, rgba(168,85,247,0.1), transparent 50%)',
    card: {
      backgroundColor: 'var(--bg-modal)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: 'var(--shadow-xl)'
    },
    iconBg: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-purple))',
    button: {
      backgroundColor: 'var(--accent-indigo)',
      color: 'var(--text-inverse)'
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(credentials.email, credentials.pass);
      if (result.success && result.user) {
        // Navigate based on role: Admin to admin dashboard, Operator to receptionist dashboard
        const destination = result.user.role === 'Admin' ? '/dashboard' : '/receptionist-dashboard';
        navigate(destination);
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden" style={{ background: styles.background }}>
      <div className="absolute inset-0 opacity-50" style={{ background: styles.overlay1 }}></div>
      <div className="absolute inset-0 opacity-30" style={{ background: styles.overlay2 }}></div>

      <div className="relative p-10 rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-1000" style={styles.card}>
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl" style={{ background: styles.iconBg, color: 'var(--text-inverse)' }}>
            <Stethoscope size={40} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Welcome Back
          </h1>
          <p className="text-base mt-3 font-medium" style={{ color: 'var(--text-secondary)' }}>
            Sign in to DIGITOS Pathology Lab
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          <Input
            label="Email Address"
            type="email"
            icon={ShieldCheck}
            placeholder="Enter your email"
            value={credentials.email}
            onChange={e => setCredentials({ ...credentials, email: e.target.value })}
          />
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              icon={Lock}
              placeholder="Enter your password"
              value={credentials.pass}
              onChange={e => setCredentials({ ...credentials, pass: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 p-1 rounded-md transition-colors hover:bg-gray-100"
              style={{ color: 'var(--text-secondary)' }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-base transition-colors shadow-sm ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            style={styles.button}
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
