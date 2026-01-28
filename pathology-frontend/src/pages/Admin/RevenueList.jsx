import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import { DollarSign, Filter, Calendar, TrendingUp, Eye, X, FileText, User, CreditCard } from 'lucide-react';
import { getRevenueStats } from '../../api/admin/revenue.api';
import { getBillById } from '../../api/admin/billing.api';
import { useToast } from '../../contexts/ToastContext';

const BillDetailModal = ({ bill, onClose }) => {
    if (!bill) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <FileText className="text-indigo-600" size={24} />
                            Bill Details
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Invoice #{bill.billNumber}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Patient & Doctor Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-gray-900 font-semibold">
                                <User size={18} className="text-blue-600" />
                                Patient Information
                            </div>
                            <div className="text-sm space-y-1 text-gray-600 pl-6">
                                <p><span className="font-medium text-gray-700">Name:</span> {bill.patientId?.fullName || "N/A"}</p>
                                <p><span className="font-medium text-gray-700">Phone:</span> {bill.patientId?.phone || "N/A"}</p>
                                <p><span className="font-medium text-gray-700">Age/Gender:</span> {bill.patientId?.age} / {bill.patientId?.gender}</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-gray-900 font-semibold">
                                <User size={18} className="text-purple-600" />
                                Doctor Information
                            </div>
                            <div className="text-sm space-y-1 text-gray-600 pl-6">
                                <p><span className="font-medium text-gray-700">Ref. By:</span> {bill.testOrderId?.doctor?.name || "Self"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Test Items */}
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Test Items</h4>
                        <div className="border rounded-lg overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Test Name</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-500">Price</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {bill.items?.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-3 text-gray-900">{item.testName || item.name}</td>
                                            <td className="px-4 py-3 text-right text-gray-600">₹{item.price}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50 font-semibold">
                                    <tr>
                                        <td className="px-4 py-3 text-gray-900">Total Amount</td>
                                        <td className="px-4 py-3 text-right text-indigo-600">₹{bill.totalAmount}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Payment Status */}
                    <div className="flex items-center justify-between p-4 border border-green-100 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <CreditCard className="text-green-600" size={24} />
                            <div>
                                <p className="font-semibold text-green-900">Payment Status</p>
                                <p className="text-sm text-green-700 capitalize">
                                    {bill.status || "Paid"}
                                    {bill.paymentId?.paymentMethod && ` via ${bill.paymentId.paymentMethod}`}
                                </p>
                                <p className="text-xs text-green-600 mt-0.5">
                                    {new Date(bill.createdAt).toLocaleDateString()} at {new Date(bill.createdAt).toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-bold text-green-700">₹{bill.totalAmount}</span>
                            {bill.paymentId?.transactionId && (
                                <p className="text-xs text-green-600 mt-1">Txn: {bill.paymentId.transactionId}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const RevenueList = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [revenues, setRevenues] = useState([]);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalDiscount: 0,
        totalCommission: 0,
        netRevenue: 0,
        count: 0
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 0,
        totalRecords: 0,
        limit: 10
    });
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: ''
    });

    // Bill detail modal state
    const [selectedBill, setSelectedBill] = useState(null);
    const [loadingBill, setLoadingBill] = useState(false);

    // Fetch revenue list
    const fetchRevenues = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.currentPage,
                limit: pagination.limit,
                startDate: filters.startDate,
                endDate: filters.endDate
            };

            const response = await getRevenueStats(params);

            if (response && response.data) {
                setStats(response.data.stats || stats);
                setRevenues(response.data.data || []);
                setPagination(prev => ({
                    ...prev,
                    totalPages: response.data.pagination?.totalPages || 0,
                    totalRecords: response.data.pagination?.totalRecords || 0
                }));
            }
        } catch (error) {
            showToast('Failed to fetch revenue list', 'error');
            console.error('Error fetching revenues:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRevenues();
    }, [pagination.currentPage, filters]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, currentPage: newPage }));
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page
    };

    const clearFilters = () => {
        setFilters({ startDate: '', endDate: '' });
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleViewBill = async (billId) => {
        setLoadingBill(true);
        try {
            const response = await getBillById(billId);
            if (response && response.data) {
                setSelectedBill(response.data);
            }
        } catch (error) {
            showToast("Failed to fetch bill details", "error");
            console.error(error);
        } finally {
            setLoadingBill(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Revenue Records</h2>
                    <p className="text-slate-600 mt-1">Detailed list of all revenue transactions</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Gross Revenue</p>
                            <p className="text-xl font-black text-slate-800 mt-1">
                                {formatCurrency(stats.totalRevenue)}
                            </p>
                        </div>
                        <div className="p-2 bg-slate-100 rounded-lg">
                            <TrendingUp className="text-slate-600" size={18} />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Discount</p>
                            <p className="text-xl font-black text-emerald-600 mt-1">
                                {formatCurrency(stats.totalDiscount)}
                            </p>
                        </div>
                        <div className="p-2 bg-emerald-50 rounded-lg">
                            <TrendingUp className="text-emerald-600" size={18} />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Commission</p>
                            <p className="text-xl font-bold text-orange-600 mt-1">
                                {formatCurrency(stats.totalCommission)}
                            </p>
                        </div>
                        <div className="p-2 bg-orange-50 rounded-lg">
                            <DollarSign className="text-orange-600" size={18} />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Net Revenue</p>
                            <p className="text-xl font-black text-indigo-600 mt-1">
                                {formatCurrency(stats.netRevenue)}
                            </p>
                        </div>
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <TrendingUp className="text-indigo-600" size={18} />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Records</p>
                            <p className="text-xl font-black text-blue-600 mt-1">
                                {stats.count || 0}
                            </p>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Eye className="text-blue-600" size={18} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <Card title="Filters" icon={Filter}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={clearFilters}
                            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </Card>

            {/* Revenue Table */}
            <Card title="Revenue Transactions" icon={DollarSign} noPadding>
                <div className="min-h-[450px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center pt-24">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            <p className="text-gray-500 mt-2">Loading revenues...</p>
                        </div>
                    ) : revenues.length === 0 ? (
                        <div className="flex flex-col items-center justify-center pt-24 text-gray-500">
                            <DollarSign size={48} className="mb-4 opacity-50" />
                            <p>No revenue records found</p>
                            <p className="text-sm text-gray-400 mt-1">
                                Revenue records will appear here once bills are paid
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date & Time
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Bill ID
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Amount (Gross)
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Discount
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Commission
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Net Revenue
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {revenues.map((revenue) => (
                                        <tr
                                            key={revenue._id}
                                            onClick={() => revenue.billId?._id && handleViewBill(revenue.billId._id)}
                                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div>{formatDate(revenue.createdAt)}</div>
                                                <div className="text-xs text-gray-500">{formatTime(revenue.createdAt)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {revenue.billId?.billNumber || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-slate-700">
                                                {formatCurrency(revenue.totalAmount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-emerald-600">
                                                -{formatCurrency(revenue.discountAmount || 0)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-orange-600 font-bold">
                                                {formatCurrency(revenue.commissionAmount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-indigo-600">
                                                {formatCurrency(revenue.netRevenue)}
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
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                            {Math.min(pagination.currentPage * pagination.limit, pagination.totalRecords)} of{' '}
                            {pagination.totalRecords} results
                        </div>
                        <div className="flex space-x-1">
                            <button
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={pagination.currentPage === 1}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Previous
                            </button>
                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                const pageNum = i + 1;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`px-3 py-1 text-sm border rounded-md ${pagination.currentPage === pageNum
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={pagination.currentPage === pagination.totalPages}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Bill Detail Modal */}
            <BillDetailModal
                bill={selectedBill}
                onClose={() => setSelectedBill(null)}
            />
        </div>
    );
};

export default RevenueList;
