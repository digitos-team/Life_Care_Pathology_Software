import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import {
    Coins,
    Calendar,
    Download,
    User,
    ChevronRight,
    Filter,
    ArrowLeft,
    FileText,
    TrendingUp,
    Users
} from 'lucide-react';
import {
    getCommissionSummary,
    getDoctorCommissionReport,
    downloadDoctorCommissionReport
} from '../../api/admin/commission.api';
import { getDoctors } from '../../api/admin/doctors.api';
import { useToast } from '../../contexts/ToastContext';
import { format } from 'date-fns';

const CommissionReport = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [summaryData, setSummaryData] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [viewMode, setViewMode] = useState('summary'); // 'summary' or 'detail'
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [detailedReport, setDetailedReport] = useState(null);

    // Filters
    const [dateRange, setDateRange] = useState({
        startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd')
    });

    const fetchSummary = async () => {
        try {
            setLoading(true);
            const response = await getCommissionSummary(dateRange);
            setSummaryData(response.data || []);
        } catch (error) {
            showToast('Failed to fetch commission summary', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchDoctorsList = async () => {
        try {
            const response = await getDoctors({ limit: 100 });
            setDoctors(response.data?.doctors || []);
        } catch (error) {
            console.error('Failed to fetch doctors', error);
        }
    };

    useEffect(() => {
        fetchSummary();
        fetchDoctorsList();
    }, [dateRange]);

    const handleViewDetail = async (doctor) => {
        try {
            setLoading(true);
            setSelectedDoctor(doctor);
            const response = await getDoctorCommissionReport(doctor.doctorId || doctor._id, dateRange);
            setDetailedReport(response.data);
            setViewMode('detail');
        } catch (error) {
            showToast('Failed to fetch detailed report', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async (doctorId, doctorName) => {
        try {
            showToast('Generating PDF...', 'info');
            const blob = await downloadDoctorCommissionReport(doctorId, dateRange);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Commission_Report_${doctorName}_${dateRange.startDate}_to_${dateRange.endDate}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            showToast('Failed to download PDF', 'error');
        }
    };

    const handleBack = () => {
        setViewMode('summary');
        setSelectedDoctor(null);
        setDetailedReport(null);
    };

    // Calculate total summary stats
    const totalStats = summaryData.reduce((acc, curr) => ({
        totalCommission: acc.totalCommission + (curr.totalCommission || 0),
        totalBills: acc.totalBills + (curr.billCount || 0),
        totalRevenue: acc.totalRevenue + (curr.totalBusiness || 0)
    }), { totalCommission: 0, totalBills: 0, totalRevenue: 0 });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    {viewMode === 'detail' && (
                        <button
                            onClick={handleBack}
                            className="p-3 bg-white rounded-2xl shadow-sm text-slate-600 hover:bg-slate-50 transition-all border border-slate-100"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                            {viewMode === 'summary' ? 'Commission Analytics' : 'Doctor Performance'}
                        </h2>
                        <p className="text-slate-500 mt-1 font-medium">
                            {viewMode === 'summary'
                                ? 'Track and manage referring doctor payouts'
                                : `Detailed breakdown for ${selectedDoctor?.doctorName}`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 px-3">
                        <Calendar size={16} className="text-indigo-500" />
                        <input
                            type="date"
                            className="text-xs font-black border-none focus:ring-0 p-1 bg-transparent text-slate-600"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                        <span className="text-slate-300 font-black">to</span>
                        <input
                            type="date"
                            className="text-xs font-black border-none focus:ring-0 p-1 bg-transparent text-slate-600"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                    </div>
                </div>
            </div>

            {viewMode === 'summary' ? (
                <>
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex items-center gap-6">
                            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center font-black">
                                <Coins size={32} />
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Total Payout</p>
                                <h3 className="text-3xl font-black text-slate-800">₹{totalStats.totalCommission.toLocaleString()}</h3>
                            </div>
                        </div>
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex items-center gap-6">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center font-black">
                                <TrendingUp size={32} />
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Total Business</p>
                                <h3 className="text-3xl font-black text-slate-800">₹{totalStats.totalRevenue.toLocaleString()}</h3>
                            </div>
                        </div>
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex items-center gap-6">
                            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-3xl flex items-center justify-center font-black">
                                <Users size={32} />
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Active Doctors</p>
                                <h3 className="text-3xl font-black text-slate-800">{summaryData.length}</h3>
                            </div>
                        </div>
                    </div>

                    {/* Summary Table */}
                    <Card title="Doctor Commission Summary" icon={Filter} noPadding>
                        <div className="min-h-[400px]">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center pt-24">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                                    <p className="text-slate-400 font-bold mt-4">Generating Audit...</p>
                                </div>
                            ) : summaryData.length === 0 ? (
                                <div className="flex flex-col items-center justify-center pt-24 text-slate-400">
                                    <Coins size={64} className="mb-4 opacity-20" />
                                    <p className="font-bold">No commission data for this period</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50/50 border-b border-slate-100">
                                            <tr>
                                                <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Doctor Name</th>
                                                <th className="px-8 py-5 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">Bills</th>
                                                <th className="px-8 py-5 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">Total Business</th>
                                                <th className="px-8 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">Commission Amount</th>
                                                <th className="px-8 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {summaryData.map((item) => (
                                                <tr key={item.doctorId} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-8 py-5 whitespace-nowrap">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                                                                <User size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-slate-700">{item.doctorName}</p>
                                                                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">ID: {item.doctorId?.slice(-6)}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-center whitespace-nowrap font-black text-slate-600 font-mono">
                                                        {item.billCount}
                                                    </td>
                                                    <td className="px-8 py-5 text-center whitespace-nowrap font-black text-slate-500">
                                                        ₹{item.totalBusiness.toLocaleString()}
                                                    </td>
                                                    <td className="px-8 py-5 text-right whitespace-nowrap text-emerald-600 font-black">
                                                        ₹{item.totalCommission.toLocaleString()}
                                                    </td>
                                                    <td className="px-8 py-5 whitespace-nowrap text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => handleViewDetail(item)}
                                                                className="px-4 py-2 bg-indigo-50 text-indigo-600 text-xs font-black rounded-xl hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2"
                                                            >
                                                                View Report <ChevronRight size={14} />
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
                    </Card>
                </>
            ) : (
                <>
                    {/* Detailed Report Components */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Side Stats */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl">
                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-200 mb-6">Doctor Profile</h4>
                                <div className="flex flex-col items-center mb-8">
                                    <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-md ring-4 ring-white/10">
                                        <User size={48} />
                                    </div>
                                    <h5 className="text-xl font-black text-center">{selectedDoctor?.doctorName}</h5>
                                    <span className="text-indigo-200 text-xs font-bold mt-1 tracking-wider uppercase">{selectedDoctor?.specialization}</span>
                                </div>
                                <div className="space-y-4 pt-6 border-t border-indigo-400/30">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-indigo-200">Total Bills</span>
                                        <span className="font-black">{detailedReport?.summary?.totalBills || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-indigo-200">Commission</span>
                                        <span className="font-black text-emerald-300">₹{detailedReport?.summary?.totalCommissionAmount?.toLocaleString() || 0}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDownloadPDF(selectedDoctor.doctorId, selectedDoctor.doctorName)}
                                    className="w-full mt-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all shadow-lg active:scale-95"
                                >
                                    <Download size={16} /> Download PDF
                                </button>
                            </div>
                        </div>

                        {/* Transactions Table */}
                        <div className="lg:col-span-3">
                            <Card title="Billing Breakdown" icon={FileText} noPadding>
                                <div className="overflow-x-auto min-h-[500px]">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 border-b border-slate-100">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase">Bill Date</th>
                                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Bill #</th>
                                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient</th>
                                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Tests</th>
                                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Commission Type</th>
                                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Commission</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {detailedReport?.billDetails?.length > 0 ? (
                                                detailedReport.billDetails.map((bill) => (
                                                    <tr key={bill.billId} className="text-sm">
                                                        <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-bold">
                                                            {format(new Date(bill.date), 'dd MMM yyyy')}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap font-black text-indigo-600 uppercase">
                                                            {bill.billNumber}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap font-black text-slate-700 uppercase tracking-tight">
                                                            {bill.patientName}
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-500 font-medium" title={bill.testNames}>
                                                            {bill.testNames}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center font-black text-slate-500">
                                                            ₹{bill.totalAmount.toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${bill.commissionType === 'specialized'
                                                                ? 'bg-emerald-50 text-emerald-600'
                                                                : 'bg-amber-50 text-amber-600'
                                                                }`}>
                                                                {bill.commissionType}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right font-black text-emerald-600 font-mono">
                                                            ₹{bill.commissionAmount.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="6" className="py-20 text-center text-slate-400 font-bold">
                                                        No transactions recorded for this period
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default CommissionReport;
