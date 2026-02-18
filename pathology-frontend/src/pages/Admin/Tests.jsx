import React, { useState, useEffect, useMemo } from 'react';
import Card from '../../components/ui/Card';
import { Microscope, Plus, Edit3, Trash2, X, AlertTriangle, Building2, Layers, Search, Filter } from 'lucide-react';
import { getLabTests, createLabTest, updateLabTest, deleteLabTest } from '../../api/admin/labTest.api';
import { getAllSpecializations } from '../../api/admin/specialization.api';
import { getDepartments } from '../../api/admin/department.api';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';

const LabTestManagement = () => {
    const { showToast } = useToast();
    const { user } = useAuth();

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingTest, setEditingTest] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    // Form data
    const [formData, setFormData] = useState({
        testName: '',
        departmentId: '',
        price: '',
        status: 'Active',
        labId: user?.labId,
        parameters: [],
        specializationIds: []
    });

    const [formErrors, setFormErrors] = useState({});
    const [parameterErrors, setParameterErrors] = useState([]);
    const [availableSpecializations, setAvailableSpecializations] = useState([]);
    const [departments, setDepartments] = useState([]);

    // List state
    const [tests, setTests] = useState([]);
    const [listLoading, setListLoading] = useState(true);

    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDeptFilter, setSelectedDeptFilter] = useState('');
    const [specSearch, setSpecSearch] = useState('');

    // Fetch on mount
    useEffect(() => {
        fetchTests();
        fetchSpecializations();
        fetchDepartments();
    }, []);

    const fetchSpecializations = async () => {
        try {
            const response = await getAllSpecializations();
            const data = response.data?.specializations || response.specializations || response.data || response;
            setAvailableSpecializations(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch specializations:', error);
            setAvailableSpecializations([]);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await getDepartments();
            setDepartments(response.data || []);
        } catch (error) {
            console.error('Failed to fetch departments:', error);
            showToast('Failed to fetch departments', 'error');
        }
    };

    const fetchTests = async () => {
        try {
            setListLoading(true);
            const response = await getLabTests();
            setTests(response.data || response.tests || []);
        } catch (error) {
            showToast('Failed to fetch lab tests', 'error');
            console.error('Fetch tests error:', error);
        } finally {
            setListLoading(false);
        }
    };

    // Client-side filtered tests
    const filteredTests = useMemo(() => {
        let result = tests;

        // Filter by department
        if (selectedDeptFilter) {
            result = result.filter(t => {
                const deptId = t.departmentId?._id || t.departmentId;
                return deptId === selectedDeptFilter;
            });
        }

        // Filter by search term
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            result = result.filter(t =>
                t.testName?.toLowerCase().includes(term) ||
                t.departmentId?.name?.toLowerCase().includes(term)
            );
        }

        return result;
    }, [tests, selectedDeptFilter, searchTerm]);

    // Department test counts for the filter dropdown
    const deptTestCounts = useMemo(() => {
        const counts = {};
        tests.forEach(t => {
            const deptId = t.departmentId?._id || t.departmentId;
            const deptName = t.departmentId?.name || 'Unknown';
            if (deptId) {
                if (!counts[deptId]) counts[deptId] = { name: deptName, count: 0 };
                counts[deptId].count++;
            }
        });
        return counts;
    }, [tests]);

    // Form validation
    const validateForm = () => {
        const errors = {};
        const paramErrors = [];

        // Basic validation
        if (!formData.testName?.trim()) errors.testName = 'Test name is required';
        if (!formData.departmentId) errors.departmentId = 'Department is required';
        if (formData.price === '' || Number(formData.price) < 0) {
            errors.price = 'Price must be >= 0';
        }

        // Parameter validation
        if (formData.parameters.length === 0) {
            errors.parameters = 'At least one parameter is required';
        } else {
            formData.parameters.forEach((param, index) => {
                const paramError = {};

                if (!param.name.trim()) paramError.name = 'Parameter name is required';

                const rt = param.resultType || 'NUMERIC';

                // Type-specific validation
                if (rt === 'NUMERIC') {
                    if (!param.unit?.trim()) paramError.unit = 'Unit is required';
                    if (!Array.isArray(param.referenceRanges) || param.referenceRanges.length === 0) {
                        paramError.referenceRanges = 'At least one reference range is required';
                    } else {
                        param.referenceRanges.forEach((range, rangeIndex) => {
                            if (!range.gender) {
                                paramError[`referenceRanges_${rangeIndex}_gender`] = 'Gender is required';
                            }
                            if (range.min === '' || range.max === '') {
                                paramError[`referenceRanges_${rangeIndex}_values`] = 'Min and max values are required';
                            } else if (Number(range.min) >= Number(range.max)) {
                                paramError[`referenceRanges_${rangeIndex}_values`] = 'Min must be less than max';
                            }
                        });
                    }
                } else if (rt === 'UNISEX_NUMERIC') {
                    if (!param.unit?.trim()) paramError.unit = 'Unit is required';
                    if (param.unisexRange?.min === '' || param.unisexRange?.min == null ||
                        param.unisexRange?.max === '' || param.unisexRange?.max == null) {
                        paramError.unisexRange = 'Min and max values are required';
                    } else if (Number(param.unisexRange.min) >= Number(param.unisexRange.max)) {
                        paramError.unisexRange = 'Min must be less than max';
                    }
                } else if (rt === 'COMPARISON') {
                    if (!param.unit?.trim()) paramError.unit = 'Unit is required';
                    const ranges = param.comparisonRanges || [];
                    if (ranges.length === 0) {
                        paramError.comparisonRanges = 'At least one comparison range is required';
                    } else {
                        ranges.forEach((cr, crIdx) => {
                            if (!cr.comparator) paramError[`cr_${crIdx}_comparator`] = 'Comparator is required';
                            if (cr.value === '' || cr.value == null) paramError[`cr_${crIdx}_value`] = 'Threshold value is required';
                        });
                    }
                } else if (rt === 'QUALITATIVE') {
                    if (!Array.isArray(param.qualitativeOptions?.options) || param.qualitativeOptions.options.filter(o => o.trim()).length < 2) {
                        paramError.qualitativeOptions = 'At least 2 options are required';
                    }
                    if (!param.qualitativeOptions?.normalValue?.trim()) {
                        paramError.qualitativeNormal = 'Normal value must be selected';
                    }
                }

                if (Object.keys(paramError).length > 0) {
                    paramErrors[index] = paramError;
                }
            });
        }

        setFormErrors(errors);
        setParameterErrors(paramErrors);

        return Object.keys(errors).length === 0 && paramErrors.length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            showToast('Please correct the form errors', 'error');
            return;
        }

        setSubmitting(true);
        try {
            // Sanitize parameters to ensure data integrity
            const sanitizedParameters = formData.parameters.map(param => {
                const rt = param.resultType || 'NUMERIC';
                const cleanParam = {
                    name: param.name,
                    unit: param.unit,
                    resultType: rt
                };

                if (rt === 'NUMERIC') {
                    cleanParam.referenceRanges = param.referenceRanges.map(r => ({
                        gender: r.gender,
                        min: Number(r.min),
                        max: Number(r.max)
                    }));
                } else if (rt === 'UNISEX_NUMERIC') {
                    cleanParam.unisexRange = {
                        min: Number(param.unisexRange.min),
                        max: Number(param.unisexRange.max)
                    };
                } else if (rt === 'COMPARISON') {
                    cleanParam.comparisonRanges = (param.comparisonRanges || []).map(cr => ({
                        ...(cr.gender ? { gender: cr.gender } : {}),
                        comparator: cr.comparator,
                        value: Number(cr.value)
                    }));
                } else if (rt === 'QUALITATIVE') {
                    cleanParam.qualitativeOptions = {
                        options: param.qualitativeOptions.options.filter(o => o.trim() !== ''),
                        normalValue: param.qualitativeOptions.normalValue
                    };
                }

                return cleanParam;
            });

            const submitData = {
                testName: formData.testName,
                departmentId: formData.departmentId,
                price: Number(formData.price),
                status: formData.status,
                labId: formData.labId,
                parameters: sanitizedParameters,
                specializationIds: formData.specializationIds
            };

            if (editingTest) {
                await updateLabTest(editingTest._id || editingTest.id, submitData);
                showToast('Lab test updated successfully');
            } else {
                await createLabTest(submitData);
                showToast('Lab test created successfully');
            }

            resetForm();
            fetchTests();
        } catch (error) {
            console.error('Submit test error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to save lab test';
            showToast(errorMessage, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            testName: '',
            departmentId: '',
            price: '',
            status: 'Active',
            labId: user?.labId,
            parameters: [],
            specializationIds: []
        });
        setFormErrors({});
        setParameterErrors([]);
        setEditingTest(null);
        setShowForm(false);
    };

    // Parameter management functions
    const addParameter = () => {
        setFormData(prev => ({
            ...prev,
            parameters: [
                ...prev.parameters,
                {
                    name: '',
                    parameterType: 'QUANTITATIVE',
                    unit: '',
                    resultType: 'NUMERIC',
                    referenceRanges: [{ gender: 'Male', min: '', max: '' }],
                    unisexRange: { min: '', max: '' },
                    comparisonRanges: [{ comparator: '<', value: '' }],
                    qualitativeOptions: { options: ['', ''], normalValue: '' }
                }
            ]
        }));
    };

    const removeParameter = (index) => {
        setFormData(prev => ({
            ...prev,
            parameters: prev.parameters.filter((_, i) => i !== index)
        }));
    };

    const updateParameter = (index, path, value) => {
        setFormData(prev => {
            const newParameters = [...(prev.parameters || [])];
            const parts = path.split('.');

            if (parts.length === 1) {
                newParameters[index] = { ...newParameters[index], [path]: value };
            } else if (parts.length === 3 && parts[0] === 'referenceRanges') {
                const rangeIndex = parseInt(parts[1]);
                const rangeField = parts[2];
                const currentRanges = Array.isArray(newParameters[index]?.referenceRanges)
                    ? newParameters[index].referenceRanges
                    : [];
                const newRanges = [...currentRanges];
                if (newRanges[rangeIndex]) {
                    newRanges[rangeIndex] = { ...newRanges[rangeIndex], [rangeField]: value };
                }
                newParameters[index] = { ...newParameters[index], referenceRanges: newRanges };
            }

            return { ...prev, parameters: newParameters };
        });
    };

    const addReferenceRange = (paramIndex) => {
        setFormData(prev => {
            const newParameters = [...(prev.parameters || [])];
            if (!newParameters[paramIndex]) return prev;

            const currentRanges = Array.isArray(newParameters[paramIndex].referenceRanges)
                ? newParameters[paramIndex].referenceRanges
                : [];

            const newRanges = [...currentRanges, { gender: 'Male', min: '', max: '' }];
            newParameters[paramIndex] = { ...newParameters[paramIndex], referenceRanges: newRanges };
            return { ...prev, parameters: newParameters };
        });
    };

    const removeReferenceRange = (paramIndex, rangeIndex) => {
        setFormData(prev => {
            const newParameters = [...(prev.parameters || [])];
            if (!newParameters[paramIndex]) return prev;

            const currentRanges = Array.isArray(newParameters[paramIndex].referenceRanges)
                ? newParameters[paramIndex].referenceRanges
                : [];

            const newRanges = currentRanges.filter((_, i) => i !== rangeIndex);
            newParameters[paramIndex] = { ...newParameters[paramIndex], referenceRanges: newRanges };
            return { ...prev, parameters: newParameters };
        });
    };

    // Handle edit
    const handleEdit = (test) => {
        setEditingTest(test);
        setFormData({
            testName: test.testName || '',
            departmentId: test.departmentId?._id || test.departmentId || '',
            price: test.price?.toString() || '',
            status: test.status || 'Active',
            labId: test.labId || user?.labId,
            parameters: Array.isArray(test.parameters)
                ? test.parameters.map(p => ({
                    ...p,
                    resultType: p.resultType || 'NUMERIC',
                    referenceRanges: Array.isArray(p.referenceRanges) ? p.referenceRanges : [],
                    unisexRange: p.unisexRange || { min: '', max: '' },
                    comparisonRanges: Array.isArray(p.comparisonRanges) && p.comparisonRanges.length > 0 ? p.comparisonRanges : (p.comparisonRange ? [p.comparisonRange] : [{ comparator: '<', value: '' }]),
                    qualitativeOptions: p.qualitativeOptions || { options: ['', ''], normalValue: '' }
                }))
                : [],
            specializationIds: Array.isArray(test.specializations) ? test.specializations.map(s => s._id || s.id) : []
        });
        setShowForm(true);
    };

    // Handle delete
    const handleDelete = (testId) => {
        setDeleteConfirmId(testId);
    };

    const confirmDelete = async () => {
        if (!deleteConfirmId) return;
        try {
            await deleteLabTest(deleteConfirmId);
            showToast('Lab test deleted successfully');
            setDeleteConfirmId(null);
            fetchTests();
        } catch (error) {
            showToast('Failed to delete lab test', 'error');
            console.error('Delete test error:', error);
        }
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">Lab Test Management</h2>
                    <p className="text-slate-600 mt-1">Create and manage laboratory tests with detailed parameters</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                    <Plus size={16} />
                    Add Lab Test
                </button>
            </div>

            {/* Search & Department Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search tests by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select
                        value={selectedDeptFilter}
                        onChange={(e) => setSelectedDeptFilter(e.target.value)}
                        className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium min-w-[220px] appearance-none cursor-pointer"
                    >
                        <option value="">All Departments ({tests.length})</option>
                        {departments.map(dept => (
                            <option key={dept._id} value={dept._id}>
                                {dept.name} ({deptTestCounts[dept._id]?.count || 0})
                            </option>
                        ))}
                    </select>
                </div>
                {(searchTerm || selectedDeptFilter) && (
                    <button
                        onClick={() => { setSearchTerm(''); setSelectedDeptFilter(''); }}
                        className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors text-sm font-medium flex items-center gap-1"
                    >
                        <X size={14} />
                        Clear
                    </button>
                )}
            </div>

            {/* Active filter indicator */}
            {(searchTerm || selectedDeptFilter) && (
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Showing {filteredTests.length} of {tests.length} tests
                    {selectedDeptFilter && departments.find(d => d._id === selectedDeptFilter) && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full normal-case tracking-normal">
                            {departments.find(d => d._id === selectedDeptFilter)?.name}
                        </span>
                    )}
                </div>
            )}

            {/* Test Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold">
                                    {editingTest ? 'Edit Lab Test' : 'Create New Lab Test'}
                                </h3>
                                <button
                                    onClick={resetForm}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Basic Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Test Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.testName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, testName: e.target.value }))}
                                        className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${formErrors.testName ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Enter test name"
                                    />
                                    {formErrors.testName && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.testName}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Department *
                                    </label>
                                    <select
                                        value={formData.departmentId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, departmentId: e.target.value }))}
                                        className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${formErrors.departmentId ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map(dept => (
                                            <option key={dept._id} value={dept._id}>
                                                {dept.name}
                                            </option>
                                        ))}
                                    </select>
                                    {formErrors.departmentId && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.departmentId}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Price (₹) *
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                    className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${formErrors.price ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="0.00"
                                />
                                {formErrors.price && (
                                    <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>
                                )}
                            </div>

                            {/* Specialization Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Layers size={16} /> Assign Specialization (For Doctor Commission)
                                </label>
                                {/* Spec search */}
                                <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-white border border-slate-200 rounded-lg">
                                    <Search size={14} className="text-slate-400 flex-shrink-0" />
                                    <input
                                        type="text"
                                        placeholder="Search specializations..."
                                        value={specSearch}
                                        onChange={(e) => setSpecSearch(e.target.value)}
                                        className="flex-1 text-xs bg-transparent border-none focus:ring-0 text-slate-600 placeholder:text-slate-300"
                                    />
                                    {specSearch && (
                                        <button type="button" onClick={() => setSpecSearch('')} className="text-slate-400 hover:text-slate-600">
                                            <X size={13} />
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[60px]">
                                    {Array.isArray(availableSpecializations) && availableSpecializations
                                        .filter(spec => spec.name.toLowerCase().includes(specSearch.toLowerCase()))
                                        .map(spec => {
                                            const isSelected = formData.specializationIds.includes(spec._id);
                                            return (
                                                <button
                                                    key={spec._id}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            specializationIds: isSelected
                                                                ? prev.specializationIds.filter(id => id !== spec._id)
                                                                : [...prev.specializationIds, spec._id]
                                                        }));
                                                    }}
                                                    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${isSelected
                                                        ? 'bg-indigo-600 text-white shadow-md'
                                                        : 'bg-white text-slate-500 border border-slate-300 hover:border-indigo-400'
                                                        }`}
                                                >
                                                    {spec.name}
                                                </button>
                                            );
                                        })}
                                    {availableSpecializations.filter(s => s.name.toLowerCase().includes(specSearch.toLowerCase())).length === 0 && (
                                        <p className="text-xs text-slate-400 italic">
                                            {specSearch ? 'No specializations match your search' : 'No specializations defined'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Parameters Section */}
                            <div className="border-t pt-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-lg font-medium text-gray-900">Test Parameters</h4>
                                    <button
                                        type="button"
                                        onClick={addParameter}
                                        className="bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 text-sm flex items-center gap-1"
                                    >
                                        <Plus size={14} />
                                        Add Parameter
                                    </button>
                                </div>

                                {formErrors.parameters && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                                        <AlertTriangle size={16} className="text-red-500" />
                                        <p className="text-red-700 text-sm">{formErrors.parameters}</p>
                                    </div>
                                )}

                                <div className="space-y-6">
                                    {formData.parameters.map((parameter, paramIndex) => (
                                        <div key={paramIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                            <div className="flex justify-between items-start mb-4">
                                                <h5 className="font-medium text-gray-900">Parameter {paramIndex + 1}</h5>
                                                <button
                                                    type="button"
                                                    onClick={() => removeParameter(paramIndex)}
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                    title="Remove Parameter"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            {/* Parameter Basic Info */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Parameter Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={parameter.name}
                                                        onChange={(e) => updateParameter(paramIndex, 'name', e.target.value)}
                                                        className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${parameterErrors[paramIndex]?.name ? 'border-red-500' : 'border-gray-300'}`}
                                                        placeholder="e.g., Hemoglobin, Glucose"
                                                    />
                                                    {parameterErrors[paramIndex]?.name && (
                                                        <p className="text-red-500 text-xs mt-1">{parameterErrors[paramIndex].name}</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Unit {(parameter.resultType || 'NUMERIC') !== 'QUALITATIVE' ? '*' : '(optional)'}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={parameter.unit}
                                                        onChange={(e) => updateParameter(paramIndex, 'unit', e.target.value)}
                                                        className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${parameterErrors[paramIndex]?.unit ? 'border-red-500' : 'border-gray-300'}`}
                                                        placeholder="e.g., mg/dL, mmol/L, %"
                                                    />
                                                    {parameterErrors[paramIndex]?.unit && (
                                                        <p className="text-red-500 text-xs mt-1">{parameterErrors[paramIndex].unit}</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Result Type *
                                                    </label>
                                                    <select
                                                        value={parameter.resultType || 'NUMERIC'}
                                                        onChange={(e) => updateParameter(paramIndex, 'resultType', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                                    >
                                                        <option value="NUMERIC">Numeric (Gender-specific)</option>
                                                        <option value="UNISEX_NUMERIC">Numeric (Same for both)</option>
                                                        <option value="COMPARISON">Comparison (&lt; / &gt;)</option>
                                                        <option value="QUALITATIVE">Qualitative (Text)</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* ═══ NUMERIC: Gender-specific ranges ═══ */}
                                            {(parameter.resultType || 'NUMERIC') === 'NUMERIC' && (
                                                <div>
                                                    <div className="flex justify-between items-center mb-3">
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            Reference Ranges *
                                                        </label>
                                                        <button
                                                            type="button"
                                                            onClick={() => addReferenceRange(paramIndex)}
                                                            className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center gap-1"
                                                        >
                                                            <Plus size={14} />
                                                            Add Range
                                                        </button>
                                                    </div>

                                                    {parameterErrors[paramIndex]?.referenceRanges && (
                                                        <p className="text-red-500 text-xs mb-2">{parameterErrors[paramIndex].referenceRanges}</p>
                                                    )}

                                                    <div className="space-y-3">
                                                        {parameter.referenceRanges?.map((range, rangeIndex) => (
                                                            <div key={rangeIndex} className="bg-white rounded-md border p-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-20">
                                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Gender *</label>
                                                                        <select
                                                                            value={range.gender}
                                                                            onChange={(e) => updateParameter(paramIndex, `referenceRanges.${rangeIndex}.gender`, e.target.value)}
                                                                            className={`w-full px-2 py-1 text-xs border rounded focus:ring-indigo-500 focus:border-indigo-500 ${parameterErrors[paramIndex]?.[`referenceRanges_${rangeIndex}_gender`] ? 'border-red-500' : 'border-gray-300'}`}
                                                                        >
                                                                            <option value="Male">Male</option>
                                                                            <option value="Female">Female</option>
                                                                        </select>
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Min - Max *</label>
                                                                        <div className="flex items-center gap-2">
                                                                            <input type="number" step="0.01" value={range.min}
                                                                                onChange={(e) => updateParameter(paramIndex, `referenceRanges.${rangeIndex}.min`, e.target.value)}
                                                                                className={`w-20 px-2 py-1 text-xs border rounded focus:ring-indigo-500 focus:border-indigo-500 ${parameterErrors[paramIndex]?.[`referenceRanges_${rangeIndex}_values`] ? 'border-red-500' : 'border-gray-300'}`}
                                                                                placeholder="Min" />
                                                                            <span className="text-gray-500">-</span>
                                                                            <input type="number" step="0.01" value={range.max}
                                                                                onChange={(e) => updateParameter(paramIndex, `referenceRanges.${rangeIndex}.max`, e.target.value)}
                                                                                className={`w-20 px-2 py-1 text-xs border rounded focus:ring-indigo-500 focus:border-indigo-500 ${parameterErrors[paramIndex]?.[`referenceRanges_${rangeIndex}_values`] ? 'border-red-500' : 'border-gray-300'}`}
                                                                                placeholder="Max" />
                                                                        </div>
                                                                    </div>
                                                                    {parameter.referenceRanges.length > 1 && (
                                                                        <button type="button" onClick={() => removeReferenceRange(paramIndex, rangeIndex)}
                                                                            className="text-red-500 hover:text-red-700 p-1" title="Remove Range">
                                                                            <X size={14} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                {parameterErrors[paramIndex]?.[`referenceRanges_${rangeIndex}_gender`] && (
                                                                    <p className="text-red-500 text-xs mt-1">{parameterErrors[paramIndex][`referenceRanges_${rangeIndex}_gender`]}</p>
                                                                )}
                                                                {parameterErrors[paramIndex]?.[`referenceRanges_${rangeIndex}_values`] && (
                                                                    <p className="text-red-500 text-xs mt-1 px-3">{parameterErrors[paramIndex][`referenceRanges_${rangeIndex}_values`]}</p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* ═══ UNISEX_NUMERIC: Single min-max range ═══ */}
                                            {parameter.resultType === 'UNISEX_NUMERIC' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Normal Range (Both Genders) *</label>
                                                    <div className="bg-white rounded-md border p-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1">
                                                                <label className="block text-xs font-medium text-gray-700 mb-1">Min</label>
                                                                <input type="number" step="0.01"
                                                                    value={parameter.unisexRange?.min ?? ''}
                                                                    onChange={(e) => updateParameter(paramIndex, 'unisexRange', { ...parameter.unisexRange, min: e.target.value })}
                                                                    className={`w-full px-2 py-1 text-xs border rounded ${parameterErrors[paramIndex]?.unisexRange ? 'border-red-500' : 'border-gray-300'}`}
                                                                    placeholder="Min" />
                                                            </div>
                                                            <span className="text-gray-400 font-bold mt-4">—</span>
                                                            <div className="flex-1">
                                                                <label className="block text-xs font-medium text-gray-700 mb-1">Max</label>
                                                                <input type="number" step="0.01"
                                                                    value={parameter.unisexRange?.max ?? ''}
                                                                    onChange={(e) => updateParameter(paramIndex, 'unisexRange', { ...parameter.unisexRange, max: e.target.value })}
                                                                    className={`w-full px-2 py-1 text-xs border rounded ${parameterErrors[paramIndex]?.unisexRange ? 'border-red-500' : 'border-gray-300'}`}
                                                                    placeholder="Max" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {parameterErrors[paramIndex]?.unisexRange && (
                                                        <p className="text-red-500 text-xs mt-1">{parameterErrors[paramIndex].unisexRange}</p>
                                                    )}
                                                </div>
                                            )}

                                            {/* ═══ COMPARISON: Comparator + Value (unisex or gender-specific) ═══ */}
                                            {parameter.resultType === 'COMPARISON' && (() => {
                                                const ranges = parameter.comparisonRanges || [{ comparator: '<', value: '' }];
                                                const isGenderSpecific = ranges.length > 1 || (ranges.length === 1 && ranges[0].gender);
                                                return (
                                                    <div>
                                                        <div className="flex justify-between items-center mb-2">
                                                            <label className="block text-sm font-medium text-gray-700">Comparison Range *</label>
                                                            <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isGenderSpecific}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            // Switch to gender-specific: Male + Female rows
                                                                            const first = ranges[0] || { comparator: '<', value: '' };
                                                                            updateParameter(paramIndex, 'comparisonRanges', [
                                                                                { gender: 'Male', comparator: first.comparator || '<', value: first.value ?? '' },
                                                                                { gender: 'Female', comparator: first.comparator || '<', value: first.value ?? '' }
                                                                            ]);
                                                                        } else {
                                                                            // Switch to unisex: single row without gender
                                                                            const first = ranges[0] || { comparator: '<', value: '' };
                                                                            updateParameter(paramIndex, 'comparisonRanges', [
                                                                                { comparator: first.comparator || '<', value: first.value ?? '' }
                                                                            ]);
                                                                        }
                                                                    }}
                                                                    className="accent-indigo-600"
                                                                />
                                                                <span className="text-gray-600 font-medium">Gender-specific</span>
                                                            </label>
                                                        </div>

                                                        {parameterErrors[paramIndex]?.comparisonRanges && (
                                                            <p className="text-red-500 text-xs mb-2">{parameterErrors[paramIndex].comparisonRanges}</p>
                                                        )}

                                                        <div className="space-y-2">
                                                            {ranges.map((cr, crIdx) => (
                                                                <div key={crIdx} className="bg-white rounded-md border p-3">
                                                                    <div className="flex items-center gap-3">
                                                                        {isGenderSpecific && (
                                                                            <div className="w-20">
                                                                                <label className="block text-xs font-medium text-gray-700 mb-1">Gender</label>
                                                                                <span className="block px-2 py-1 text-xs bg-gray-100 rounded font-bold text-gray-700">{cr.gender}</span>
                                                                            </div>
                                                                        )}
                                                                        <div className="w-24">
                                                                            <label className="block text-xs font-medium text-gray-700 mb-1">Comparator</label>
                                                                            <select
                                                                                value={cr.comparator || '<'}
                                                                                onChange={(e) => {
                                                                                    const newRanges = [...ranges];
                                                                                    newRanges[crIdx] = { ...newRanges[crIdx], comparator: e.target.value };
                                                                                    updateParameter(paramIndex, 'comparisonRanges', newRanges);
                                                                                }}
                                                                                className={`w-full px-2 py-1 text-xs border rounded ${parameterErrors[paramIndex]?.[`cr_${crIdx}_comparator`] ? 'border-red-500' : 'border-gray-300'}`}
                                                                            >
                                                                                <option value="<">&lt; (Less than)</option>
                                                                                <option value="<=">&le; (Less or equal)</option>
                                                                                <option value=">">&gt; (Greater than)</option>
                                                                                <option value=">=">&ge; (Greater or equal)</option>
                                                                            </select>
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <label className="block text-xs font-medium text-gray-700 mb-1">Threshold</label>
                                                                            <input type="number" step="0.01"
                                                                                value={cr.value ?? ''}
                                                                                onChange={(e) => {
                                                                                    const newRanges = [...ranges];
                                                                                    newRanges[crIdx] = { ...newRanges[crIdx], value: e.target.value };
                                                                                    updateParameter(paramIndex, 'comparisonRanges', newRanges);
                                                                                }}
                                                                                className={`w-full px-2 py-1 text-xs border rounded ${parameterErrors[paramIndex]?.[`cr_${crIdx}_value`] ? 'border-red-500' : 'border-gray-300'}`}
                                                                                placeholder="e.g., 140" />
                                                                        </div>
                                                                    </div>
                                                                    {parameterErrors[paramIndex]?.[`cr_${crIdx}_comparator`] && (
                                                                        <p className="text-red-500 text-xs mt-1">{parameterErrors[paramIndex][`cr_${crIdx}_comparator`]}</p>
                                                                    )}
                                                                    {parameterErrors[paramIndex]?.[`cr_${crIdx}_value`] && (
                                                                        <p className="text-red-500 text-xs mt-1">{parameterErrors[paramIndex][`cr_${crIdx}_value`]}</p>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            {/* ═══ QUALITATIVE: Text Options ═══ */}
                                            {parameter.resultType === 'QUALITATIVE' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Result Options *</label>
                                                    <div className="bg-white rounded-md border p-3 space-y-3">
                                                        {(parameter.qualitativeOptions?.options || ['', '']).map((opt, optIndex) => (
                                                            <div key={optIndex} className="flex items-center gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={opt}
                                                                    onChange={(e) => {
                                                                        const newOpts = [...(parameter.qualitativeOptions?.options || [])];
                                                                        newOpts[optIndex] = e.target.value;
                                                                        updateParameter(paramIndex, 'qualitativeOptions', { ...parameter.qualitativeOptions, options: newOpts });
                                                                    }}
                                                                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                                                                    placeholder={`Option ${optIndex + 1} (e.g., ${optIndex === 0 ? 'Present' : 'Absent'})`}
                                                                />
                                                                {(parameter.qualitativeOptions?.options?.length || 0) > 2 && (
                                                                    <button type="button" onClick={() => {
                                                                        const newOpts = (parameter.qualitativeOptions?.options || []).filter((_, i) => i !== optIndex);
                                                                        const currentNormal = parameter.qualitativeOptions?.normalValue;
                                                                        updateParameter(paramIndex, 'qualitativeOptions', {
                                                                            ...parameter.qualitativeOptions,
                                                                            options: newOpts,
                                                                            normalValue: newOpts.includes(currentNormal) ? currentNormal : ''
                                                                        });
                                                                    }} className="text-red-500 hover:text-red-700 p-1">
                                                                        <X size={14} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                        <button type="button" onClick={() => {
                                                            const newOpts = [...(parameter.qualitativeOptions?.options || []), ''];
                                                            updateParameter(paramIndex, 'qualitativeOptions', { ...parameter.qualitativeOptions, options: newOpts });
                                                        }} className="text-indigo-600 hover:text-indigo-700 text-xs flex items-center gap-1">
                                                            <Plus size={12} /> Add Option
                                                        </button>

                                                        <div className="pt-2 border-t">
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">Normal Value *</label>
                                                            <select
                                                                value={parameter.qualitativeOptions?.normalValue || ''}
                                                                onChange={(e) => updateParameter(paramIndex, 'qualitativeOptions', { ...parameter.qualitativeOptions, normalValue: e.target.value })}
                                                                className={`w-full px-2 py-1 text-xs border rounded ${parameterErrors[paramIndex]?.qualitativeNormal ? 'border-red-500' : 'border-gray-300'}`}
                                                            >
                                                                <option value="">Select normal value...</option>
                                                                {(parameter.qualitativeOptions?.options || []).filter(o => o.trim()).map((o, i) => (
                                                                    <option key={i} value={o}>{o}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    {parameterErrors[paramIndex]?.qualitativeOptions && (
                                                        <p className="text-red-500 text-xs mt-1">{parameterErrors[paramIndex].qualitativeOptions}</p>
                                                    )}
                                                    {parameterErrors[paramIndex]?.qualitativeNormal && (
                                                        <p className="text-red-500 text-xs mt-1">{parameterErrors[paramIndex].qualitativeNormal}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {formData.parameters.length === 0 && (
                                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                                    <Microscope size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>No parameters added yet</p>
                                    <p className="text-sm text-gray-400">Click "Add Parameter" to define test parameters</p>
                                </div>
                            )}

                            {/* Form Actions */}
                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Saving...' : (editingTest ? 'Update Test' : 'Create Test')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div >
            )}

            {/* Tests List */}
            <Card title="Lab Tests" icon={Microscope} noPadding>
                {listLoading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="text-gray-500 mt-2">Loading lab tests...</p>
                    </div>
                ) : filteredTests.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <Microscope size={48} className="mx-auto mb-4 opacity-50" />
                        <p>{searchTerm || selectedDeptFilter ? 'No tests match your filters' : 'No lab tests found'}</p>
                        <p className="text-sm text-gray-400 mt-1">
                            {searchTerm || selectedDeptFilter ? 'Try adjusting your search or department filter' : 'Create your first lab test to get started'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Test Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Department
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Parameters
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Specializations
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Price
                                        </th>

                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredTests.map((test) => (
                                        <tr key={test._id || test.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {test.testName}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 flex items-center gap-1 w-fit">
                                                    <Building2 size={12} />
                                                    {test.departmentId?.name || 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {test.parameters?.length || 0} parameters
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {Array.isArray(test.specializations) && test.specializations.map(s => (
                                                        <span key={s._id} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold">
                                                            {s.name}
                                                        </span>
                                                    ))}
                                                    {(!test.specializations || !Array.isArray(test.specializations) || test.specializations.length === 0) && (
                                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold">
                                                            Generalized
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                                                {formatCurrency(test.price)}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(test)}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                        title="Edit Test"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(test._id || test.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Delete Test"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </Card>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={!!deleteConfirmId}
                onClose={() => setDeleteConfirmId(null)}
                onConfirm={confirmDelete}
                title="Delete Lab Test?"
                message="Are you sure you want to delete this lab test? This action cannot be undone."
            />
        </div >
    );
};

export default LabTestManagement;
