import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import { Microscope, Plus, Edit3, Trash2, X, AlertTriangle, Building2, Layers } from 'lucide-react';
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
                if (!param.unit.trim()) paramError.unit = 'Unit is required';

                // Reference ranges validation
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
            const submitData = {
                testName: formData.testName,
                departmentId: formData.departmentId,
                price: Number(formData.price),
                status: formData.status,
                labId: formData.labId,
                parameters: formData.parameters,
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
            showToast(error.message || 'Failed to save lab test', 'error');
            console.error('Submit test error:', error);
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
                    unit: '',
                    referenceRanges: [{ gender: 'Male', min: '', max: '' }]
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
            departmentId: test.departmentId?._id || test.departmentId || '', // Handle populated or raw ID
            price: test.price?.toString() || '',
            status: test.status || 'Active',
            labId: test.labId || user?.labId,
            parameters: Array.isArray(test.parameters)
                ? test.parameters.map(p => ({
                    ...p,
                    referenceRanges: Array.isArray(p.referenceRanges) ? p.referenceRanges : []
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
                                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[60px]">
                                    {Array.isArray(availableSpecializations) && availableSpecializations.map(spec => {
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
                                    {availableSpecializations.length === 0 && (
                                        <p className="text-xs text-slate-400 italic">No specializations defined</p>
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
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Parameter Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={parameter.name}
                                                        onChange={(e) => updateParameter(paramIndex, 'name', e.target.value)}
                                                        className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${parameterErrors[paramIndex]?.name ? 'border-red-500' : 'border-gray-300'
                                                            }`}
                                                        placeholder="e.g., Hemoglobin, Glucose"
                                                    />
                                                    {parameterErrors[paramIndex]?.name && (
                                                        <p className="text-red-500 text-xs mt-1">{parameterErrors[paramIndex].name}</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Unit *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={parameter.unit}
                                                        onChange={(e) => updateParameter(paramIndex, 'unit', e.target.value)}
                                                        className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${parameterErrors[paramIndex]?.unit ? 'border-red-500' : 'border-gray-300'
                                                            }`}
                                                        placeholder="e.g., mg/dL, mmol/L, %"
                                                    />
                                                    {parameterErrors[paramIndex]?.unit && (
                                                        <p className="text-red-500 text-xs mt-1">{parameterErrors[paramIndex].unit}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Reference Ranges */}
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
                                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                        Gender *
                                                                    </label>
                                                                    <select
                                                                        value={range.gender}
                                                                        onChange={(e) => updateParameter(paramIndex, `referenceRanges.${rangeIndex}.gender`, e.target.value)}
                                                                        className={`w-full px-2 py-1 text-xs border rounded focus:ring-indigo-500 focus:border-indigo-500 ${parameterErrors[paramIndex]?.[`referenceRanges_${rangeIndex}_gender`] ? 'border-red-500' : 'border-gray-300'
                                                                            }`}
                                                                    >
                                                                        <option value="Male">Male</option>
                                                                        <option value="Female">Female</option>
                                                                    </select>
                                                                </div>

                                                                <div className="flex-1">
                                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                        Min - Max *
                                                                    </label>
                                                                    <div className="flex items-center gap-2">
                                                                        <input
                                                                            type="number"
                                                                            step="0.01"
                                                                            value={range.min}
                                                                            onChange={(e) => updateParameter(paramIndex, `referenceRanges.${rangeIndex}.min`, e.target.value)}
                                                                            className={`w-20 px-2 py-1 text-xs border rounded focus:ring-indigo-500 focus:border-indigo-500 ${parameterErrors[paramIndex]?.[`referenceRanges_${rangeIndex}_values`] ? 'border-red-500' : 'border-gray-300'
                                                                                }`}
                                                                            placeholder="Min"
                                                                        />
                                                                        <span className="text-gray-500">-</span>
                                                                        <input
                                                                            type="number"
                                                                            step="0.01"
                                                                            value={range.max}
                                                                            onChange={(e) => updateParameter(paramIndex, `referenceRanges.${rangeIndex}.max`, e.target.value)}
                                                                            className={`w-20 px-2 py-1 text-xs border rounded focus:ring-indigo-500 focus:border-indigo-500 ${parameterErrors[paramIndex]?.[`referenceRanges_${rangeIndex}_values`] ? 'border-red-500' : 'border-gray-300'
                                                                                }`}
                                                                            placeholder="Max"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {parameter.referenceRanges.length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeReferenceRange(paramIndex, rangeIndex)}
                                                                        className="text-red-500 hover:text-red-700 p-1"
                                                                        title="Remove Range"
                                                                    >
                                                                        <X size={14} />
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {/* Error messages for this range */}
                                                            {parameterErrors[paramIndex]?.[`referenceRanges_${rangeIndex}_gender`] && (
                                                                <p className="text-red-500 text-xs mt-1">
                                                                    {parameterErrors[paramIndex][`referenceRanges_${rangeIndex}_gender`]}
                                                                </p>
                                                            )}
                                                            {parameterErrors[paramIndex]?.[`referenceRanges_${rangeIndex}_values`] && (
                                                                <p className="text-red-500 text-xs mt-1 px-3">
                                                                    {parameterErrors[paramIndex][`referenceRanges_${rangeIndex}_values`]}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
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
                ) : tests.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <Microscope size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No lab tests found</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Create your first lab test to get started
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
                                    {tests.map((test) => (
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
