
import React from 'react';
import Card from '../../../components/ui/Card';
import { FileText, ShieldCheck, AlertCircle } from 'lucide-react';

const ReportPreview = ({ reportData, error, labConfig }) => {
    if (error) {
        return (
            <Card title="Report Error" icon={AlertCircle} className="h-fit">
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <AlertCircle className="text-rose-500 mb-4" size={48} />
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Error Loading Report</h3>
                    <p className="text-slate-500">{error}</p>
                </div>
            </Card>
        );
    }

    if (reportData === null) {
        return (
            <Card title="No Reports Found" icon={FileText} className="h-fit">
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <FileText className="text-amber-400 mb-4" size={48} />
                    <h3 className="text-lg font-bold text-slate-600 mb-2">No Reports Available</h3>
                    <p className="text-slate-400">This patient doesn't have any diagnostic reports yet</p>
                </div>
            </Card>
        );
    }

    if (!reportData) {
        return (
            <Card title="Report Preview" icon={FileText} className="h-fit">
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <FileText className="text-slate-300 mb-4" size={48} />
                    <h3 className="text-lg font-bold text-slate-600 mb-2">No Report Selected</h3>
                    <p className="text-slate-400">Please select a patient to view their diagnostic report</p>
                </div>
            </Card>
        );
    }

    return (
        <Card title="Report Preview" icon={FileText} noPadding className="h-fit">
            <div
                id="report-preview"
                className="bg-white border rounded-3xl overflow-hidden"
                style={{ maxHeight: '800px', overflowY: 'auto' }}
            >
                {/* Report Header */}
                <div className="p-8 bg-slate-50 border-b">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">
                                    {labConfig?.labName || 'Precision Lab'}
                                </h1>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    Precision Diagnostic Laboratory
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest mb-2">
                                Diagnostic Report
                            </div>
                            <div className="text-xs text-slate-500 space-y-1">
                                <p><span className="font-bold">Report ID:</span> {reportData.reportId || reportData._id}</p>
                                <p><span className="font-bold">Date:</span> {new Date(reportData.orderDate).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Patient Info */}
                <div className="p-8 bg-white">
                    <div className="bg-slate-50 p-6 rounded-2xl">
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-4">
                            Patient Information
                        </h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-bold text-slate-600">Name:</span>
                                <span className="ml-2 text-slate-800 font-black">{reportData.patientId?.fullName}</span>
                            </div>
                            <div>
                                <span className="font-bold text-slate-600">Report ID:</span>
                                <span className="ml-2 text-slate-800 font-black">{reportData.reportId || reportData._id}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Test Results */}
                <div className="p-8 space-y-8">
                    {reportData.tests && reportData.tests.map((test, index) => (
                        <div key={test._id || index} className="border-b border-slate-100 pb-8 last:border-b-0">
                            <div className="flex items-center gap-4 mb-6">
                                <h3 className="text-lg font-black bg-indigo-600 text-white px-6 py-3 rounded-2xl uppercase tracking-widest">
                                    {test.testName}
                                </h3>
                                <div className="h-px flex-1 bg-slate-200"></div>
                                {test.enteredAt && (
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified On</p>
                                        <p className="text-xs font-bold text-slate-600">
                                            {new Date(test.enteredAt).toLocaleString('en-IN', {
                                                day: 'numeric', month: 'short', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {test.reportFileUrl ? (
                                <div className="bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                                    {test.reportFileUrl.toLowerCase().endsWith('.pdf') || test.reportFileUrl.startsWith('data:application/pdf') ? (
                                        <iframe
                                            src={test.reportFileUrl.startsWith('data:') ? test.reportFileUrl : `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:3000'}${test.reportFileUrl}`}
                                            className="w-full h-[600px]"
                                            title="Report PDF"
                                        />
                                    ) : (
                                        <img
                                            src={test.reportFileUrl.startsWith('data:') ? test.reportFileUrl : `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:3000'}${test.reportFileUrl}`}
                                            alt="Report"
                                            className="w-full h-auto object-contain"
                                        />
                                    )}
                                </div>
                            ) : (
                                <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="text-left py-4 px-6 font-black text-slate-700 uppercase tracking-widest text-xs">
                                                    Parameter
                                                </th>
                                                <th className="text-left py-4 px-6 font-black text-slate-700 uppercase tracking-widest text-xs">
                                                    Result
                                                </th>
                                                <th className="text-left py-4 px-6 font-black text-slate-700 uppercase tracking-widest text-xs">
                                                    Reference Range
                                                </th>
                                                <th className="text-left py-4 px-6 font-black text-slate-700 uppercase tracking-widest text-xs">
                                                    Unit
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {test.results && test.results.map((result, rIndex) => (
                                                <tr key={rIndex} className="hover:bg-slate-25">
                                                    <td className="py-4 px-6 font-bold text-slate-800">{result.parameterName}</td>
                                                    <td className="py-4 px-6 font-black text-indigo-600 text-lg">{result.value || 'Pending'}</td>
                                                    <td className="py-4 px-6 text-slate-500 italic">
                                                        {
                                                            typeof result.referenceRange === 'object' && result.referenceRange !== null
                                                                ? `${result.referenceRange.min || ''} - ${result.referenceRange.max || ''}`
                                                                : result.referenceRange || 'N/A'
                                                        }
                                                    </td>
                                                    <td className="py-4 px-6 text-slate-500 font-bold">{result.unit || '-'}</td>
                                                </tr>
                                            ))}
                                            {(!test.results || test.results.length === 0) && (
                                                <tr>
                                                    <td colSpan="4" className="py-8 text-center text-slate-400 italic">
                                                        No results entered for this test yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-8 bg-slate-50 border-t">
                    <div className="flex justify-between items-end">
                        <div className="text-xs text-slate-500 max-w-md">
                            <p className="font-bold text-slate-600 uppercase tracking-widest mb-2">
                                Important Note
                            </p>
                            <p className="leading-relaxed">
                                This report is for informational purposes only. Please consult with a healthcare professional
                                for proper medical interpretation and advice.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default ReportPreview;
