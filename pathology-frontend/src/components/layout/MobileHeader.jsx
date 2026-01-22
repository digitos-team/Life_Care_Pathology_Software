import React from 'react';
import { Menu, Activity } from 'lucide-react';

const MobileHeader = ({ onMenuClick }) => {
    return (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-1.5 rounded-lg">
                    <Activity size={20} className="text-white" />
                </div>
                <span className="font-black text-lg tracking-tight text-slate-800 uppercase">
                    Digitos
                </span>
            </div>
            <button
                onClick={onMenuClick}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Toggle Menu"
            >
                <Menu size={24} />
            </button>
        </div>
    );
};

export default MobileHeader;
