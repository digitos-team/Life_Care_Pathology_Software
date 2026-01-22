import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '', 
  type = 'button', 
  disabled = false, 
  loading = false 
}) => {
  const base = "px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm active:scale-95 whitespace-nowrap shadow-lg";
  
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20",
    danger: "bg-rose-500 text-white hover:bg-rose-600 shadow-rose-100",
    ghost: "text-slate-500 hover:bg-slate-100 hover:text-indigo-600",
    success: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-100"
  };

  return (
    <button 
      type={type} 
      onClick={onClick} 
      className={`${base} ${variants[variant]} ${className}`} 
      disabled={disabled || loading}
    >
      {loading ? <Loader2 className="animate-spin" size={16} /> : children}
    </button>
  );
};

export default Button;
