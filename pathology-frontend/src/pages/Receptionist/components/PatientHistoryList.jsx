import React from 'react';
import { FileText, Clock, CheckCircle, AlertCircle, Calendar, Download, Mail } from 'lucide-react';

const PatientHistoryList = ({ history, onSelectReport, onDownloadReport, onSendEmail, isLoading }) => {
    const { orders = [], reports = [] } = history || {};

    // Helper for status badge
    const getStatusBadge = (status) => {
        switch (status) {
            case 'COMPLETED':
                return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold whitespace-nowrap">READY</span>;
            case 'PARTIAL':
                return <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold whitespace-nowrap">PARTIAL</span>;
            case 'PENDING':
                return <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold whitespace-nowrap">PENDING</span>;
            default:
                return null;
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-slate-100 rounded-xl"></div>
                ))}
            </div>
        );
    }

    if (!history || (orders.length === 0 && reports.length === 0)) {
        return (
            <div className="text-center py-10 text-slate-400">
                <FileText className="mx-auto mb-3 opacity-50" size={48} />
                <p>No test history found for this patient.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Active Orders */}
            {orders.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Clock size={14} /> Active Orders
                    </h3>
                    {orders.map(order => (
                        <div key={order._id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">
                                        {order.tests?.map(t => t.testName).join(', ') || 'Unknown Test'}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                        <Calendar size={12} />
                                        {new Date(order.orderDate).toLocaleDateString()}
                                    </p>
                                </div>
                                {getStatusBadge(order.overallStatus)}
                            </div>
                            <div className="text-xs text-slate-500">
                                Doctor: <span className="font-medium text-slate-700">{order.doctor?.name || 'N/A'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Completed Reports */}
            {reports.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <CheckCircle size={14} /> Completed Reports
                    </h3>
                    {reports.map(report => (
                        <div
                            key={report._id}
                            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div
                                    onClick={() => onSelectReport(report)}
                                    className="cursor-pointer flex-1"
                                >
                                    <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-700 transition-colors">
                                        {report.tests?.map(t => t.testName).join(', ') || 'Diagnostic Report'}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                        <Calendar size={12} />
                                        {new Date(report.orderDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getStatusBadge('COMPLETED')}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDownloadReport(report);
                                        }}
                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        title="Download PDF"
                                    >
                                        <Download size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSendEmail(report._id);
                                        }}
                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        title="Send via Email"
                                    >
                                        <Mail size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (!report.patientId?.phone) return;
                                            const phone = report.patientId.phone;
                                            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                                            const downloadLink = report.patientId?.reportPdfPath
                                                ? `${apiUrl}${report.patientId.reportPdfPath}`
                                                : '';
                                            const message = `Hello ${report.patientId.fullName}, here is your pathology report.${downloadLink ? `\n\nDownload Report: ${downloadLink}` : ' Please find the attached PDF.'}`;
                                            const whatsappUrl = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
                                            window.open(whatsappUrl, '_blank');
                                        }}
                                        className="p-1.5 text-slate-400 hover:text-[#25D366] hover:bg-green-50 rounded-lg transition-colors"
                                        title="Send via WhatsApp"
                                    >
                                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="css-i6dzq1"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                    </button>
                                </div>
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-3">
                                <div>Doctor: <span className="font-medium text-slate-700">{report.doctor?.name || 'N/A'}</span></div>
                                {report.isDownloaded && (
                                    <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded leading-none text-[9px] uppercase">
                                        <Download size={8} /> Downloaded
                                    </span>
                                )}
                                {report.isEmailed && (
                                    <span className="flex items-center gap-1 text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded leading-none text-[9px] uppercase">
                                        <Mail size={8} /> Emailed
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PatientHistoryList;
