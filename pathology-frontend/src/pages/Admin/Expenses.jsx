import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import { History, Edit3, Trash2, Upload, Calendar, Filter, Plus, Search, Layers, Download } from 'lucide-react';
import { getExpenses, createExpense, updateExpense, deleteExpense, createBatchExpenses, getExpenseStats, downloadExpenseReport, getExpenseById } from '../../api/admin/expenses.api';
import BatchExpenseModal from '../../components/expenses/BatchExpenseModal';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';
import EditExpenseModal from '../../components/expenses/EditExpenseModal';
import ViewExpenseModal from '../../components/expenses/ViewExpenseModal';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

const EXPENSE_CATEGORIES = [
    'LAB_MATERIALS',
    'SALARY',
    'COMMISSION',
    'UTILITY',
    'RENT',
    'MISCELLANEOUS'
];

const ExpensesSection = () => {
    const { showToast } = useToast();
    const { user } = useAuth();

    // Modal State
    // 'daily', 'monthly', or null (closed)
    const [modalMode, setModalMode] = useState(null);

    // Edit state
    const [editingExpense, setEditingExpense] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // View state
    const [viewingExpenseId, setViewingExpenseId] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);

    // Loading states
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // List state
    const [expenses, setExpenses] = useState([]);
    const [listLoading, setListLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });

    const [downloading, setDownloading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Filters
    const [activeTab, setActiveTab] = useState('other'); // 'other' or 'commission'
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        month: '',
        category: ''
    });

    // Fetch expenses
    const fetchExpenses = async () => {
        try {
            setListLoading(true);
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                category: activeTab === 'commission' ? 'COMMISSION' : filters.category,
                excludeCategory: activeTab === 'other' && !filters.category ? 'COMMISSION' : undefined,
                month: filters.month,
                search: searchQuery,
                startDate: filters.month ? '' : filters.startDate,
                endDate: filters.month ? '' : filters.endDate
            };

            const apiResponse = await getExpenses(params);
            console.log('Expenses API Response:', apiResponse);

            // Handle the nested response structure: apiResponse.data.data contains the array
            let expensesArray = [];
            let paginationData = {};

            if (apiResponse.data?.data && Array.isArray(apiResponse.data.data)) {
                // Structure: { data: { data: [], pagination: {} } }
                expensesArray = apiResponse.data.data;
                paginationData = apiResponse.data.pagination || {};
            } else if (apiResponse.data && Array.isArray(apiResponse.data)) {
                // Structure: { data: [] }
                expensesArray = apiResponse.data;
                paginationData = apiResponse.pagination || {};
            } else if (Array.isArray(apiResponse.expenses)) {
                // Structure: { expenses: [] }
                expensesArray = apiResponse.expenses;
                paginationData = apiResponse.pagination || {};
            }

            console.log('Extracted expenses:', expensesArray);
            setExpenses(expensesArray);

            setPagination(prev => ({
                ...prev,
                total: paginationData.totalRecords || apiResponse.total || 0,
                totalPages: paginationData.totalPages || apiResponse.totalPages || 0
            }));
        } catch (error) {
            showToast('Failed to fetch expenses', 'error');
            console.error('Fetch expenses error:', error);
        } finally {
            setListLoading(false);
        }
    };

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchExpenses();
    };

    // Reset pagination when tab changes
    useEffect(() => {
        setPagination(prev => ({ ...prev, page: 1 }));
        setFilters(prev => ({ ...prev, category: '' })); // Reset category filter on tab switch
    }, [activeTab]);

    const handleView = (id) => {
        setViewingExpenseId(id);
        setShowViewModal(true);
    };


    useEffect(() => {
        fetchExpenses();
    }, [pagination.page, filters, searchQuery, activeTab]);

    // Handle batch submit (from Unified Modal)
    const handleBatchSubmit = async (payload) => {
        setSubmitting(true);
        try {
            await createBatchExpenses(payload);
            showToast('Expenses added successfully', 'success');
            setModalMode(null);
            fetchExpenses(); // Refresh list
        } catch (error) {
            showToast(error.message || 'Failed to add expenses', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle edit expense
    const handleEdit = (expense) => {
        setEditingExpense(expense);
        setShowEditModal(true);
    };

    // Handle edit submit
    const handleEditSubmit = async (updatedData) => {
        setSubmitting(true);
        try {
            await updateExpense(editingExpense._id || editingExpense.id, updatedData);
            showToast('Expense updated successfully', 'success');
            setShowEditModal(false);
            setEditingExpense(null);
            fetchExpenses(); // Refresh list
        } catch (error) {
            showToast(error.message || 'Failed to update expense', 'error');
            console.error('Update expense error:', error);
        } finally {
            setSubmitting(false);
        }
    };

    // Handle delete expense
    const handleDelete = (expenseId) => {
        setDeleteConfirmId(expenseId);
    };

    const confirmDelete = async () => {
        if (!deleteConfirmId) return;
        try {
            await deleteExpense(deleteConfirmId);
            showToast('Expense deleted successfully', 'success');
            setDeleteConfirmId(null);
            fetchExpenses(); // Refresh list
        } catch (error) {
            showToast(error.message || 'Failed to delete expense', 'error');
            console.error('Delete expense error:', error);
        }
    };

    // Handle Download Report
    const handleDownloadReport = async (type) => {
        try {
            setDownloading(true);
            let params = { type };

            if (type === 'monthly') {
                if (filters.month) {
                    const [y, m] = filters.month.split('-');
                    params.year = y;
                    params.month = m;
                } else if (expenses.length > 0) {
                    // Smart Fallback: Use the date of the most recent expense
                    const latestDate = new Date(expenses[0].date);
                    params.year = latestDate.getFullYear().toString();
                    params.month = (latestDate.getMonth() + 1).toString().padStart(2, '0');
                } else {
                    const today = new Date();
                    params.year = today.getFullYear().toString();
                    params.month = (today.getMonth() + 1).toString().padStart(2, '0');
                }
            } else {
                // yearly
                if (filters.month) {
                    params.year = filters.month.split('-')[0];
                } else if (expenses.length > 0) {
                    params.year = new Date(expenses[0].date).getFullYear().toString();
                } else {
                    params.year = new Date().getFullYear().toString();
                }
            }

            const response = await downloadExpenseReport(params);

            // Generate link and trigger download immediately
            const url = window.URL.createObjectURL(new Blob([response], { type: 'application/pdf' }));

            const link = document.createElement('a');
            link.href = url;
            const fileName = `Expense_Report_${params.year}${params.month ? '_' + params.month : ''}_${type}.pdf`;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} report downloaded`, 'success');
        } catch (error) {
            showToast('Failed to download report', 'error');
            console.error('Download report error:', error);
        } finally {
            setDownloading(false);
        }
    };


    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN');
    };

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Expense Management</h2>
                    <p className="text-slate-600 mt-1">Track and manage lab expenses with detailed categorization</p>
                </div>
                {/* <div className="flex gap-3">
                    <button
                        onClick={() => setModalMode('daily')}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-medium border border-indigo-700"
                    >
                        <Plus size={16} />
                        Add Expenses
                    </button>
                </div> */}
            </div>



            {/* Unified Batch Modal */}
            {
                modalMode && (
                    <BatchExpenseModal
                        onClose={() => setModalMode(null)}
                        onSubmit={handleBatchSubmit}
                        submitting={submitting}
                        initialMode={modalMode} // Pass the default mode
                    />
                )
            }

            {/* Edit Modal */}
            {showEditModal && editingExpense && (
                <EditExpenseModal
                    expense={editingExpense}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingExpense(null);
                    }}
                    onSubmit={handleEditSubmit}
                    submitting={submitting}
                />
            )}

            {/* View Modal */}
            {showViewModal && viewingExpenseId && (
                <ViewExpenseModal
                    expenseId={viewingExpenseId}
                    onClose={() => {
                        setShowViewModal(false);
                        setViewingExpenseId(null);
                    }}
                />
            )}

            {/* Filters */}
            <Card title="Filters" icon={Filter}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Month</label>
                        <input
                            type="month"
                            value={filters.month}
                            onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value, startDate: '', endDate: '' }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value, month: '' }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={!!filters.month}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value, month: '' }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={!!filters.month}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                            value={filters.category}
                            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={activeTab === 'commission'}
                        >
                            <option value="">All Categories</option>
                            {EXPENSE_CATEGORIES
                                .filter(c => activeTab === 'other' ? c !== 'COMMISSION' : c === 'COMMISSION')
                                .map(category => (
                                    <option key={category} value={category}>
                                        {category.replace('_', ' ')}
                                    </option>
                                ))}
                        </select>
                    </div>
                    <div className="md:col-span-4 flex items-end justify-between gap-3">
                        <button
                            onClick={() => setFilters({ startDate: '', endDate: '', category: '', month: '' })}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                        >
                            Clear Filters
                        </button>
                        <button
                            onClick={() => setModalMode('daily')}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-medium border border-indigo-700"
                        >
                            <Plus size={16} />
                            Add Expenses
                        </button>
                    </div>
                </div>
            </Card>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('other')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                            ${activeTab === 'other'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                    >
                        Other Expenses
                    </button>
                    <button
                        onClick={() => setActiveTab('commission')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                            ${activeTab === 'commission'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                    >
                        Doctor Commissions
                    </button>
                </nav>
            </div>




            {/* Expenses Table */}
            <Card
                title={activeTab === 'commission' ? "Doctor Commissions" : "Expenses List"}
                icon={activeTab === 'commission' ? Layers : History}
                noPadding
                actions={
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search pattern..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 w-48 sm:w-64 outline-none text-sm bg-white"
                        />
                        <Search className="absolute left-3 top-2 text-slate-400" size={14} />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-2 text-slate-400 hover:text-slate-600"
                            >
                                <Plus size={14} className="rotate-45" />
                            </button>
                        )}
                    </div>
                }
            >
                <div className="min-h-[450px]">
                    {listLoading ? (
                        <div className="flex flex-col items-center justify-center pt-24">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            <p className="text-gray-500 mt-2">Loading expenses...</p>
                        </div>
                    ) : expenses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center pt-24 text-gray-500">
                            <History size={48} className="mb-4 opacity-50" />
                            <p>No expenses found</p>
                            <p className="text-sm text-gray-400 mt-1">
                                Add your first expense to get started
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Title
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Details
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {expenses.map((expense) => (
                                        <tr key={expense._id || expense.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(expense.date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                <button
                                                    onClick={() => handleView(expense._id || expense.id)}
                                                    className="hover:text-indigo-600 hover:underline"
                                                >
                                                    {expense.title}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                                    {expense.category.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {expense.category === 'LAB_MATERIALS' ? (
                                                    <div className="text-xs">
                                                        <div>Qty: {expense.quantity} {expense.unit}</div>
                                                        <div>Supplier: {expense.supplier}</div>
                                                    </div>
                                                ) : expense.category === 'COMMISSION' && expense.doctor ? (
                                                    <div className="text-xs">
                                                        <div className="text-emerald-600 font-medium">
                                                            Doctor: {expense.doctor?.name || (typeof expense.doctor === 'string' ? expense.doctor.substring(0, 8) + '...' : 'Unknown')}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-red-600">
                                                {formatCurrency(expense.amount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    {expense.category !== 'COMMISSION' && (
                                                        <button
                                                            onClick={() => handleEdit(expense)}
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                        >
                                                            <Edit3 size={16} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(expense._id || expense.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination & Bottom Actions */}
                <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 min-h-[72px]">
                    <div className="flex-grow">
                        {pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between w-full">
                                <div className="text-sm text-gray-700">
                                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                                    {pagination.total} results
                                </div>
                                <div className="flex space-x-1 ml-4">
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                        disabled={pagination.page === 1}
                                        className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                    >
                                        Previous
                                    </button>
                                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                        const pageNum = i + 1;
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                                                className={`px-3 py-1 text-sm border rounded-md ${pagination.page === pageNum
                                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                                    : 'border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                        disabled={pagination.page === pagination.totalPages}
                                        className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="w-full sm:w-auto flex flex-wrap gap-2">
                        <button
                            onClick={() => handleDownloadReport('monthly')}
                            disabled={downloading}
                            className="flex-1 sm:flex-none bg-white text-emerald-600 border border-emerald-200 px-4 py-2 rounded-lg hover:bg-emerald-50 flex items-center justify-center gap-2 font-medium text-sm disabled:opacity-50 border"
                        >
                            {downloading ? (
                                <div className="animate-spin h-3.5 w-3.5 border-2 border-emerald-600 border-t-transparent rounded-full"></div>
                            ) : (
                                <Calendar size={14} />
                            )}
                            Monthly Report
                        </button>
                        <button
                            onClick={() => handleDownloadReport('yearly')}
                            disabled={downloading}
                            className="flex-1 sm:flex-none bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2 font-medium text-sm disabled:opacity-50 border border-emerald-700"
                        >
                            {downloading ? (
                                <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></div>
                            ) : (
                                <Download size={14} />
                            )}
                            Yearly Report
                        </button>
                    </div>
                </div>
            </Card>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={!!deleteConfirmId}
                onClose={() => setDeleteConfirmId(null)}
                onConfirm={confirmDelete}
                title="Delete Expense?"
                message="Are you sure you want to delete this expense? This action cannot be undone."
            />
        </div>
    );
};

export default ExpensesSection;
