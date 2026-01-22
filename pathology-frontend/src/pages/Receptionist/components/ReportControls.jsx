import React from 'react';
import Card from '../../../components/ui/Card';
import { UserCheck, Download, FileText, Mail, Search, User, RefreshCw } from 'lucide-react';

const ReportControls = ({
    selectedPatientId,
    onOpenSelectModal,
    reportData,
    onDownloadPDF,
    onSendEmail,
    isLoading,
    isDownloaded,
    patients // Still needed to find the selected patient object
}) => {
    const selectedPatient = patients.find(p => (p._id || p.id) === selectedPatientId);

    return (
        <div className="space-y-6">
            <Card title="Patient Selection" icon={UserCheck} className="h-[500px] flex flex-col">
                <div className="space-y-6 flex-1 flex flex-col justify-center">
                    {!selectedPatient ? (
                        <div className="text-center py-10 space-y-6">
                            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto text-slate-300">
                                <User size={40} />
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-black text-slate-900 uppercase tracking-widest text-sm">No Patient Selected</h4>
                                <p className="text-[10px] text-slate-500 font-bold px-10 leading-relaxed">
                                    Please select a patient from the registry to view and manage their reports.
                                </p>
                            </div>
                            <button
                                onClick={onOpenSelectModal}
                                className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all font-black text-xs shadow-xl shadow-indigo-100 mx-auto active:scale-95"
                            >
                                <Search size={16} />
                                BROWSE PATIENTS
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                            <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-[2rem] space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-100">
                                        {(selectedPatient.fullName || selectedPatient.name || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-slate-900 text-lg truncate uppercase tracking-tight">
                                            {selectedPatient.fullName || selectedPatient.name}
                                        </p>
                                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                            Active Selection
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-white rounded-xl border border-indigo-50">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Contact</p>
                                        <p className="text-xs font-black text-slate-700">{selectedPatient.phone || selectedPatient.mobile || 'N/A'}</p>
                                    </div>
                                    <div className="p-3 bg-white rounded-xl border border-indigo-50">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Patient ID</p>
                                        <p className="text-xs font-black text-slate-700 uppercase">{selectedPatient._id?.slice(-8) || 'N/A'}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={onOpenSelectModal}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-white text-indigo-600 border border-indigo-100 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all active:scale-95"
                                >
                                    <RefreshCw size={14} />
                                    Change Patient
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            <Card title="Report Actions" icon={FileText}>
                <div className="space-y-4">
                    <button
                        onClick={onDownloadPDF}
                        disabled={!reportData || isLoading}
                        className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all ${reportData && !isLoading
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-xl'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        <Download size={18} />
                        Download PDF
                    </button>

                    <button
                        onClick={onSendEmail}
                        disabled={!reportData || isLoading || !isDownloaded}
                        className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all ${reportData && !isLoading && isDownloaded
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg hover:shadow-xl'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        <Mail size={18} />
                        Send Via Email
                    </button>

                    <button
                        onClick={() => {
                            if (!selectedPatient?.phone) return;
                            const phone = selectedPatient.phone;
                            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                            const downloadLink = reportData?.patientId?.reportPdfPath
                                ? `${apiUrl}${reportData.patientId.reportPdfPath}`
                                : '';
                            console.log('WhatsApp Debug:', {
                                reportData,
                                reportPdfPath: reportData?.patientId?.reportPdfPath,
                                downloadLink,
                                apiUrl
                            });

                            let message;
                            if (downloadLink) {
                                message = `Hello ${selectedPatient.fullName}, here is your pathology report.\n\nDownload Report: ${downloadLink}`;
                            } else {
                                message = `Hello ${selectedPatient.fullName}, here is your pathology report. Please download the report first to get a shareable link.`;
                            }

                            const whatsappUrl = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
                            window.open(whatsappUrl, '_blank');
                        }}
                        disabled={!reportData || !selectedPatient?.phone}
                        className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all ${reportData && selectedPatient?.phone
                            ? 'bg-[#25D366] text-white hover:bg-[#128C7E] shadow-lg hover:shadow-xl'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="css-i6dzq1"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                        Send Via WhatsApp
                    </button>

                    {reportData && (
                        <div className="text-center">
                            <p className="text-xs text-slate-500 font-medium mb-2">Report Details</p>
                            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
                                <p><span className="font-bold">ID:</span> {reportData._id?.slice(-8) || reportData.id || '-'}</p>
                                <p><span className="font-bold">Date:</span> {reportData.orderDate ? new Date(reportData.orderDate).toLocaleDateString() : '-'}</p>
                                <p><span className="font-bold">Tests:</span> {reportData.tests?.length || 0}</p>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default ReportControls;
