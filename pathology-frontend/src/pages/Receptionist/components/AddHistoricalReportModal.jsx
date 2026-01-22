import React, { useState } from 'react';
import { X, Upload, FileText, Calendar, User, Stethoscope, Eye, EyeOff } from 'lucide-react';
import { uploadHistoricalReport } from '../../../api/receptionist/historicalReport.api';
import { updatePatient } from '../../../api/receptionist/patient.api';
import { useToast } from '../../../contexts/ToastContext';

const AddHistoricalReportModal = ({ isOpen, onClose, patients, onSuccess, patient }) => {
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        patientId: patient ? (patient._id || patient.id) : '',
        testName: '',
        doctorName: '',
        testDate: new Date().toISOString().split('T')[0],
        reportFile: null
    });
    const [previewUrl, setPreviewUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    React.useEffect(() => {
        if (isOpen && patient) {
            setFormData(prev => ({
                ...prev,
                patientId: patient._id || patient.id
            }));
        } else if (isOpen && !patient) {
            setFormData(prev => ({
                ...prev,
                patientId: ''
            }));
        }
    }, [isOpen, patient]);

    // Cleanup preview URL
    React.useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData(prev => ({ ...prev, reportFile: file }));

            // Create preview URL
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            setShowPreview(true);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.patientId || !formData.testName || !formData.reportFile) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        setIsLoading(true);

        // Convert file to Base64
        const reader = new FileReader();
        reader.readAsDataURL(formData.reportFile);

        reader.onload = async () => {
            try {
                const base64File = reader.result;
                const payload = {
                    patientId: formData.patientId,
                    testName: formData.testName,
                    doctorName: formData.doctorName,
                    testDate: formData.testDate,
                    reportFileUrl: base64File // Send as string
                };

                await uploadHistoricalReport(payload);

                // Update patient status to 'generated' so it reflects in the list
                try {
                    await updatePatient(formData.patientId, { reportStatus: 'generated' });
                } catch (statusErr) {
                    console.error('Failed to update patient status:', statusErr);
                    // Don't fail the whole upload if just status update fails
                }

                showToast('Historical report uploaded successfully');
                onSuccess();
                onClose();
                // Reset form
                setFormData({
                    patientId: '',
                    testName: '',
                    doctorName: '',
                    testDate: new Date().toISOString().split('T')[0],
                    reportFile: null
                });
                setPreviewUrl(null);
                setShowPreview(false);
            } catch (error) {
                console.error('Upload error:', error);
                showToast(error.message || 'Failed to upload report', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        reader.onerror = () => {
            console.error('File reading error');
            showToast('Failed to read file', 'error');
            setIsLoading(false);
        };
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800">Upload Historical Report</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Patient Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <User size={14} /> Patient
                        </label>
                        <select
                            name="patientId"
                            value={formData.patientId}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all ${patient ? 'opacity-70 cursor-not-allowed' : ''}`}
                            required
                            disabled={!!patient}
                        >
                            <option value="">Select Patient...</option>
                            {patients.map(p => (
                                <option key={p._id || p.id} value={p._id || p.id}>{p.fullName || p.name} ({p.phone})</option>
                            ))}
                        </select>
                    </div>

                    {/* Test Name */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <FileText size={14} /> Test Name
                        </label>
                        <input
                            type="text"
                            name="testName"
                            value={formData.testName}
                            onChange={handleChange}
                            placeholder="e.g. CBC, Lipid Profile"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                            required
                        />
                    </div>

                    {/* Doctor Name */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Stethoscope size={14} /> Doctor Name
                        </label>
                        <input
                            type="text"
                            name="doctorName"
                            value={formData.doctorName}
                            onChange={handleChange}
                            placeholder="e.g. Dr. Smith (Optional)"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                        />
                    </div>

                    {/* Test Date */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Calendar size={14} /> Test Date
                        </label>
                        <input
                            type="date"
                            name="testDate"
                            value={formData.testDate}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                            required
                        />
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Upload size={14} /> Report File
                        </label>
                        <div className="relative">
                            <input
                                type="file"
                                onChange={handleFileChange}
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all"
                                required
                            />
                        </div>
                    </div>

                    {/* File Preview Section */}
                    {previewUrl && (
                        <div className="space-y-2">
                            <button
                                type="button"
                                onClick={() => setShowPreview(!showPreview)}
                                className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider hover:text-indigo-700 transition-colors"
                            >
                                {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                                {showPreview ? 'Hide Preview' : 'Show Preview'}
                            </button>

                            {showPreview && (
                                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 max-h-48 overflow-y-auto shadow-inner">
                                    {formData.reportFile?.type === 'application/pdf' ? (
                                        <div className="p-4 flex flex-col items-center justify-center text-slate-500">
                                            <FileText size={32} className="mb-2 text-indigo-400" />
                                            <p className="text-xs font-medium">{formData.reportFile.name}</p>
                                            <p className="text-[10px] opacity-70">PDF Preview not available in modal</p>
                                        </div>
                                    ) : (
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="w-full h-auto"
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>Uploading...</>
                            ) : (
                                <>
                                    <Upload size={18} />
                                    Upload Report
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddHistoricalReportModal;
