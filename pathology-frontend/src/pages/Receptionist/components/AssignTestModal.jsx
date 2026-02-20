import React, { useState, useEffect } from 'react';
import { X, Save, Microscope, Search, Plus, CheckCircle, Trash2, Stethoscope, AlertCircle, ShoppingCart, Package, ChevronDown, ChevronUp, Building2 } from 'lucide-react';
import { getTestsGroupedByDepartment } from '../../../api/receptionist/labtest.api';
import { createTestOrder, getDoctors } from '../../../api/receptionist/testorder.api';
import { getDiscounts } from '../../../api/admin/discounts.api';
import { getTestPackages } from '../../../api/admin/testPackage.api';
import { useToast } from '../../../contexts/ToastContext';

const AssignTestModal = ({ isOpen, onClose, patient, onSuccess }) => {
    const { showToast } = useToast();

    // Data State
    const [departmentGroups, setDepartmentGroups] = useState([]); // Grouped tests by department
    const [testPackages, setTestPackages] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [discounts, setDiscounts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Selection State
    const [selectionMode, setSelectionMode] = useState('tests');
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedDiscount, setSelectedDiscount] = useState(null);
    const [assignedTests, setAssignedTests] = useState([]);
    const [assignedPackages, setAssignedPackages] = useState([]);
    const [expandedPackages, setExpandedPackages] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Accordion State
    const [expandedDepts, setExpandedDepts] = useState(new Set());

    // Reset state when modal opens/closes or patient changes
    useEffect(() => {
        if (isOpen) {
            fetchData();
            setAssignedTests([]);
            setAssignedPackages([]);
            setExpandedPackages(new Set());
            setExpandedDepts(new Set());
            setSelectedDoctor(null);
            setSearchTerm('');
            setDepartmentFilter('');
            setSelectionMode('tests');
        }
    }, [isOpen, patient]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [groupedData, packagesData, doctorsData, discountsData] = await Promise.all([
                getTestsGroupedByDepartment(),
                getTestPackages(),
                getDoctors(),
                getDiscounts(true)
            ]);

            // groupedData = [{ department: { _id, name }, testCount, tests: [...] }]
            const groups = Array.isArray(groupedData) ? groupedData : [];
            setDepartmentGroups(groups);

            const packagesList = packagesData?.data || packagesData || [];
            setTestPackages(Array.isArray(packagesList) ? packagesList : []);

            const doctorsList = doctorsData?.data?.doctors || doctorsData?.data?.data || doctorsData?.data || doctorsData || [];
            setDoctors(Array.isArray(doctorsList) ? doctorsList : []);

            const discountsList = discountsData?.data || discountsData || [];
            setDiscounts(Array.isArray(discountsList) ? discountsList : []);
        } catch (error) {
            console.error('Error fetching data:', error);
            showToast('Failed to load tests or doctors', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !patient) return null;

    // Filter department groups by search and department filter
    const searchLower = searchTerm.toLowerCase();
    const filteredGroups = departmentGroups
        .filter(group => {
            // Department filter
            if (departmentFilter && group.department?._id !== departmentFilter) return false;
            return true;
        })
        .map(group => {
            // Search filter — filter tests within each department
            if (!searchTerm) return group;
            const filteredTests = group.tests.filter(test =>
                test.testName?.toLowerCase().includes(searchLower)
            );
            if (filteredTests.length === 0 && !group.department?.name?.toLowerCase().includes(searchLower)) {
                return null; // Hide department if no matching tests
            }
            return { ...group, tests: filteredTests.length > 0 ? filteredTests : group.tests, testCount: filteredTests.length > 0 ? filteredTests.length : group.testCount };
        })
        .filter(Boolean);

    // Auto-expand departments when searching
    const effectiveExpandedDepts = searchTerm
        ? new Set(filteredGroups.map(g => g.department?._id))
        : expandedDepts;

    // Total test count across all departments
    const totalTestCount = departmentGroups.reduce((sum, g) => sum + (g.testCount || 0), 0);

    // Filter packages
    const filteredPackages = testPackages.filter(pkg => {
        const matchesSearch = !searchTerm ||
            pkg.packageName?.toLowerCase().includes(searchLower) ||
            pkg.packageCode?.toLowerCase().includes(searchLower);
        return matchesSearch;
    });

    // Toggle department accordion
    const toggleDept = (deptId) => {
        setExpandedDepts(prev => {
            const next = new Set(prev);
            if (next.has(deptId)) next.delete(deptId);
            else next.add(deptId);
            return next;
        });
    };

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
        if (discountAmount > totalAmount) discountAmount = totalAmount;
    }

    discountAmount = Math.round(discountAmount);
    const finalAmount = Math.round(totalAmount - discountAmount);

    const handleSubmit = async () => {
        if (assignedTests.length === 0 && assignedPackages.length === 0) {
            showToast('Please assign at least one test or package', 'error');
            return;
        }

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

            await createTestOrder(payload);

            showToast(`Tests assigned successfully`, 'success');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Assign test error:', error);
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
                                    {totalTestCount > 0 && (
                                        <span className="ml-1 px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded text-[10px] font-black">{totalTestCount}</span>
                                    )}
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
                                        value={departmentFilter}
                                        onChange={e => setDepartmentFilter(e.target.value)}
                                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 transition-all"
                                    >
                                        <option value="">All Departments</option>
                                        {departmentGroups.map(group => (
                                            <option key={group.department?._id} value={group.department?._id}>
                                                {group.department?.name} ({group.testCount})
                                            </option>
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
                            filteredGroups.length === 0 ? (
                                <div className="py-10 text-center text-slate-500">
                                    <p>No tests found matching your criteria</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredGroups.map(group => {
                                        const deptId = group.department?._id;
                                        const deptName = group.department?.name || 'Uncategorized';
                                        const isExpanded = effectiveExpandedDepts.has(deptId);
                                        const assignedCount = group.tests.filter(t =>
                                            assignedTests.find(at => (at._id || at.id) === (t._id || t.id))
                                        ).length;

                                        return (
                                            <div key={deptId} className="border border-slate-200 rounded-xl overflow-hidden">
                                                {/* Department Header — Accordion Toggle */}
                                                <button
                                                    onClick={() => toggleDept(deptId)}
                                                    className={`w-full px-4 py-3 flex items-center justify-between transition-all ${isExpanded
                                                        ? 'bg-indigo-50 border-b border-indigo-100'
                                                        : 'bg-white hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Building2 size={16} className={isExpanded ? 'text-indigo-600' : 'text-slate-400'} />
                                                        <span className={`font-bold text-sm ${isExpanded ? 'text-indigo-800' : 'text-slate-700'}`}>
                                                            {deptName}
                                                        </span>
                                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold">
                                                            {group.testCount} tests
                                                        </span>
                                                        {assignedCount > 0 && (
                                                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full text-[10px] font-bold">
                                                                {assignedCount} selected
                                                            </span>
                                                        )}
                                                    </div>
                                                    {isExpanded ? <ChevronUp size={16} className="text-indigo-500" /> : <ChevronDown size={16} className="text-slate-400" />}
                                                </button>

                                                {/* Expanded Tests List */}
                                                {isExpanded && (
                                                    <div className="p-2 space-y-1 bg-slate-50/50">
                                                        {group.tests.map(test => {
                                                            const testId = test._id || test.id;
                                                            const isAssigned = assignedTests.find(t => (t._id || t.id) === testId);
                                                            return (
                                                                <button
                                                                    key={testId}
                                                                    onClick={() => isAssigned ? handleRemoveTest(testId) : handleAssignTest(test)}
                                                                    className={`w-full p-3 rounded-lg text-left transition-all border group ${isAssigned
                                                                        ? 'bg-indigo-50 border-indigo-200 shadow-sm hover:border-red-200 hover:bg-red-50'
                                                                        : 'bg-white border-slate-100 hover:border-indigo-300 hover:shadow-sm'
                                                                        }`}
                                                                >
                                                                    <div className="flex justify-between items-center">
                                                                        <div>
                                                                            <p className={`font-bold text-sm ${isAssigned ? 'text-indigo-900' : 'text-slate-800'}`}>{test.testName}</p>
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
                                                )}
                                            </div>
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
