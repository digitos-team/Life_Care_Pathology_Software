import React, { useState, useEffect } from 'react';
import { X, Save, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { submitBulkResultsByBill, getPatientReports } from '../../../api/receptionist/testorder.api';
import { getLabTestById } from '../../../api/receptionist/labtest.api';
import { useToast } from '../../../contexts/ToastContext';

const SubmitBulkResultModal = ({ isOpen, onClose, order, onSuccess }) => {
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState({}); // Map of testItemId::parameterName -> value
    const [displayTests, setDisplayTests] = useState([]); // Local state for tests with updated definitions

    /**
     * Build a display-friendly reference range string from a master parameter definition.
     */
    const buildDisplayText = (masterParam) => {
        const rt = masterParam.resultType || 'NUMERIC';
        if (rt === 'NUMERIC') {
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
            const first = (masterParam.referenceRanges || [])[0];
            if (first) { obj.min = first.min; obj.max = first.max; }
        } else if (rt === 'UNISEX_NUMERIC') {
            const r = masterParam.unisexRange || {};
            obj.min = r.min; obj.max = r.max;
        }
        return obj;
    };

    // Initialize results from all tests in the order AND fetch latest definitions
    useEffect(() => {
        const initialize = async () => {
            if (order && order.tests) {
                const initialResults = {};

                // 1. Prepare initial results from snapshot
                // Use composite key testItemId::parameterName to keep each test's values independent
                order.tests.forEach(test => {
                    const testItemId = test._id || test.testId;
                    if (test.results) {
                        test.results.forEach(param => {
                            const key = `${testItemId}::${param.parameterName}`;
                            initialResults[key] = param.value || '';
                        });
                    }
                });
                setResults(initialResults);

                // 2. Initial Display Tests (Snapshot)
                let currentTests = order.tests.map(test => ({
                    ...test,
                    parameters: test.results || []
                }));
                setDisplayTests(currentTests);

                // 3. Fetch latest definitions for ALL tests in parallel
                try {
                    const uniqueTestIds = [...new Set(order.tests.map(t => t.testId))];
                    const testsDefinitions = await Promise.all(
                        uniqueTestIds.map(id => getLabTestById(id).catch(() => null))
                    );

                    const definitionMap = {};
                    testsDefinitions.forEach(def => {
                        if (def && def._id) definitionMap[def._id] = def;
                    });

                    // Update displayTests with merged definitions
                    const updatedTests = currentTests.map(test => {
                        const masterDef = definitionMap[test.testId];
                        if (masterDef) {
                            const mergedParams = masterDef.parameters.map(masterParam => {
                                const snapshotParam = test.parameters.find(p => p.parameterName === masterParam.name);
                                return {
                                    parameterName: masterParam.name,
                                    value: snapshotParam ? snapshotParam.value : '',
                                    unit: masterParam.unit,
                                    resultType: masterParam.resultType || 'NUMERIC',
                                    referenceRange: buildReferenceRangeObj(masterParam),
                                    qualitativeOptions: masterParam.qualitativeOptions || null,
                                    comparisonRanges: masterParam.comparisonRanges || (masterParam.comparisonRange ? [masterParam.comparisonRange] : []),
                                    unisexRange: masterParam.unisexRange || null,
                                    referenceRanges: masterParam.referenceRanges || [],
                                };
                            });
                            return { ...test, parameters: mergedParams };
                        }
                        return test;
                    });

                    setDisplayTests(updatedTests);

                } catch (err) {
                    console.warn("Bulk Modal: Failed to refresh definitions", err);
                }
            }
        };

        if (isOpen) {
            initialize();
        }
    }, [order, isOpen]);

    if (!isOpen || !order) return null;

    const handleResultChange = (testItemId, paramName, value) => {
        const key = `${testItemId}::${paramName}`;
        setResults(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const resultsArray = Object.entries(results)
            .filter(([_, value]) => value && value.trim() !== '')
            .map(([compositeKey, value]) => {
                const separatorIndex = compositeKey.indexOf('::');
                return {
                    testItemId: compositeKey.substring(0, separatorIndex),
                    parameterName: compositeKey.substring(separatorIndex + 2),
                    value
                };
            });

        if (resultsArray.length === 0) {
            showToast('Please enter at least one result value', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const billId = order.billId;

            if (!billId) {
                throw new Error('Bill ID not found for this order. Cannot submit bulk results.');
            }

            const payload = {
                results: resultsArray
            };

            const response = await submitBulkResultsByBill(billId, payload);

            if (response.overallStatus === 'COMPLETED' && order.patientId?._id) {
                try {
                    await getPatientReports(order.patientId._id);
                    showToast('All results submitted and Report Generated');
                } catch (reportError) {
                    console.error('Error fetching reports:', reportError);
                    showToast('Results submitted, but failed to fetch report', 'warning');
                }
            } else {
                showToast('Bulk results submitted successfully');
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
     * Validate a result value against its parameter definition.
     * Supports all 4 result types.
     */
    const validateResult = (value, param) => {
        if (!value || value.trim() === '') return { status: 'normal' };

        const rt = param.resultType || 'NUMERIC';

        // QUALITATIVE
        if (rt === 'QUALITATIVE') {
            const normalVal = param.qualitativeOptions?.normalValue || param.referenceRange?.displayText?.replace('Normal: ', '');
            if (normalVal && value.trim().toLowerCase() !== normalVal.trim().toLowerCase()) {
                return { status: 'abnormal', type: 'abnormal' };
            }
            return { status: 'normal' };
        }

        // Numeric types
        const numVal = parseFloat(value);
        if (isNaN(numVal)) return { status: 'normal' };

        // COMPARISON
        if (rt === 'COMPARISON') {
            const ranges = param.comparisonRanges || (param.comparisonRange ? [param.comparisonRange] : []);
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

        // NUMERIC / UNISEX_NUMERIC — use min/max from referenceRange
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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">Submit Bulk Results</h3>
                        <p className="text-sm text-slate-500">
                            {order.patientId?.fullName} • {order.tests?.length} Tests
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
                    {displayTests.map((test, testIndex) => (
                        <div key={test._id || testIndex} className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                    <FileText size={18} className="text-indigo-500" />
                                    {test.testName}
                                </h4>
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${test.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                    {test.status}
                                </span>
                            </div>

                            {test.parameters && test.parameters.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {test.parameters.map((param, paramIndex) => {
                                        const testItemId = test._id || test.testId;
                                        const compositeKey = `${testItemId}::${param.parameterName}`;
                                        const currentValue = results[compositeKey] || '';
                                        const validation = validateResult(currentValue, param);
                                        const isAbnormal = validation.status === 'abnormal';
                                        const rt = param.resultType || 'NUMERIC';

                                        return (
                                            <div key={paramIndex} className={`p-3 rounded-xl border transition-all ${isAbnormal ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                                                <label className={`text-xs font-bold block mb-1 ${isAbnormal ? 'text-red-700' : 'text-slate-600'}`}>
                                                    {param.parameterName}
                                                </label>
                                                <div className="flex gap-2 relative">
                                                    {/* QUALITATIVE: Render dropdown */}
                                                    {rt === 'QUALITATIVE' && param.qualitativeOptions?.options?.length ? (
                                                        <select
                                                            value={currentValue}
                                                            onChange={(e) => handleResultChange(testItemId, param.parameterName, e.target.value)}
                                                            className={`flex-1 px-3 py-2 border rounded-lg text-sm font-medium outline-none transition-all ${isAbnormal
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
                                                        <input
                                                            type="text"
                                                            value={currentValue}
                                                            onChange={(e) => handleResultChange(testItemId, param.parameterName, e.target.value)}
                                                            placeholder="Value"
                                                            className={`flex-1 px-3 py-2 border rounded-lg text-sm font-medium outline-none transition-all ${isAbnormal
                                                                ? 'bg-white border-red-300 text-red-700 focus:ring-2 focus:ring-red-200 focus:border-red-400'
                                                                : 'bg-white border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
                                                                }`}
                                                        />
                                                    )}
                                                    <div className={`flex items-center justify-center px-2 rounded-lg text-xs font-bold min-w-[3rem] ${isAbnormal ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-600'}`}>
                                                        {param.unit || '-'}
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center mt-1">
                                                    <div className={`text-[10px] ${isAbnormal ? 'text-red-500' : 'text-slate-400'}`}>
                                                        Range: {formatRefRange(param)}
                                                    </div>
                                                    {isAbnormal && (
                                                        <span className="text-[10px] font-bold text-red-500 uppercase">
                                                            {validation.type}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-3 bg-slate-50 rounded-xl text-sm text-slate-400 italic">
                                    No parameters defined for this test.
                                </div>
                            )}
                        </div>
                    ))}
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
                                Submit All Results
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubmitBulkResultModal;
