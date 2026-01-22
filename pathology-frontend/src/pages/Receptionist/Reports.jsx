import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import ReportControls from './components/ReportControls';
import ReportPreview from './components/ReportPreview';
import PatientHistoryList from './components/PatientHistoryList';
import PatientSelectModal from './components/PatientSelectModal';
import { Loader2 } from 'lucide-react';
import { useReceptionist } from '../../contexts/ReceptionistsContext';
import { useToast } from '../../contexts/ToastContext';
import { getPatientTestHistory, getPatientReports, downloadTestReport, sendReportEmail } from '../../api/receptionist/testorder.api';

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

    // Effect to handle navigation state (from Patient Registry)
    React.useEffect(() => {
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

    const handleReportSelect = (report) => {
        setReportData(report);
        setIsDownloaded(false);
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



    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in min-h-[600px]">
            {/* Sidebar - Controls & History */}
            <div className="lg:col-span-4 space-y-6">
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

                {selectedPatientId && (
                    <Card title="Patient History" className="max-h-[600px] overflow-y-auto">
                        <PatientHistoryList
                            history={history}
                            onSelectReport={handleReportSelect}
                            onDownloadReport={handleDownloadPDF}
                            onSendEmail={handleSendEmail}
                            isLoading={isLoading}
                        />
                    </Card>
                )}
            </div>

            {/* Main Content - Report Preview */}
            <div className="lg:col-span-8" id="report-preview-container">
                {isLoading ? (
                    <Card title="Loading Report" icon={Loader2} className="h-fit">
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="animate-spin text-indigo-600" size={48} />
                            <span className="ml-4 text-lg font-bold text-slate-600">Loading history...</span>
                        </div>
                    </Card>
                ) : (
                    <ReportPreview
                        reportData={reportData}
                        error={error}
                        labConfig={labConfig}
                    />
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
