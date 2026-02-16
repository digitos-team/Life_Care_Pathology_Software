import React, { useState, useEffect } from 'react';
import { X, Save, Microscope, Search, Plus, CheckCircle, Trash2, Stethoscope, AlertCircle, ShoppingCart, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { getAllLabTests } from '../../../api/receptionist/labtest.api';
import { createTestOrder, getDoctors } from '../../../api/receptionist/testorder.api';
import { getDiscounts } from '../../../api/admin/discounts.api';
import { getTestPackages } from '../../../api/admin/testPackage.api';
import { useToast } from '../../../contexts/ToastContext';

const AssignTestModal = ({ isOpen, onClose, patient, onSuccess }) => {
    const { showToast } = useToast();

    // Data State
    const [labTests, setLabTests] = useState([]);
    const [testPackages, setTestPackages] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [discounts, setDiscounts] = useState([]); // Active discounts
    const [loading, setLoading] = useState(true);

    // Selection State
    const [selectionMode, setSelectionMode] = useState('tests'); // 'tests' or 'packages'
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedDiscount, setSelectedDiscount] = useState(null);
    const [assignedTests, setAssignedTests] = useState([]);
    const [assignedPackages, setAssignedPackages] = useState([]);
    const [expandedPackages, setExpandedPackages] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Reset state when modal opens/closes or patient changes
    useEffect(() => {
        if (isOpen) {
            fetchData();
            setAssignedTests([]);
            setAssignedPackages([]);
            setExpandedPackages(new Set());
            setSelectedDoctor(null);
            setSearchTerm('');
            setCategoryFilter('');
            setSelectionMode('tests');
        }
    }, [isOpen, patient]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [testsData, packagesData, doctorsData, discountsData] = await Promise.all([
                getAllLabTests(),
                getTestPackages(),
                getDoctors(),
                getDiscounts(true) // Fetch active discounts
            ]);

            console.log('AssignTestModal - API responses:', { testsData, packagesData, doctorsData, discountsData });

            // Extract tests - handle nested structure
            const testsList = testsData?.data?.data || testsData?.data || testsData || [];
            setLabTests(Array.isArray(testsList) ? testsList : []);

            // Extract packages - handle nested structure
            const packagesList = packagesData?.data || packagesData || [];
            setTestPackages(Array.isArray(packagesList) ? packagesList : []);

            // Extract doctors - handle nested structure (same as ReceptionistsContext)
            const doctorsList = doctorsData?.data?.doctors || doctorsData?.data?.data || doctorsData?.data || doctorsData || [];
            setDoctors(Array.isArray(doctorsList) ? doctorsList : []);

            // Extract discounts
            const discountsList = discountsData?.data || discountsData || [];
            setDiscounts(Array.isArray(discountsList) ? discountsList : []);

            console.log('AssignTestModal - Extracted:', { tests: testsList.length, packages: packagesList.length, doctors: doctorsList.length });
        } catch (error) {
            console.error('Error fetching data:', error);
            showToast('Failed to load tests or doctors', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !patient) return null;

    // Filter tests
    const categories = [...new Set(labTests.map(t => t.category).filter(Boolean))];
    const filteredTests = labTests.filter(test => {
        const matchesSearch = !searchTerm ||
            test.testName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            test.category?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !categoryFilter || test.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    // Filter packages
    const filteredPackages = testPackages.filter(pkg => {
        const matchesSearch = !searchTerm ||
            pkg.packageName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pkg.packageCode?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const handleAssignTest = (test) => {
        const testId = test._id || test.id;
        if (!assignedTests.find(t => (t._id || t.id) === testId)) {
            setAssignedTests([...assignedTests, test]);
        }
    };

    const handleRemoveTest = (testId) => {
        setAssignedTests(assignedTests.filter(t => (t._id || t.id) !== testId));
    };

    const handleAssignPackage = (pkg) => {
        const pkgId = pkg._id || pkg.id;
        if (!assignedPackages.find(p => (p._id || p.id) === pkgId)) {
            setAssignedPackages([...assignedPackages, pkg]);
        }
    };

    const handleRemovePackage = (pkgId) => {
        setAssignedPackages(assignedPackages.filter(p => (p._id || p.id) !== pkgId));
    };

    const togglePackageExpansion = (pkgId) => {
        const newExpanded = new Set(expandedPackages);
        if (newExpanded.has(pkgId)) {
            newExpanded.delete(pkgId);
        } else {
            newExpanded.add(pkgId);
        }
        setExpandedPackages(newExpanded);
    };

    // Calculate total from both tests and packages
    const testsTotal = assignedTests.reduce((sum, test) => sum + (test.price || 0), 0);
    const packagesTotal = assignedPackages.reduce((sum, pkg) => sum + (pkg.packagePrice || 0), 0);
    const totalAmount = testsTotal + packagesTotal;

    // Calculate Discount
    let discountAmount = 0;
    if (selectedDiscount) {
        if (selectedDiscount.type === 'PERCENT') {
            discountAmount = (totalAmount * selectedDiscount.value) / 100;
        } else {
            discountAmount = selectedDiscount.value;
        }
        // Cap discount
        if (discountAmount > totalAmount) discountAmount = totalAmount;
    }

    // Round off amounts
    discountAmount = Math.round(discountAmount);
    const finalAmount = Math.round(totalAmount - discountAmount);

    const handleSubmit = async () => {
        if (assignedTests.length === 0 && assignedPackages.length === 0) {
            showToast('Please assign at least one test or package', 'error');
            return;
        }

        // selectedDoctor is now optional

        setSubmitting(true);
        try {
            const patientId = patient._id || patient.id;
            const doctorId = selectedDoctor?._id || selectedDoctor?.id || null;
            const testIds = assignedTests.map(test => test._id || test.id);
            const packageIds = assignedPackages.map(pkg => pkg._id || pkg.id);

            const payload = {
                patientId,
                doctorId,
                testIds,
                packageIds,
                discountId: selectedDiscount?._id || selectedDiscount?.id || null
            };

            console.log('Submitting test order with payload:', payload);

            await createTestOrder(payload);

            showToast(`Tests assigned successfully`, 'success');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Assign test error:', error);
            console.error('Error response:', error.response?.data);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to assign tests';
            showToast(errorMessage, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">Assign Tests</h3>
                        <p className="text-sm text-slate-500">
                            Patient: <span className="font-bold text-indigo-600">{patient.fullName || patient.name}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    {/* Left Panel: Test/Package Selection */}
                    <div className="flex-1 p-6 overflow-y-auto border-r border-slate-100">
                        <div className="mb-4 space-y-3">
                            {/* Tabs */}
                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                <button
                                    onClick={() => setSelectionMode('tests')}
                                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${selectionMode === 'tests'
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <Microscope size={16} /> Individual Tests
                                </button>
                                <button
                                    onClick={() => setSelectionMode('packages')}
                                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${selectionMode === 'packages'
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <Package size={16} /> Test Packages
                                </button>
                            </div>

                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder={selectionMode === 'tests' ? "Search tests..." : "Search packages..."}
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 transition-all"
                                    />
                                </div>
                                {selectionMode === 'tests' && (
                                    <select
                                        value={categoryFilter}
                                        onChange={e => setCategoryFilter(e.target.value)}
                                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 transition-all"
                                    >
                                        <option value="">All Categories</option>
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>

                        {loading ? (
                            <div className="py-10 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                                <p className="text-slate-500 mt-2 text-sm">Loading {selectionMode === 'tests' ? 'tests' : 'packages'}...</p>
                            </div>
                        ) : selectionMode === 'tests' ? (
                            filteredTests.length === 0 ? (
                                <div className="py-10 text-center text-slate-500">
                                    <p>No tests found matching your criteria</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2">
                                    {filteredTests.map(test => {
                                        const testId = test._id || test.id;
                                        const isAssigned = assignedTests.find(t => (t._id || t.id) === testId);
                                        return (
                                            <button
                                                key={testId}
                                                onClick={() => isAssigned ? handleRemoveTest(testId) : handleAssignTest(test)}
                                                className={`p-3 rounded-xl text-left transition-all border group ${isAssigned
                                                    ? 'bg-indigo-50 border-indigo-200 shadow-sm hover:border-red-200 hover:bg-red-50'
                                                    : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className={`font-bold text-sm ${isAssigned ? 'text-indigo-900' : 'text-slate-800'}`}>{test.testName}</p>
                                                        <p className="text-xs text-slate-500">{test.category}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`font-bold text-sm ${isAssigned ? 'text-indigo-700' : 'text-indigo-600'}`}>₹{test.price}</span>
                                                        {isAssigned ? (
                                                            <div className="relative">
                                                                <CheckCircle size={16} className="text-indigo-600 group-hover:hidden" />
                                                                <Trash2 size={16} className="text-red-500 hidden group-hover:block" />
                                                            </div>
                                                        ) : (
                                                            <Plus size={16} className="text-slate-400" />
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )
                        ) : (
                            filteredPackages.length === 0 ? (
                                <div className="py-10 text-center text-slate-500">
                                    <p>No packages found matching your criteria</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {filteredPackages.map(pkg => {
                                        const pkgId = pkg._id || pkg.id;
                                        const isAssigned = assignedPackages.find(p => (p._id || p.id) === pkgId);
                                        const isExpanded = expandedPackages.has(pkgId);
                                        const individualSum = pkg.includedTests?.reduce((sum, t) => sum + (t.testId?.price || 0), 0) || 0;
                                        const savings = individualSum - (pkg.packagePrice || 0);
                                        const savingsPercent = individualSum > 0 ? Math.round((savings / individualSum) * 100) : 0;

                                        return (
                                            <div
                                                key={pkgId}
                                                className={`rounded-xl border transition-all ${isAssigned
                                                    ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                                                    : 'bg-white border-slate-200'
                                                    }`}
                                            >
                                                <div className="p-3">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <Package size={14} className="text-indigo-600" />
                                                                <p className={`font-bold text-sm ${isAssigned ? 'text-indigo-900' : 'text-slate-800'}`}>
                                                                    {pkg.packageName}
                                                                </p>
                                                            </div>
                                                            <p className="text-xs text-slate-500 mt-0.5">{pkg.packageCode}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-xs text-slate-400">{pkg.includedTests?.length || 0} tests</span>
                                                                {savings > 0 && (
                                                                    <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
                                                                        Save {savingsPercent}%
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="text-right">
                                                                <p className={`font-bold text-sm ${isAssigned ? 'text-indigo-700' : 'text-indigo-600'}`}>
                                                                    ₹{pkg.packagePrice}
                                                                </p>
                                                                {savings > 0 && (
                                                                    <p className="text-xs text-slate-400 line-through">₹{individualSum}</p>
                                                                )}
                                                            </div>
                                                            <button
                                                                onClick={() => isAssigned ? handleRemovePackage(pkgId) : handleAssignPackage(pkg)}
                                                                className={`p-1.5 rounded-lg transition-colors ${isAssigned
                                                                    ? 'hover:bg-red-100 text-indigo-600 hover:text-red-600'
                                                                    : 'hover:bg-indigo-100 text-slate-400 hover:text-indigo-600'
                                                                    }`}
                                                            >
                                                                {isAssigned ? <CheckCircle size={16} /> : <Plus size={16} />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Expand/Collapse included tests */}
                                                    {pkg.includedTests && pkg.includedTests.length > 0 && (
                                                        <div className="mt-2">
                                                            <button
                                                                onClick={() => togglePackageExpansion(pkgId)}
                                                                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                                                            >
                                                                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                                                {isExpanded ? 'Hide' : 'Show'} included tests
                                                            </button>
                                                            {isExpanded && (
                                                                <div className="mt-2 space-y-1 pl-4 border-l-2 border-indigo-200">
                                                                    {pkg.includedTests.map((test, idx) => (
                                                                        <div key={idx} className="text-xs text-slate-600 flex justify-between">
                                                                            <span>• {test.testId?.testName || 'Unknown Test'}</span>
                                                                            <span className="text-slate-400">₹{test.testId?.price || 0}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )
                        )}
                    </div>

                    {/* Right Panel: Doctor & Summary */}
                    <div className="w-full lg:w-80 bg-slate-50 p-6 overflow-y-auto flex flex-col gap-6">
                        {/* Doctor Selection */}
                        <div className="space-y-3">
                            <h4 className="font-bold text-sm text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                <Stethoscope size={16} /> Select Doctor
                            </h4>
                            <select
                                value={selectedDoctor?._id || selectedDoctor?.id || ''}
                                onChange={e => {
                                    const doctor = doctors.find(d => (d._id || d.id) === e.target.value);
                                    setSelectedDoctor(doctor || null);
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 transition-all"
                            >
                                <option value="">-- Select Doctor (Optional) --</option>
                                {doctors.map(d => (
                                    <option key={d._id || d.id} value={d._id || d.id}>
                                        {d.fullName || d.name}
                                    </option>
                                ))}
                            </select>
                            {selectedDoctor && (
                                <div className="p-3 bg-white border border-green-200 rounded-lg flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs">
                                        {(selectedDoctor.fullName || selectedDoctor.name)?.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-xs text-slate-800 truncate">{selectedDoctor.fullName || selectedDoctor.name}</p>
                                        <p className="text-[10px] text-slate-500 truncate">{selectedDoctor.specialization || 'General'}</p>
                                    </div>
                                    <CheckCircle size={14} className="text-green-600" />
                                </div>
                            )}
                        </div>

                        {/* Discount Selection */}
                        <div className="space-y-3 pt-4 border-t border-slate-200">
                            <h4 className="font-bold text-sm text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                <AlertCircle size={16} /> Apply Discount
                            </h4>
                            <select
                                value={selectedDiscount?._id || selectedDiscount?.id || ''}
                                onChange={e => {
                                    const discount = discounts.find(d => (d._id || d.id) === e.target.value);
                                    setSelectedDiscount(discount || null);
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 transition-all"
                            >
                                <option value="">-- No Discount --</option>
                                {discounts.map(d => (
                                    <option key={d._id || d.id} value={d._id || d.id}>
                                        {d.name} ({d.type === 'PERCENT' ? `${d.value}%` : `₹${d.value}`} Off)
                                    </option>
                                ))}
                            </select>
                            {selectedDiscount && (
                                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-xs text-indigo-800 tracking-wide uppercase">{selectedDiscount.name}</p>
                                        <p className="text-[10px] text-indigo-600">
                                            {selectedDiscount.type === 'PERCENT' ? `${selectedDiscount.value}% Off` : `Flat ₹${selectedDiscount.value} Off`}
                                        </p>
                                    </div>
                                    <CheckCircle size={14} className="text-indigo-600" />
                                </div>
                            )}
                        </div>

                        {/* Selected Tests & Packages */}
                        <div className="flex-1 flex flex-col min-h-0">
                            <h4 className="font-bold text-sm text-slate-700 uppercase tracking-wider flex items-center gap-2 mb-3">
                                <ShoppingCart size={16} /> Selected Items
                            </h4>

                            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                                {assignedTests.length === 0 && assignedPackages.length === 0 ? (
                                    <div className="text-center py-6 text-slate-400 text-sm">
                                        <p>No items selected</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Assigned Tests */}
                                        {assignedTests.map(test => (
                                            <div key={test._id || test.id} className="bg-white p-2 rounded-lg border border-slate-200 flex justify-between items-center shadow-sm">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1">
                                                        <Microscope size={10} className="text-slate-400" />
                                                        <p className="font-semibold text-xs text-slate-800 truncate">{test.testName}</p>
                                                    </div>
                                                    <p className="text-[10px] text-slate-500">₹{test.price}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveTest(test._id || test.id)}
                                                    className="p-1 text-red-400 hover:bg-red-50 rounded transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}

                                        {/* Assigned Packages */}
                                        {assignedPackages.map(pkg => (
                                            <div key={pkg._id || pkg.id} className="bg-white p-2 rounded-lg border border-indigo-200 flex justify-between items-center shadow-sm">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1">
                                                        <Package size={10} className="text-indigo-600" />
                                                        <p className="font-semibold text-xs text-slate-800 truncate">{pkg.packageName}</p>
                                                    </div>
                                                    <p className="text-[10px] text-indigo-600">₹{pkg.packagePrice} • {pkg.includedTests?.length || 0} tests</p>
                                                </div>
                                                <button
                                                    onClick={() => handleRemovePackage(pkg._id || pkg.id)}
                                                    className="p-1 text-red-400 hover:bg-red-50 rounded transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>

                            {/* Total */}
                            <div className="pt-4 border-t border-slate-200">
                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between items-center text-xs text-slate-500">
                                        <span>Subtotal</span>
                                        <span>₹{totalAmount}</span>
                                    </div>

                                    {selectedDiscount && (
                                        <div className="flex justify-between items-center text-xs text-green-600 font-bold">
                                            <span>Discount ({selectedDiscount.name})</span>
                                            <span>- ₹{discountAmount.toFixed(2)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                                        <span className="text-sm font-bold text-slate-700">Final Amount</span>
                                        <span className="text-lg font-black text-indigo-600">₹{finalAmount.toFixed(2)}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || (assignedTests.length === 0 && assignedPackages.length === 0)}
                                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg hover:shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Save size={16} />
                                            Assign Tests
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignTestModal;
