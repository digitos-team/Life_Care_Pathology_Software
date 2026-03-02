import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import ReportControls from './components/ReportControls';
import ReportPreview from './components/ReportPreview';
import PatientHistoryList from './components/PatientHistoryList';
import PatientSelectModal from './components/PatientSelectModal';
import { Search, Loader2, FileText, Download, ChevronDown, ChevronUp, User, Calendar, Clock, CheckCircle, Mail, RotateCcw } from 'lucide-react';
import { useReceptionist } from '../../contexts/ReceptionistsContext';
import { useToast } from '../../contexts/ToastContext';
import { getPatientTestHistory, getPatientReports, downloadTestReport, sendReportEmail, getAllReports, unfinalizeReport } from '../../api/receptionist/testorder.api';

import { useLocation } from 'react-router-dom';

const ReportsPage = () => {
    const { patients = [], labConfig } = useReceptionist();
    const { showToast } = useToast();
    const location = useLocation();

    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [reportData, setReportData] = useState(null);
    const [history, setHistory] = useState({ orders: [], reports: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
    const [isDownloaded, setIsDownloaded] = useState(false);
    const [allReports, setAllReports] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, pages: 0, currentPage: 1 });
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [expandedReportId, setExpandedReportId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Unified fetcher for all reports with search & pagination support
    const fetchAllReports = async (search = '', page = 1) => {
        try {
            if (!search && page === 1) setIsInitialLoading(true);
            const data = await getAllReports(search, page, 12); // Reduced from 50 to 12 for faster loading

            // Backend now returns { reports, total, pages, currentPage }
            if (data && data.reports) {
                setAllReports(data.reports);
                setPagination({
                    total: data.total,
                    pages: data.pages,
                    currentPage: data.currentPage
                });
            } else {
                setAllReports(data || []);
                setPagination({ total: 0, pages: 0, currentPage: 1 });
            }
        } catch (err) {
            console.error('Failed to fetch reports:', err);
            showToast('Failed to load reports', 'error');
        } finally {
            setIsInitialLoading(false);
        }
    };


    // Combined fetch effect (handles both initial load and search)
    useEffect(() => {
        if (selectedPatientId) return; // Don't fetch vault if a patient is selected

        const timer = setTimeout(() => {
            fetchAllReports(searchQuery, 1); // reset to page 1 on search
        }, searchQuery ? 500 : 0); // No debounce on initial load, 500ms debounce for search

        return () => clearTimeout(timer);
    }, [searchQuery, selectedPatientId]);

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > pagination.pages) return;
        fetchAllReports(searchQuery, newPage);
        // Scroll to top of vault
        const previewElement = document.getElementById('report-preview-container');
        if (previewElement) {
            previewElement.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Effect to handle navigation state (from Patient Registry)
    useEffect(() => {
        if (location.state && location.state.patientId) {
            handlePatientSelect(location.state.patientId);
        }
    }, [location.state]);

    const handlePatientSelect = async (patientId) => {
        if (!patientId) {
            setReportData(null);
            setHistory({ orders: [], reports: [] });
            setError(null);
            setIsDownloaded(false);
            return;
        }

        setSelectedPatientId(patientId);
        setIsLoading(true);
        setError(null);

        try {
            const [historyData, reportsData] = await Promise.all([
                getPatientTestHistory(patientId),
                getPatientReports(patientId)
            ]);

            const combinedHistory = {
                orders: historyData.orders || [],
                reports: reportsData || []
            };

            setHistory(combinedHistory);

            // Auto-select the most recent report if available
            if (combinedHistory.reports && combinedHistory.reports.length > 0) {
                setReportData(combinedHistory.reports[0]);
                showToast('Patient history loaded');
            } else {
                setReportData(null);
                showToast('No completed reports found', 'info');
            }
        } catch (err) {
            console.error(err);
            setError(err.message);
            setReportData(null);
            setHistory({ orders: [], reports: [] });
            showToast(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleReportExpand = (reportId) => {
        setExpandedReportId(expandedReportId === reportId ? null : reportId);
        // Clear global reportData if we are in "all reports" mode to keep focus inline
        if (!selectedPatientId) {
            setReportData(null);
        }
    };


    const handleReportSelect = async (report) => {
        setReportData(report);
        setIsDownloaded(false);

        const patientId = report.patientId?._id || report.patientId;
        if (patientId && patientId !== selectedPatientId) {
            // This will fetch history and set selectedPatientId
            // We await it to ensure order
            await handlePatientSelect(patientId);
            // Re-set reportData to the one clicked, as handlePatientSelect might auto-select the latest
            setReportData(report);
        }

        // Scroll to top of preview on mobile
        const previewElement = document.getElementById('report-preview-container');
        if (previewElement) {
            previewElement.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleDownloadPDF = async (reportToDownload = null) => {
        const targetReport = reportToDownload || reportData;
        if (!targetReport || !targetReport._id) return;

        try {
            showToast('Downloading report...', 'info');
            const blob = await downloadTestReport(targetReport._id);

            // Create a URL for the blob
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;

            // Set filename
            const filename = `Report-${targetReport.patientId?.fullName || 'Patient'}-${new Date().toISOString().split('T')[0]}.pdf`;
            link.setAttribute('download', filename);

            // Append to body, click, and cleanup
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            setIsDownloaded(true);
            showToast('Download started');

            // Refresh patient data to get updated reportPdfPath
            setTimeout(async () => {
                if (selectedPatientId) {
                    try {
                        const [historyData, reportsData] = await Promise.all([
                            getPatientTestHistory(selectedPatientId),
                            getPatientReports(selectedPatientId)
                        ]);

                        const combinedHistory = {
                            orders: historyData.orders || [],
                            reports: reportsData || []
                        };

                        setHistory(combinedHistory);

                        // Update the current report data
                        const updatedReport = combinedHistory.reports.find(r => r._id === targetReport._id);
                        if (updatedReport) {
                            setReportData(updatedReport);
                        }
                    } catch (err) {
                        console.error('Failed to refresh data:', err);
                    }
                }
            }, 1000); // Wait 1 second for backend to save the path
        } catch (error) {
            console.error('Download error:', error);
            showToast('Failed to download report', 'error');
        }
    };

    const handleSendEmail = async (orderIdParam = null) => {
        // Use provided orderId or get from currently selected report
        const orderId = orderIdParam || reportData?._id;

        if (!orderId) {
            showToast('No report selected to send', 'warning');
            return;
        }

        try {
            showToast('Sending report via email...', 'info');
            await sendReportEmail(orderId);
            showToast('Report sent successfully', 'success');
        } catch (error) {
            console.error('Email error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to send email';
            showToast(errorMessage, 'error');
        }
    };



    const handleReviseReport = async (reportId) => {
        if (!window.confirm('Are you sure you want to unlock this report for revision? \u000d\u000a\u000d\u000aThis will move the report back to "Pending Orders" and you can edit the results there.')) {
            return;
        }

        try {
            setIsLoading(true);
            await unfinalizeReport(reportId);
            showToast('Report unlocked! You can now edit it in Pending Orders.', 'success');
            // Refresh the vault
            fetchAllReports(searchQuery, pagination.currentPage);
        } catch (err) {
            console.error('Failed to unlock report:', err);
            showToast(err.message || 'Failed to unlock report', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleWhatsApp = (report) => {
        const patient = report.patientId;
        if (!patient?.phone) {
            showToast('Patient phone number not found', 'warning');
            return;
        }

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        // Use saved PDF path if available, otherwise use the download API endpoint
        const downloadLink = patient?.reportPdfPath
            ? `${apiUrl}${patient.reportPdfPath}`
            : `${apiUrl}/api/tests/${report._id}/download`;

        const message = `Hello ${patient.fullName}, here is your pathology report.\n\nDownload Report: ${downloadLink}`;
        const whatsappUrl = `https://wa.me/91${patient.phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in min-h-[600px]">
            {/* Sidebar - Controls & History - Hidden when no patient selected to keep UI clean */}
            {selectedPatientId && (
                <div className="w-full lg:w-1/3 lg:max-w-[400px] space-y-6">
                    <ReportControls
                        patients={patients}
                        selectedPatientId={selectedPatientId}
                        onOpenSelectModal={() => setIsSelectModalOpen(true)}
                        reportData={reportData}
                        onDownloadPDF={() => handleDownloadPDF(null)}
                        onSendEmail={() => handleSendEmail()}
                        isLoading={isLoading}
                        isDownloaded={isDownloaded}
                    />

                    <Card title="Patient History" className="max-h-[600px] overflow-y-auto">
                        <PatientHistoryList
                            history={history}
                            onSelectReport={handleReportSelect}
                            onDownloadReport={handleDownloadPDF}
                            onSendEmail={handleSendEmail}
                            isLoading={isLoading}
                        />
                    </Card>
                </div>
            )}

            {/* Main Content - Report Preview or All Reports List */}
            <div className={`flex-1 ${!selectedPatientId ? 'w-full' : ''}`} id="report-preview-container">
                {isLoading || isInitialLoading ? (
                    <Card title="Loading" icon={Loader2} className="h-fit">
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="animate-spin text-indigo-600" size={48} />
                            <span className="ml-4 text-lg font-bold text-slate-600">Loading...</span>
                        </div>
                    </Card>
                ) : (reportData || selectedPatientId) ? (
                    <ReportPreview
                        reportData={reportData}
                        error={error}
                        labConfig={labConfig}
                    />
                ) : (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                                <FileText className="text-indigo-600" />
                                Recent Reports Vault
                            </h2>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <div className="relative flex-1 md:w-[450px]">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search by name or number..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all placeholder:text-slate-400 shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {allReports.length === 0 ? (
                            <Card>
                                <div className="text-center py-20 text-slate-400 italic font-medium">
                                    {searchQuery ? `No reports found matching "${searchQuery}"` : "No completed reports found in the vault yet."}
                                </div>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {allReports.map((report) => (
                                    <Card key={report._id} noPadding className="overflow-hidden border border-slate-200 hover:border-indigo-200 transition-all duration-300">
                                        <div
                                            className="p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                                            onClick={() => toggleReportExpand(report._id)}
                                        >
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-lg relative group-hover:scale-110 transition-transform">
                                                        {report.patientId?.fullName?.charAt(0).toUpperCase()}
                                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                                                            <CheckCircle size={10} className="text-white" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-black text-lg text-slate-800 uppercase tracking-tight">
                                                            {report.patientId?.fullName || 'Unknown Patient'}
                                                        </h3>
                                                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                            <span className="flex items-center gap-1">
                                                                <User size={12} className="text-indigo-400" />
                                                                {report.patientId?.age}Y / {report.patientId?.gender}
                                                            </span>
                                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                            <span className="flex items-center gap-1 text-indigo-600">
                                                                {report.tests?.map(t => t.testName).join(', ')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                                    <div className="text-right">
                                                        <div className="flex items-center justify-end gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                                            <Calendar size={12} className="text-indigo-500" />
                                                            {new Date(report.updatedAt).toLocaleDateString('en-IN', {
                                                                day: 'numeric', month: 'short', year: 'numeric'
                                                            })}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-bold mt-1 flex items-center justify-end gap-1 uppercase">
                                                            <Clock size={10} />
                                                            {new Date(report.updatedAt).toLocaleTimeString('en-IN', {
                                                                hour: '2-digit', minute: '2-digit'
                                                            })}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDownloadPDF(report);
                                                            }}
                                                            className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all shadow-sm"
                                                            title="Download PDF"
                                                        >
                                                            <Download size={18} />
                                                        </button>

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSendEmail(report._id);
                                                            }}
                                                            className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all shadow-sm"
                                                            title="Send via Email"
                                                        >
                                                            <Mail size={18} />
                                                        </button>

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleWhatsApp(report);
                                                            }}
                                                            className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all shadow-sm"
                                                            title="Send via WhatsApp"
                                                        >
                                                            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                                        </button>

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleReviseReport(report._id);
                                                            }}
                                                            className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all shadow-sm"
                                                            title="Revise Report (Move to Pending)"
                                                        >
                                                            <RotateCcw size={18} />
                                                        </button>

                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${expandedReportId === report._id ? 'bg-indigo-600 text-white rotate-180 shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-400'}`}>
                                                            <ChevronDown size={20} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {expandedReportId === report._id && (
                                            <div className="border-t bg-slate-50/30 p-2 animate-in slide-in-from-top-4 duration-300">
                                                <ReportPreview
                                                    reportData={report}
                                                    error={null}
                                                    labConfig={labConfig}
                                                />
                                            </div>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        )}

                        {/* Pagination Controls */}
                        {pagination.pages > 1 && (
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 pb-12">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    Showing page <span className="text-indigo-600">{pagination.currentPage}</span> of {pagination.pages}
                                    <span className="ml-2 font-medium">({pagination.total} total reports)</span>
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                                        disabled={pagination.currentPage === 1}
                                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-all active:scale-95"
                                    >
                                        Prev
                                    </button>

                                    <div className="flex items-center gap-1">
                                        {[...Array(pagination.pages)].map((_, i) => {
                                            const pageNum = i + 1;
                                            // Only show current, first, last, and pages around current
                                            if (
                                                pageNum === 1 ||
                                                pageNum === pagination.pages ||
                                                (pageNum >= pagination.currentPage - 1 && pageNum <= pagination.currentPage + 1)
                                            ) {
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => handlePageChange(pageNum)}
                                                        className={`w-10 h-10 rounded-xl text-xs font-black transition-all active:scale-95 ${pagination.currentPage === pageNum
                                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            } else if (
                                                pageNum === pagination.currentPage - 2 ||
                                                pageNum === pagination.currentPage + 2
                                            ) {
                                                return <span key={pageNum} className="px-2 text-slate-400">...</span>;
                                            }
                                            return null;
                                        })}
                                    </div>

                                    <button
                                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                                        disabled={pagination.currentPage === pagination.pages}
                                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-all active:scale-95"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <PatientSelectModal
                isOpen={isSelectModalOpen}
                onClose={() => setIsSelectModalOpen(false)}
                onSelect={(patientId) => {
                    handlePatientSelect(patientId);
                    setIsSelectModalOpen(false);
                }}
            />
        </div>
    );
};

export default ReportsPage;
