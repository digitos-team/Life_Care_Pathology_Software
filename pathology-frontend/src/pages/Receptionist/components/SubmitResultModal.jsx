import React, { useState, useEffect } from 'react';
import { X, Save, FileText, Upload, AlertCircle } from 'lucide-react';
import { submitTestResult, getPatientReports } from '../../../api/receptionist/testorder.api';
import { getLabTestById } from '../../../api/receptionist/labtest.api';
import { useToast } from '../../../contexts/ToastContext';

const SubmitResultModal = ({ isOpen, onClose, orderId, testItem, patientId, onSuccess }) => {
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingInfo, setIsFetchingInfo] = useState(false);
    const [results, setResults] = useState([]);
    const [reportFile, setReportFile] = useState(null);

    /**
     * Build a display-friendly reference range string from a master parameter definition.
     */
    const buildDisplayText = (masterParam) => {
        const rt = masterParam.resultType || 'NUMERIC';
        if (rt === 'NUMERIC') {
            // Show all gender ranges
            return (masterParam.referenceRanges || [])
                .map(r => `${r.gender}: ${r.min} - ${r.max}`)
                .join(' | ');
        }
        if (rt === 'UNISEX_NUMERIC') {
            const r = masterParam.unisexRange || {};
            return `${r.min} - ${r.max}`;
        }
        if (rt === 'COMPARISON') {
            const ranges = masterParam.comparisonRanges || (masterParam.comparisonRange ? [masterParam.comparisonRange] : []);
            return ranges
                .map(cr => `${cr.gender ? cr.gender + ': ' : ''}${cr.comparator || '<'} ${cr.value}`)
                .join(' | ');
        }
        if (rt === 'QUALITATIVE') {
            const q = masterParam.qualitativeOptions || {};
            return `Normal: ${q.normalValue || ''}`;
        }
        return 'N/A';
    };

    /**
     * Build the referenceRange object to store along with the result.
     */
    const buildReferenceRangeObj = (masterParam) => {
        const rt = masterParam.resultType || 'NUMERIC';
        const obj = { displayText: buildDisplayText(masterParam) };
        if (rt === 'NUMERIC') {
            // Store first range for backward compat
            const first = (masterParam.referenceRanges || [])[0];
            if (first) { obj.min = first.min; obj.max = first.max; }
        } else if (rt === 'UNISEX_NUMERIC') {
            const r = masterParam.unisexRange || {};
            obj.min = r.min; obj.max = r.max;
        }
        return obj;
    };

    // Initialize results from test item parameters AND fetch latest definitions
    useEffect(() => {
        const initialize = async () => {
            if (testItem && testItem.results) {
                // 1. Start with existing saved results (snapshot)
                let initialParams = testItem.results.map(param => ({
                    parameterName: param.parameterName,
                    value: param.value || '',
                    unit: param.unit,
                    resultType: param.resultType || 'NUMERIC',
                    referenceRange: param.referenceRange,
                    // For QUALITATIVE: carry over options from master later
                    qualitativeOptions: null,
                }));

                setResults(initialParams);

                // 2. Try to fetch LATEST definitions from Master if available
                if (testItem.testId) {
                    try {
                        setIsFetchingInfo(true);
                        const latestTest = await getLabTestById(testItem.testId);

                        if (latestTest && latestTest.parameters) {
                            const mergedResults = latestTest.parameters.map(masterParam => {
                                const existing = initialParams.find(p => p.parameterName === masterParam.name);
                                return {
                                    parameterName: masterParam.name,
                                    value: existing ? existing.value : '',
                                    unit: masterParam.unit,
                                    resultType: masterParam.resultType || 'NUMERIC',
                                    referenceRange: buildReferenceRangeObj(masterParam),
                                    // Pass qualitative options for dropdown rendering
                                    qualitativeOptions: masterParam.qualitativeOptions || null,
                                    // Pass comparisonRanges array for validation
                                    comparisonRanges: masterParam.comparisonRanges || (masterParam.comparisonRange ? [masterParam.comparisonRange] : []),
                                    // Pass unisex range for validation
                                    unisexRange: masterParam.unisexRange || null,
                                    // For NUMERIC, pass all gender ranges
                                    referenceRanges: masterParam.referenceRanges || [],
                                };
                            });

                            setResults(mergedResults);
                        }
                    } catch (err) {
                        console.warn("Could not fetch latest test definition, using snapshot.", err);
                    } finally {
                        setIsFetchingInfo(false);
                    }
                }
            }
        };

        if (isOpen) {
            initialize();
        }
    }, [testItem, isOpen]);

    if (!isOpen || !testItem) return null;

    const handleResultChange = (index, value) => {
        const newResults = [...results];
        newResults[index].value = value;
        setResults(newResults);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setReportFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate that at least one result is entered or a file is uploaded
        const hasResults = results.some(r => r.value.trim() !== '');
        if (!hasResults && !reportFile) {
            showToast('Please enter at least one result value or upload a report file', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                results: results
                    .filter(r => r.value.trim() !== '')
                    .map(r => ({
                        parameterName: r.parameterName,
                        value: r.value,
                        unit: r.unit,
                        resultType: r.resultType || 'NUMERIC',
                        referenceRange: r.referenceRange,
                    })),
            };

            const response = await submitTestResult(orderId, testItem._id || testItem.testId, payload);

            // Check if order is completed and fetch reports if so
            if (response.overallStatus === 'COMPLETED' && patientId) {
                try {
                    await getPatientReports(patientId);
                    showToast('Test results submitted and Report Generated');
                } catch (reportError) {
                    console.error('Error fetching reports:', reportError);
                    showToast('Results submitted, but failed to fetch report', 'warning');
                }
            } else {
                showToast('Test results submitted successfully');
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Submit error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to submit results';
            showToast(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Validate a result value against its reference range.
     * Supports all 4 result types.
     */
    const validateResult = (param) => {
        const value = param.value;
        if (!value || value.trim() === '') return { status: 'normal' };

        const rt = param.resultType || 'NUMERIC';

        if (rt === 'QUALITATIVE') {
            const normalVal = param.qualitativeOptions?.normalValue || param.referenceRange?.displayText?.replace('Normal: ', '');
            if (normalVal && value.trim().toLowerCase() !== normalVal.trim().toLowerCase()) {
                return { status: 'abnormal', type: 'abnormal' };
            }
            return { status: 'normal' };
        }

        // For numeric types, try parsing
        const numVal = parseFloat(value);
        if (isNaN(numVal)) return { status: 'normal' };

        if (rt === 'COMPARISON') {
            const ranges = param.comparisonRanges || (param.comparisonRange ? [param.comparisonRange] : []);
            // Use the first range (unisex) — gender-specific matching would require patient gender
            const comp = ranges[0];
            if (comp) {
                const comparator = comp.comparator;
                const threshold = Number(comp.value);
                if (comparator && !isNaN(threshold)) {
                    if (comparator === '<' && numVal >= threshold) return { status: 'abnormal', type: 'high' };
                    if (comparator === '<=' && numVal > threshold) return { status: 'abnormal', type: 'high' };
                    if (comparator === '>' && numVal <= threshold) return { status: 'abnormal', type: 'low' };
                    if (comparator === '>=' && numVal < threshold) return { status: 'abnormal', type: 'low' };
                }
            }
            return { status: 'normal' };
        }

        // NUMERIC and UNISEX_NUMERIC — use min/max from referenceRange
        const range = param.referenceRange;
        if (range && typeof range === 'object') {
            const { min, max } = range;
            if (min !== undefined && min !== null && numVal < min) {
                return { status: 'abnormal', type: 'low' };
            }
            if (max !== undefined && max !== null && numVal > max) {
                return { status: 'abnormal', type: 'high' };
            }
        }
        return { status: 'normal' };
    };

    /**
     * Format the reference range display text for a parameter.
     */
    const formatRefRange = (param) => {
        if (param.referenceRange?.displayText) return param.referenceRange.displayText;
        if (typeof param.referenceRange === 'object' && param.referenceRange !== null) {
            const { min, max } = param.referenceRange;
            if (min != null && max != null) return `${min} - ${max}`;
        }
        return param.referenceRange || 'N/A';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">Enter Test Results</h3>
                        <p className="text-sm text-slate-500">{testItem.testName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Parameters Input */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-sm text-slate-700 uppercase tracking-wider flex items-center gap-2">
                            <FileText size={16} /> Test Parameters
                        </h4>

                        {results.length === 0 ? (
                            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-sm flex items-center gap-2">
                                <AlertCircle size={18} />
                                No parameters defined for this test. You can upload a report file instead.
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {results.map((param, index) => {
                                    const validation = validateResult(param);
                                    const isAbnormal = validation.status === 'abnormal';
                                    const rt = param.resultType || 'NUMERIC';

                                    return (
                                        <div key={index} className={`grid grid-cols-1 sm:grid-cols-12 gap-2 items-center p-3 rounded-xl border transition-all ${isAbnormal ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                                            <div className="sm:col-span-4">
                                                <label className={`text-sm font-bold block ${isAbnormal ? 'text-red-700' : 'text-slate-700'}`}>
                                                    {param.parameterName}
                                                </label>
                                                <span className={`text-xs ${isAbnormal ? 'text-red-500' : 'text-slate-500'}`}>
                                                    Ref: {formatRefRange(param)}
                                                </span>
                                            </div>
                                            <div className="sm:col-span-8">
                                                <div className="relative">
                                                    {/* QUALITATIVE: Render dropdown instead of text input */}
                                                    {rt === 'QUALITATIVE' && param.qualitativeOptions?.options?.length ? (
                                                        <select
                                                            value={param.value}
                                                            onChange={(e) => handleResultChange(index, e.target.value)}
                                                            className={`w-full px-3 py-2 border rounded-lg text-sm font-medium outline-none transition-all ${isAbnormal
                                                                ? 'bg-white border-red-300 text-red-700 focus:ring-2 focus:ring-red-200 focus:border-red-400'
                                                                : 'bg-white border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
                                                                }`}
                                                        >
                                                            <option value="">Select result...</option>
                                                            {param.qualitativeOptions.options.filter(o => o.trim()).map((opt, i) => (
                                                                <option key={i} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={param.value}
                                                                onChange={(e) => handleResultChange(index, e.target.value)}
                                                                placeholder={`Enter value`}
                                                                className={`flex-1 px-3 py-2 border rounded-lg text-sm font-medium outline-none transition-all ${isAbnormal
                                                                    ? 'bg-white border-red-300 text-red-700 focus:ring-2 focus:ring-red-200 focus:border-red-400'
                                                                    : 'bg-white border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
                                                                    }`}
                                                            />
                                                            {param.unit && (
                                                                <div className={`flex items-center justify-center px-2 rounded-lg text-xs font-bold min-w-[3rem] ${isAbnormal ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-600'}`}>
                                                                    {param.unit}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {isAbnormal && (
                                                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-bold text-red-500 uppercase">
                                                            {validation.type}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </form>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>Saving...</>
                        ) : (
                            <>
                                <Save size={18} />
                                Submit Results
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubmitResultModal;
