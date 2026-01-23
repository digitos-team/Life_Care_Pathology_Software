import React, { useState, useEffect } from 'react';
import { X, Search, User, Phone, Hash, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { getPatients } from '../../../api/receptionist/patient.api';

const PatientSelectModal = ({ isOpen, onClose, onSelect }) => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });

    useEffect(() => {
        if (isOpen) {
            fetchPatients();
        }
    }, [isOpen, pagination.page, searchTerm]);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                search: searchTerm,
                sortBy: 'lastTestResultAt', // Sort by most recent test result submission
                sortOrder: 'desc'
            };
            const response = await getPatients(params);
            setPatients(response.data || []);
            setPagination(prev => ({
                ...prev,
                total: response.total || 0,
                totalPages: response.totalPages || 0
            }));
        } catch (error) {
            console.error('Failed to fetch patients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Select Patient</h3>
                        <p className="text-slate-500 font-medium text-sm mt-1">Search and select a patient to view reports</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-slate-200/50 rounded-2xl transition-all text-slate-400 hover:text-slate-600 active:scale-90"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-8 border-b border-slate-100">
                    <div className="relative group">
                        <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name, phone, or ID..."
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                            value={searchTerm}
                            onChange={handleSearch}
                            autoFocus
                        />
                    </div>
                </div>

                {/* Patient Table */}
                <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ willChange: 'transform' }}>
                    {loading && patients.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
                            <p className="text-slate-500 font-bold">Fetching patients...</p>
                        </div>
                    ) : patients.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <User size={48} className="mb-4 opacity-20" />
                            <p className="font-bold">No patients found</p>
                        </div>
                    ) : (
                        <div className="px-4 pb-4">
                            <table className="w-full">
                                <thead className="sticky top-0 bg-white z-10">
                                    <tr className="text-left">
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Details</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Info</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {patients.map((p) => (
                                        <tr key={p._id || p.id} className="group hover:bg-indigo-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-sm">
                                                        {(p.fullName || p.name || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                                                            {p.fullName || p.name}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                                                            <Hash size={10} /> {p._id?.slice(-8).toUpperCase() || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold text-slate-600 flex items-center gap-2">
                                                        <Phone size={12} className="text-slate-400" /> {p.phone || p.mobile || 'N/A'}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-slate-400 ml-5">
                                                        {p.gender || 'N/A'} • {p.age ? `${p.age} Yrs` : 'N/A'}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => onSelect(p._id || p.id)}
                                                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 shadow-lg shadow-slate-200 hover:shadow-indigo-100 transition-all active:scale-95"
                                                >
                                                    Select
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Page {pagination.page} of {pagination.totalPages}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                disabled={pagination.page === 1 || loading}
                                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30 hover:border-indigo-500 hover:text-indigo-600 transition-all active:scale-90"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
                                disabled={pagination.page === pagination.totalPages || loading}
                                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30 hover:border-indigo-500 hover:text-indigo-600 transition-all active:scale-90"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientSelectModal;
