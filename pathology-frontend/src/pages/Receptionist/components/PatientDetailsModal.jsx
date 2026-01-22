import React, { useState, useEffect } from 'react';
import { X, User, Phone, Calendar, MapPin, Activity, FileText, Loader2, Mail, Download, Clock, CheckCircle } from 'lucide-react';
import { getPatientTestHistory, getPatientReports, downloadTestReport, sendReportEmail } from '../../../api/receptionist/testorder.api';
import ReportPreview from './ReportPreview';
import { useReceptionist } from '../../../contexts/ReceptionistsContext';
import { useToast } from '../../../contexts/ToastContext';

const PatientDetailsModal = ({ isOpen, onClose, patient }) => {
    const { labConfig } = useReceptionist();
    const { showToast } = useToast();

    const [history, setHistory] = useState({ orders: [], reports: [] });
    const [selectedReport, setSelectedReport] = useState(null); // For previewing
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && patient) {
            fetchPatientData();
        } else {
            // Reset state on close
            setHistory({ orders: [], reports: [] });
            setSelectedReport(null);
            setError(null);
        }
    }, [isOpen, patient]);

    const fetchPatientData = async () => {
        if (!patient?._id && !patient?.id) return;
        const patientId = patient._id || patient.id;

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
        } catch (err) {
            console.error("Error fetching patient details:", err);
            setError("Failed to load patient history");
            showToast("Failed to load patient history", "error");
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
            const filename = `Report-${patient.fullName || 'Patient'}-${new Date().toISOString().split('T')[0]}.pdf`;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            showToast('Download started');
        } catch (error) {
            console.error('Download error:', error);
            showToast('Failed to download report', 'error');
        }
    };

    const handleSendEmail = async (orderId) => {
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

    if (!isOpen || !patient) return null;

    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header with Close Button */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-xl font-bold text-slate-800">Patient Profile</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Section 1: Patient Information */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-start gap-6">
                            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-3xl shrink-0">
                                {(patient.fullName || patient.name || '?').charAt(0)}
                            </div>
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                                    <p className="font-semibold text-slate-800 text-lg">{patient.fullName || patient.name}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</label>
                                    <div className="flex items-center gap-2 text-slate-700">
                                        <Phone size={14} /> {patient.phone}
                                    </div>
                                    {patient.email && (
                                        <div className="flex items-center gap-2 text-slate-700 text-sm">
                                            <Mail size={14} /> {patient.email}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Demographics</label>
                                    <p className="text-slate-700">{patient.age} Years / {patient.gender}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered On</label>
                                    <p className="text-slate-700">{formatDate(patient.createdAt)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Medical History & Reports */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Activity className="text-indigo-600" /> Medical History & Reports
                        </h3>

                        {isLoading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="animate-spin text-indigo-600" size={32} />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Active Orders */}
                                {history.orders.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-500 uppercase mb-3">Active Orders</h4>
                                        <div className="space-y-3">
                                            {history.orders.map(order => (
                                                <div key={order._id} className="bg-white border border-slate-200 rounded-lg p-4 flex justify-between items-center">
                                                    <div>
                                                        <p className="font-bold text-slate-800">
                                                            {order.tests?.map(t => t.testName).join(', ') || 'Unknown Test'}
                                                        </p>
                                                        <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                                                            <Calendar size={14} /> {formatDate(order.orderDate)}
                                                            <span className="text-slate-300">|</span>
                                                            <User size={14} /> Dr. {order.doctor?.name || 'N/A'}
                                                        </p>
                                                    </div>
                                                    <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full capitalize">
                                                        {order.overallStatus?.toLowerCase().replace('_', ' ')}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Completed Reports */}
                                <div>
                                    <h4 className="text-sm font-bold text-slate-500 uppercase mb-3">Completed Reports</h4>
                                    {history.reports.length === 0 ? (
                                        <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                                            <FileText className="mx-auto text-slate-300 mb-2" size={32} />
                                            <p className="text-slate-500 text-sm">No completed reports found.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {history.reports.map(report => (
                                                <div key={report._id} className="bg-white border border-slate-200 rounded-lg p-4 transition-all hover:shadow-md">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <div>
                                                            <p className="font-bold text-slate-800 text-lg">
                                                                {report.tests?.map(t => t.testName).join(', ') || 'Diagnostic Report'}
                                                            </p>
                                                            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mt-1">
                                                                <span className="flex items-center gap-1"><Calendar size={14} /> {formatDate(report.orderDate)}</span>
                                                                <span className="hidden sm:inline text-slate-300">|</span>
                                                                <span className="flex items-center gap-1"><User size={14} /> Dr. {report.doctor?.name || 'N/A'}</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => setSelectedReport(selectedReport?._id === report._id ? null : report)}
                                                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedReport?._id === report._id
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
                                                        <div className="mt-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2">
                                                            <div className="bg-slate-50 rounded-xl p-4 max-h-[500px] overflow-y-auto border border-slate-200">
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
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientDetailsModal;
