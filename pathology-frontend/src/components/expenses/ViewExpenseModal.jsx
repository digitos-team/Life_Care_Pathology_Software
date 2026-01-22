import React, { useEffect, useState } from 'react';
import { X, Calendar, Tag, CreditCard, Info, User, Package, Hash } from 'lucide-react';
import { getExpenseById } from '../../api/admin/expenses.api';

const ViewExpenseModal = ({ expenseId, onClose }) => {
    const [expense, setExpense] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setLoading(true);
                const response = await getExpenseById(expenseId);
                setExpense(response.data || response.expense || response);
            } catch (error) {
                console.error("Failed to fetch expense details:", error);
            } finally {
                setLoading(false);
            }
        };

        if (expenseId) {
            fetchDetails();
        }
    }, [expenseId]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-lg w-full p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading details...</p>
                </div>
            </div>
        );
    }

    if (!expense) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-lg w-full p-6">
                    <div className="text-center">
                        <p className="text-red-500 font-medium">Failed to load expense details</p>
                        <button onClick={onClose} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md">Close</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <Info size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Expense Details</h3>
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">ID: {expense._id || expense.id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-2 rounded-full transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Main Info */}
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-slate-100 rounded text-slate-500 mt-1">
                                <Tag size={18} />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-semibold text-gray-400 uppercase">Title</p>
                                <p className="text-lg font-bold text-gray-900">{expense.title}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-semibold text-gray-400 uppercase">Amount</p>
                                <p className="text-xl font-black text-red-600">{formatCurrency(expense.amount)}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="text-indigo-500">
                                    <Calendar size={18} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-medium">Date</p>
                                    <p className="text-sm font-bold text-gray-800">{formatDate(expense.date)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="text-indigo-500">
                                    <CreditCard size={18} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-medium">Category</p>
                                    <p className="text-sm font-bold text-gray-800 uppercase">
                                        {expense.category?.replace('_', ' ')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lab Materials Details */}
                    {expense.category === 'LAB_MATERIALS' && (
                        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-4">
                            <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm uppercase">
                                <Package size={16} />
                                Lab Material Info
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                    <Hash size={14} className="text-indigo-400" />
                                    <span className="text-sm text-gray-600">Quantity:</span>
                                    <span className="text-sm font-bold text-gray-800">{expense.quantity} {expense.unit}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <User size={14} className="text-indigo-400" />
                                    <span className="text-sm text-gray-600">Supplier:</span>
                                    <span className="text-sm font-bold text-gray-800">{expense.supplier || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Commission Details */}
                    {expense.category === 'COMMISSION' && expense.doctor && (
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-4">
                            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm uppercase">
                                <User size={16} />
                                Commission Details
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Doctor Name:</span>
                                <span className="text-sm font-bold text-gray-800">
                                    {expense.doctor?.name || (typeof expense.doctor === 'string' ? expense.doctor : 'Doctor Not Found')}
                                </span>
                            </div>
                        </div>
                    )}


                    {/* Meta Info */}
                    <div className="pt-4 border-t border-dashed space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400 font-medium">Created At:</span>
                            <span className="text-gray-600">{formatDate(expense.createdAt)}</span>
                        </div>
                        {expense.lab && (
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-400 font-medium">Lab:</span>
                                <span className="text-gray-600">
                                    {expense.lab.labName || (typeof expense.lab === 'object' ? 'Unnamed Lab' : expense.lab)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-0">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewExpenseModal;
