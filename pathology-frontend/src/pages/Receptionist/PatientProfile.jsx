import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Calendar, MapPin, Activity, FileText, Loader2, Mail, Download, Clock, CheckCircle, Trash2 } from 'lucide-react';
import { getPatientTestHistory, getPatientReports, downloadTestReport, sendReportEmail, deleteTestOrder } from '../../api/receptionist/testorder.api';
import { getPatientById } from '../../api/receptionist/patient.api';
import ReportPreview from './components/ReportPreview';
import { AdminContext } from '../../contexts/AdminContext';
import { ReceptionistContext } from '../../contexts/ReceptionistsContext';
import { useToast } from '../../contexts/ToastContext';

const PatientProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Safely get labConfig from either Admin or Receptionist context
    const adminCtx = React.useContext(AdminContext);
    const receptionistCtx = React.useContext(ReceptionistContext);
    const labConfig = adminCtx?.labConfig || receptionistCtx?.labConfig;

    const { showToast } = useToast();

    const [patient, setPatient] = useState(null);
    const [history, setHistory] = useState({ orders: [], reports: [] });
    const [selectedReport, setSelectedReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Fetch patient details and history in parallel
            const [patientData, historyData, reportsData] = await Promise.all([
                getPatientById(id),
                getPatientTestHistory(id),
                getPatientReports(id)
            ]);

            setPatient(patientData.data || patientData); // Handle potential API response structure
            setHistory({
                orders: historyData.orders || [],
                reports: reportsData || []
            });
        } catch (err) {
            console.error("Error fetching patient profile:", err);
            setError("Failed to load patient profile");
            showToast("Failed to load patient profile", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadPDF = async (report) => {
        if (!report || !report._id) return;
        try {
            showToast('Downloading report...', 'info');
            const blob = await downloadTestReport(report._id);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            const filename = `Report-${patient?.fullName || 'Patient'}-${new Date().toISOString().split('T')[0]}.pdf`;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            showToast('Download started');
            // Refresh data to show "Downloaded" status
            setTimeout(fetchData, 1000);
        } catch (error) {
            console.error('Download error:', error);
            showToast('Failed to download report', 'error');
        }
    };

    const handleSendEmail = async (orderId) => {
        if (!orderId) return;
        try {
            showToast('Sending report via email...', 'info');
            await sendReportEmail(orderId);
            showToast('Report sent successfully', 'success');
            // Refresh data to show "Emailed" status
            fetchData();
        } catch (error) {
            console.error('Email error:', error);
            showToast(error.message || 'Failed to send email', 'error');
        }
    };

    const handleDeleteOrder = async (e, orderId) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
            return;
        }

        try {
            showToast('Deleting order...', 'info');
            await deleteTestOrder(orderId);
            showToast('Order deleted successfully');
            fetchData(); // Refresh list
        } catch (error) {
            console.error('Delete error:', error);
            showToast(error.message || 'Failed to delete order', 'error');
        }
    };


    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    // Helper for status badge
    const getStatusBadge = (status) => {
        switch (status) {
            case 'COMPLETED':
                return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">READY</span>;
            case 'PARTIAL':
                return <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold">PARTIAL</span>;
            case 'PENDING':
                return <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">PENDING</span>;
            default:
                return null;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-indigo-600" size={48} />
            </div>
        );
    }

    if (error || !patient) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
                <Activity size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium">{error || 'Patient not found'}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-medium hover:bg-indigo-100 transition-colors"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h2 className="text-2xl font-black text-slate-800">Patient Profile</h2>
                    <p className="text-slate-500">View patient details and medical history</p>
                </div>
            </div>

            {/* Section 1: Patient Information */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-4xl shrink-0">
                        {(patient.fullName || patient.name || '?').charAt(0)}
                    </div>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6 w-full">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name</label>
                            <p className="font-bold text-slate-800 text-lg">{patient.fullName || patient.name}</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Contact</label>
                            <div className="flex items-center gap-2 text-slate-700 font-medium">
                                <Phone size={16} className="text-slate-400" /> {patient.phone}
                            </div>
                            {patient.email && (
                                <div className="flex items-center gap-2 text-slate-700 text-sm mt-1">
                                    <Mail size={16} className="text-slate-400" /> {patient.email}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Demographics</label>
                            <p className="text-slate-700 font-medium">{patient.age} Years / {patient.gender}</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Registered On</label>
                            <p className="text-slate-700 font-medium">{formatDate(patient.createdAt)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 2: Medical History & Reports */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Activity className="text-indigo-600" /> Medical History & Reports
                </h3>

                {/* Active Orders */}
                {history.orders.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Active Orders</h4>
                        {history.orders.map(order => (
                            <div key={order._id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                                <div>
                                    <p className="font-bold text-slate-800 text-lg">
                                        {order.tests?.map(t => t.testName).join(', ') || 'Unknown Test'}
                                    </p>
                                    <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                                        <Calendar size={14} /> {formatDate(order.orderDate)}
                                        <span className="text-slate-300">|</span>
                                        <User size={14} /> Dr. {order.doctor?.name || 'N/A'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {getStatusBadge(order.overallStatus)}
                                    <button
                                        onClick={(e) => handleDeleteOrder(e, order._id)}
                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                                        title="Delete Order"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Completed Reports */}
                <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Completed Reports</h4>
                    {history.reports.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                            <FileText className="mx-auto text-slate-300 mb-3" size={48} />
                            <p className="text-slate-500 font-medium">No completed reports found.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.reports.map(report => (
                                <div key={report._id} className="bg-white border border-slate-200 rounded-xl p-5 transition-all hover:shadow-md hover:border-indigo-200">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <p className="font-bold text-slate-800 text-lg">
                                                {report.tests?.map(t => t.testName).join(', ') || 'Diagnostic Report'}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mt-1">
                                                <span className="flex items-center gap-1"><Calendar size={14} /> {formatDate(report.orderDate)}</span>
                                                <span className="hidden sm:inline text-slate-300">|</span>
                                                <span className="flex items-center gap-1"><User size={14} /> Dr. {report.doctor?.name || 'N/A'}</span>
                                                {report.isDownloaded && (
                                                    <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded leading-none text-[10px] uppercase">
                                                        <Download size={10} /> Downloaded
                                                    </span>
                                                )}
                                                {report.isEmailed && (
                                                    <span className="flex items-center gap-1 text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded leading-none text-[10px] uppercase">
                                                        <Mail size={10} /> Emailed
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {getStatusBadge('COMPLETED')}
                                            <button
                                                onClick={() => setSelectedReport(selectedReport?._id === report._id ? null : report)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedReport?._id === report._id
                                                    ? 'bg-indigo-100 text-indigo-700'
                                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                    }`}
                                            >
                                                {selectedReport?._id === report._id ? 'Hide Preview' : 'View Report'}
                                            </button>
                                            <button
                                                onClick={() => handleDownloadPDF(report)}
                                                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Download PDF"
                                            >
                                                <Download size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleSendEmail(report._id)}
                                                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Send Email"
                                            >
                                                <Mail size={20} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Inline Preview */}
                                    {selectedReport?._id === report._id && (
                                        <div className="mt-6 pt-6 border-t border-slate-100 animate-in slide-in-from-top-2">
                                            <div className="bg-slate-50 rounded-xl p-4 max-h-[600px] overflow-y-auto border border-slate-200 shadow-inner">
                                                <ReportPreview reportData={report} labConfig={labConfig} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PatientProfile;
