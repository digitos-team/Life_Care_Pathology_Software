import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import { TrendingUp, Calendar, DollarSign, Filter, Download, ChevronDown, ChevronUp, IndianRupee, Stethoscope } from 'lucide-react';
import { getRevenueStats, getRevenueAnalytics, deleteRevenue } from '../../api/admin/revenue.api';
import { getBillById, deleteBill } from '../../api/admin/billing.api';
import { useToast } from '../../contexts/ToastContext';
import { X, FileText, User, CreditCard, Trash2, Banknote } from 'lucide-react';

const BillListModal = ({ date, bills, onClose, pagination, onPageChange, isLoading, onBillDeleted }) => {
    const { showToast } = useToast();
    const [expandedBillId, setExpandedBillId] = useState(null);
    const [billDetailsCache, setBillDetailsCache] = useState({});
    const [detailsLoading, setDetailsLoading] = useState(false);

    const toggleExpand = async (billId) => {
        if (expandedBillId === billId) {
            setExpandedBillId(null);
            return;
        }

        setExpandedBillId(billId);

        if (!billDetailsCache[billId]) {
            setDetailsLoading(true);
            try {
                const response = await getBillById(billId);
                if (response && response.data) {
                    setBillDetailsCache(prev => ({ ...prev, [billId]: response.data }));
                }
            } catch (error) {
                showToast("Failed to fetch bill details", "error");
            } finally {
                setDetailsLoading(false);
            }
        }
    };

    const handleDeleteBill = async (e, billId) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this BILL? This will also remove the associated revenue record.")) {
            try {
                await deleteBill(billId);
                showToast("Bill deleted successfully", "success");
                if (onBillDeleted) onBillDeleted();
            } catch (error) {
                showToast("Failed to delete bill", "error");
            }
        }
    };

    const handleDeleteRevenue = async (e, revenueId) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this REVENUE record? The bill will remain but financial data will be removed.")) {
            try {
                await deleteRevenue(revenueId);
                showToast("Revenue record deleted successfully", "success");
                if (onBillDeleted) onBillDeleted();
            } catch (error) {
                showToast("Failed to delete revenue", "error");
            }
        }
    };

    if (!bills && !isLoading) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-hidden">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Bills for {date}</h3>
                        <p className="text-sm font-medium text-slate-500 mt-0.5">
                            Showing {bills?.length || 0} of {pagination?.totalRecords || 0} bills
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all group">
                        <X size={20} className="text-slate-400 group-hover:text-slate-600" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 flex-1 space-y-4 bg-slate-50/30">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                            <p className="mt-4 text-slate-500 font-medium tracking-tight">Loading bills...</p>
                        </div>
                    ) : (
                        bills.map((item, index) => {
                            const bill = item.billId || item;
                            const isExpanded = expandedBillId === bill._id;
                            const detail = billDetailsCache[bill._id];

                            return (
                                <div key={bill._id || index} className="flex flex-col gap-2">
                                    <div
                                        onClick={() => toggleExpand(bill._id)}
                                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group ${isExpanded
                                            ? 'bg-white border-indigo-500 ring-4 ring-indigo-500/5 shadow-lg'
                                            : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-md'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black ${bill.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                                }`}>
                                                ₹
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-800 tracking-tight">{bill.billNumber}</span>
                                                    {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                                                </div>
                                                <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                                                    <User size={14} className="opacity-70" />
                                                    {bill.patientId?.fullName || "Unknown Patient"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                                            <div className="flex flex-col md:items-end">
                                                <span className="text-2xl font-black text-slate-800">₹{bill.totalAmount || bill.amount}</span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${bill.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {bill.status || 'PAID'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => handleDeleteRevenue(e, item._id)}
                                                    className="px-3 py-2 text-orange-600 bg-orange-100/50 hover:bg-orange-100 rounded-xl transition-all flex items-center gap-2 text-sm font-bold"
                                                    title="Delete Revenue Entry"
                                                >
                                                    <Banknote size={16} />
                                                    DELETE REVENUE
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteBill(e, bill._id)}
                                                    className="px-3 py-2 text-red-600 bg-red-100/50 hover:bg-red-100 rounded-xl transition-all flex items-center gap-2 text-sm font-bold"
                                                    title="Delete Bill & Revenue"
                                                >
                                                    <Trash2 size={16} />
                                                    DELETE BILL
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Inline Detail Section */}
                                    {isExpanded && (
                                        <div className="bg-white border border-indigo-100 rounded-2xl shadow-inner-lg p-6 animate-in slide-in-from-top-2 duration-300">
                                            {detailsLoading && !detail ? (
                                                <div className="flex items-center justify-center py-10">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                                </div>
                                            ) : detail ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                                    {/* Column 1: Patient & Doctor */}
                                                    <div className="space-y-6">
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                                <User size={14} />
                                                                Patient Info
                                                            </div>
                                                            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                                                                <p className="font-bold text-slate-800">{detail.patientId?.fullName}</p>
                                                                <div className="mt-2 space-y-1">
                                                                    <p className="text-xs font-semibold text-slate-600">
                                                                        {detail.patientId?.age}Y / {detail.patientId?.gender}
                                                                    </p>
                                                                    <p className="text-xs font-semibold text-slate-500">
                                                                        {detail.patientId?.phone || 'No Phone recorded'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                                <Stethoscope size={14} />
                                                                Referred By
                                                            </div>
                                                            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                                                                    <Stethoscope size={18} />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-slate-700">
                                                                        {detail.testOrderId?.doctor?.name || detail.testOrderId?.doctorName || 'Self / Walk-in'}
                                                                    </p>
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Recorded Doctor</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Column 2 & 3: Bill Items and Summary */}
                                                    <div className="md:col-span-1 lg:col-span-2 space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                                <FileText size={14} />
                                                                Bill Items
                                                            </div>
                                                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                                {detail.items?.length || 0} Items
                                                            </span>
                                                        </div>
                                                        <div className="bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden">
                                                            <div className="p-3 bg-white border-b border-slate-100 grid grid-cols-12 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                                <div className="col-span-9">Test / Product Name</div>
                                                                <div className="col-span-3 text-right">Price</div>
                                                            </div>
                                                            <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                                                                {detail.items?.map((item, idx) => (
                                                                    <div key={idx} className="p-3 grid grid-cols-12 items-center hover:bg-white transition-colors">
                                                                        <div className="col-span-9">
                                                                            <p className="text-sm font-bold text-slate-700">{item.name}</p>
                                                                        </div>
                                                                        <div className="col-span-3 text-right">
                                                                            <p className="text-sm font-black text-slate-800">₹{item.price}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="p-4 bg-white border-t border-slate-200 space-y-2">
                                                                <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                                                                    <span className="uppercase tracking-widest">Subtotal</span>
                                                                    <span className="text-slate-600 font-black">₹{(detail.totalAmount + (detail.discountAmount || 0)).toLocaleString()}</span>
                                                                </div>
                                                                {detail.discountAmount > 0 && (
                                                                    <div className="flex justify-between items-center text-xs font-bold text-emerald-600">
                                                                        <span className="uppercase tracking-widest">Discount</span>
                                                                        <span className="font-black">- ₹{detail.discountAmount.toLocaleString()}</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex justify-between items-center py-2 border-y border-slate-100/50">
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Doc Commission</span>
                                                                    <span className="text-sm font-black text-slate-600 italic">
                                                                        ₹{detail.commissionAmount || 0}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between items-center pt-2">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Net Amount</span>
                                                                        {detail.status === 'PAID' && detail.paymentId?.paymentMethod && (
                                                                            <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-tighter">
                                                                                Paid via {detail.paymentId.paymentMethod}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-2xl font-black text-indigo-600 flex items-center gap-1">
                                                                        <IndianRupee size={20} strokeWidth={3} />
                                                                        {detail.totalAmount.toLocaleString()}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-center text-slate-500">Failed to load details.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                        <button
                            disabled={pagination.currentPage === 1 || isLoading}
                            onClick={() => onPageChange(pagination.currentPage - 1)}
                            className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-sm font-bold text-slate-500">
                            Page {pagination.currentPage} of {pagination.totalPages}
                        </span>
                        <button
                            disabled={pagination.currentPage === pagination.totalPages || isLoading}
                            onClick={() => onPageChange(pagination.currentPage + 1)}
                            className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const Revenue = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('monthly'); // 'monthly' or 'daily'
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalDiscount: 0,
        totalCommission: 0,
        netRevenue: 0
    });
    const [revenueData, setRevenueData] = useState([]);

    // Modal states
    const [selectedDateBills, setSelectedDateBills] = useState([]);
    const [selectedDateLabel, setSelectedDateLabel] = useState("");
    const [openListModal, setOpenListModal] = useState(false);

    // Pagination state for modal
    const [listLoading, setListLoading] = useState(false);
    const [listPagination, setListPagination] = useState({ currentPage: 1, totalPages: 1 });
    const [currentSelectedDate, setCurrentSelectedDate] = useState(null); // format: YYYY-MM-DD

    // Fetch revenue stats
    const fetchStats = async () => {
        try {
            const response = await getRevenueStats();
            if (response && response.data && response.data.stats) {
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error('Error fetching revenue stats:', error);
        }
    };

    // Fetch revenue data based on view mode
    const fetchRevenueData = async () => {
        setLoading(true);
        try {
            const response = await getRevenueAnalytics(selectedYear, viewMode === 'daily' ? selectedMonth : undefined);

            if (response && response.data) {
                // The new analytics API returns { yearlyTotal, monthly, daily }
                // Select the appropriate array based on viewMode
                const data = viewMode === 'monthly' ? response.data.monthly : response.data.daily;
                setRevenueData(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            showToast('Failed to fetch revenue data', 'error');
            console.error('Error fetching revenue data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchRevenueData();
    }, [viewMode, selectedYear, selectedMonth]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount || 0);
    };

    const getMonthName = (monthNum) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[monthNum - 1] || '';
    };

    const fetchDailyBills = async (dateStr, page = 1) => {
        setListLoading(true);
        try {
            // dateStr is YYYY-MM-DD
            const response = await getRevenueStats({
                startDate: dateStr,
                endDate: dateStr,
                page,
                limit: 10
            });

            if (response && response.data && response.data.data) {
                // response.data.data is the array of revenues with populated billId
                setSelectedDateBills(response.data.data || []);
                setListPagination({
                    currentPage: response.data.pagination?.currentPage || 1,
                    totalPages: response.data.pagination?.totalPages || 1,
                    totalRecords: response.data.pagination?.totalRecords || 0
                });
            }
        } catch (error) {
            showToast("Failed to fetch bills", "error");
            console.error(error);
        } finally {
            setListLoading(false);
        }
    };

    const handleRowClick = (item) => {
        if (viewMode === 'daily') {
            const dateStr = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
            const label = `${item._id.day}/${item._id.month}/${item._id.year}`;

            setSelectedDateLabel(label);
            setCurrentSelectedDate(dateStr);
            setOpenListModal(true);

            // Allow state to update first, but here we can just pass dateStr directly
            fetchDailyBills(dateStr, 1);
        }
    };

    const handlePageChange = (newPage) => {
        if (currentSelectedDate) {
            fetchDailyBills(currentSelectedDate, newPage);
        }
    };



    const handleBillDeleted = () => {
        // Refresh both lists if a bill is deleted
        fetchStats();
        fetchRevenueData();
        if (currentSelectedDate) {
            fetchDailyBills(currentSelectedDate, listPagination.currentPage);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Revenue Management</h2>
                    <p className="text-slate-600 mt-1">Track and analyze laboratory revenue</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Total Revenue (Gross)</p>
                            <p className="text-2xl font-bold text-slate-800 mt-1">
                                {formatCurrency(stats.totalRevenue)}
                            </p>
                        </div>
                        <div className="p-3 bg-slate-100 rounded-lg">
                            <TrendingUp className="text-slate-600" size={24} />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Total Discount</p>
                            <p className="text-2xl font-bold text-emerald-600 mt-1">
                                {formatCurrency(stats.totalDiscount)}
                            </p>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-lg">
                            <TrendingUp className="text-emerald-600" size={24} />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Total Commission</p>
                            <p className="text-2xl font-bold text-orange-600 mt-1">
                                {formatCurrency(stats.totalCommission)}
                            </p>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-lg">
                            <DollarSign className="text-orange-600" size={24} />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Net Revenue</p>
                            <p className="text-2xl font-bold text-indigo-600 mt-1">
                                {formatCurrency(stats.netRevenue)}
                            </p>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-lg">
                            <TrendingUp className="text-indigo-600" size={24} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <Card title="Filters" icon={Filter}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">View Mode</label>
                        <select
                            value={viewMode}
                            onChange={(e) => setViewMode(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="monthly">Monthly</option>
                            <option value="daily">Daily</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                    {viewMode === 'daily' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                    <option key={month} value={month}>{getMonthName(month)}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </Card>

            {/* Revenue Data Table */}
            <Card title={`${viewMode === 'monthly' ? 'Monthly' : 'Daily'} Revenue Breakdown`} icon={Calendar} noPadding>
                <div className="min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center pt-24">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            <p className="text-gray-500 mt-2">Loading revenue data...</p>
                        </div>
                    ) : revenueData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center pt-24 text-gray-500">
                            <Calendar size={48} className="mb-4 opacity-50" />
                            <p>No revenue data found</p>
                            <p className="text-sm text-gray-400 mt-1">
                                {viewMode === 'monthly' ? `No data for ${selectedYear}` : `No data for ${getMonthName(selectedMonth)} ${selectedYear}`}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {viewMode === 'monthly' ? 'Month' : 'Date'}
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
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Count
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {revenueData.map((item, index) => (
                                        <tr
                                            key={index}
                                            onClick={() => handleRowClick(item)}
                                            className={`hover:bg-gray-50 transition-colors ${viewMode === 'daily' ? 'cursor-pointer' : ''}`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {viewMode === 'monthly'
                                                    ? getMonthName(item._id)
                                                    : `${item._id.day}/${item._id.month}/${item._id.year}`
                                                }
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-slate-700">
                                                {formatCurrency(item.totalRevenue)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-emerald-600">
                                                -{formatCurrency(item.totalDiscount || 0)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-orange-600 font-bold">
                                                {formatCurrency(item.totalCommission)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-indigo-600">
                                                {formatCurrency(item.netRevenue)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500 font-bold">
                                                {item.count}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {viewMode === 'daily' ? (
                                                    <span className="text-xs text-indigo-500 font-medium">View Daily List</span>
                                                ) : (
                                                    <span className="text-xs text-slate-400">N/A</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </Card>
            {/* Modals */}
            {openListModal && (
                <BillListModal
                    date={selectedDateLabel}
                    bills={selectedDateBills}
                    onClose={() => setOpenListModal(false)}
                    pagination={listPagination}
                    onPageChange={handlePageChange}
                    isLoading={listLoading}
                    onBillDeleted={handleBillDeleted}
                />
            )}
        </div>
    );
};

export default Revenue;
