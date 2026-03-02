import React, { useState, useEffect, useCallback, useRef } from 'react';
import Card from '../../components/ui/Card';
import { Package, Plus, Edit3, Trash2, X, AlertTriangle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { getTestPackages, createTestPackage, updateTestPackage, deleteTestPackage } from '../../api/admin/testPackage.api';
import { getLabTests } from '../../api/admin/labTest.api';
import { getDepartments } from '../../api/admin/department.api';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';

const TestPackageManagement = () => {
    const { showToast } = useToast();
    const { user } = useAuth();

    // State
    const [packages, setPackages] = useState([]);
    const [tests, setTests] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingPackage, setEditingPackage] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [testSearchTerm, setTestSearchTerm] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        packageName: '',
        packageCode: '',
        description: '',
        departmentId: '',
        includedTests: [],
        isActive: true
    });
    const [formErrors, setFormErrors] = useState({});

    // Pagination state
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const searchDebounceRef = useRef(null);

    useEffect(() => {
        fetchTests();
        fetchDepartments();
    }, []);

    // Re-fetch whenever page changes
    useEffect(() => {
        fetchPackages(page, searchTerm);
    }, [page]);

    const fetchPackages = useCallback(async (currentPage = page, search = searchTerm) => {
        try {
            setLoading(true);
            const params = { page: currentPage, limit };
            if (search?.trim()) params.search = search.trim();

            const response = await getTestPackages(params);
            const payload = response.data;
            if (payload && typeof payload === 'object' && 'data' in payload) {
                setPackages(payload.data || []);
                setTotalRecords(payload.totalRecords || 0);
                setTotalPages(payload.totalPages || 1);
            } else {
                setPackages(Array.isArray(payload) ? payload : []);
            }
        } catch (error) {
            showToast('Failed to fetch test packages', 'error');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [limit]);

    const fetchTests = async () => {
        try {
            // Fetch all tests (no pagination limit) for the form checkboxes
            const response = await getLabTests({ limit: 'all' });
            const payload = response.data;
            if (payload && typeof payload === 'object' && 'data' in payload) {
                setTests(payload.data || []);
            } else {
                setTests(Array.isArray(payload) ? payload : []);
            }
        } catch (error) {
            console.error('Failed to fetch tests:', error);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await getDepartments();
            setDepartments(response.data || []);
        } catch (error) {
            console.error('Failed to fetch departments:', error);
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.packageName?.trim()) errors.packageName = 'Package name is required';
        if (!formData.departmentId) errors.departmentId = 'Department is required';
        // COMMENTED OUT: Package price validation - using calculated sum instead
        // if (formData.packagePrice === '' || Number(formData.packagePrice) < 0) {
        //     errors.packagePrice = 'Package price must be >= 0';
        // }
        if (formData.includedTests.length === 0) {
            errors.includedTests = 'At least one test must be included';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const payload = {
                ...formData,
                packagePrice: calculateIndividualSum(), // Use calculated sum as package price
                labId: user?.labId,
                includedTests: formData.includedTests.map(testId => ({
                    testId,
                    isOptional: false
                }))
            };

            if (editingPackage) {
                await updateTestPackage(editingPackage._id, payload);
                showToast('Package updated successfully', 'success');
            } else {
                await createTestPackage(payload);
                showToast('Package created successfully', 'success');
            }

            resetForm();
            fetchPackages();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to save package', 'error');
            console.error(error);
        }
    };

    const handleEdit = (pkg) => {
        setEditingPackage(pkg);
        setFormData({
            packageName: pkg.packageName,
            packageCode: pkg.packageCode || '',
            description: pkg.description || '',
            departmentId: pkg.departmentId?._id || pkg.departmentId || '',
            // packagePrice: pkg.packagePrice, // COMMENTED OUT: Using calculated sum
            includedTests: pkg.includedTests?.map(t => t.testId?._id || t.testId) || [],
            isActive: pkg.isActive !== false
        });
        setShowForm(true);
    };

    const handleDelete = async (packageId) => {
        try {
            await deleteTestPackage(packageId);
            showToast('Package deleted successfully', 'success');
            fetchPackages();
            setDeleteConfirmId(null);
        } catch (error) {
            showToast('Failed to delete package', 'error');
            console.error(error);
        }
    };

    const resetForm = () => {
        setFormData({
            packageName: '',
            packageCode: '',
            description: '',
            departmentId: '',
            // packagePrice: '', // COMMENTED OUT: Using calculated sum
            includedTests: [],
            isActive: true
        });
        setFormErrors({});
        setEditingPackage(null);
        setShowForm(false);
        setTestSearchTerm('');
    };

    const toggleTestSelection = (testId) => {
        setFormData(prev => ({
            ...prev,
            includedTests: prev.includedTests.includes(testId)
                ? prev.includedTests.filter(id => id !== testId)
                : [...prev.includedTests, testId]
        }));
    };

    const calculateIndividualSum = () => {
        return formData.includedTests.reduce((sum, testId) => {
            const test = tests.find(t => t._id === testId);
            return sum + (test?.price || 0);
        }, 0);
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = setTimeout(() => {
            setPage(1);
            fetchPackages(1, value);
        }, 400);
    };

    const goToPage = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;
        setPage(newPage);
    };

    // Server already filters — packages is the current page result
    const filteredPackages = packages;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <Package className="text-indigo-600" size={32} />
                        Test Packages
                    </h1>
                    <p className="text-slate-500 mt-1">Manage test bundles and packages</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
                >
                    <Plus size={20} />
                    Create Package
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search packages..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
            </div>

            {/* Package List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPackages.map(pkg => (
                        <Card key={pkg._id} className="hover:shadow-xl transition-shadow">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-slate-800">{pkg.packageName}</h3>
                                        {pkg.packageCode && (
                                            <p className="text-sm text-slate-500 font-mono">{pkg.packageCode}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(pkg)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <Edit3 size={18} />
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirmId(pkg._id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                {pkg.description && (
                                    <p className="text-sm text-slate-600 mb-4">{pkg.description}</p>
                                )}

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-t border-slate-100">
                                        <span className="text-sm text-slate-600">Package Price</span>
                                        <span className="text-lg font-bold text-indigo-600">₹{pkg.packagePrice}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600">Individual Sum</span>
                                        <span className="text-sm text-slate-400 line-through">₹{pkg.individualPriceSum}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600">Savings</span>
                                        <span className="text-sm font-bold text-green-600">
                                            ₹{pkg.individualPriceSum - pkg.packagePrice} ({Math.round((1 - pkg.packagePrice / pkg.individualPriceSum) * 100)}%)
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <p className="text-xs text-slate-500 mb-2">Included Tests ({pkg.includedTests?.length || 0})</p>
                                    <div className="flex flex-wrap gap-1">
                                        {pkg.includedTests?.slice(0, 3).map((test, idx) => (
                                            <span key={idx} className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded-md">
                                                {test.testId?.testName || 'Test'}
                                            </span>
                                        ))}
                                        {pkg.includedTests?.length > 3 && (
                                            <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded-md">
                                                +{pkg.includedTests.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2 py-4">
                    <p className="text-sm text-slate-500">
                        Page <span className="font-semibold text-slate-700">{page}</span> of{' '}
                        <span className="font-semibold text-slate-700">{totalPages}</span>
                        {' '}— {totalRecords} total packages
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => goToPage(page - 1)}
                            disabled={page <= 1}
                            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                            .reduce((acc, p, idx, arr) => {
                                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((item, idx) =>
                                item === '...' ? (
                                    <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 text-sm">…</span>
                                ) : (
                                    <button
                                        key={item}
                                        onClick={() => goToPage(item)}
                                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${item === page
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        {item}
                                    </button>
                                )
                            )
                        }

                        <button
                            onClick={() => goToPage(page + 1)}
                            disabled={page >= totalPages}
                            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-slate-800">
                                {editingPackage ? 'Edit Package' : 'Create New Package'}
                            </h2>
                            <button onClick={resetForm} className="p-2 hover:bg-slate-100 rounded-lg">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Package Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.packageName}
                                        onChange={(e) => setFormData({ ...formData, packageName: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        placeholder="e.g., Diabetes Screening Package"
                                    />
                                    {formErrors.packageName && (
                                        <p className="text-red-500 text-sm mt-1">{formErrors.packageName}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Package Code
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.packageCode}
                                        onChange={(e) => setFormData({ ...formData, packageCode: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        placeholder="e.g., DIAB-PKG"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Department *
                                    </label>
                                    <select
                                        value={formData.departmentId}
                                        onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map(dept => (
                                            <option key={dept._id} value={dept._id}>{dept.name}</option>
                                        ))}
                                    </select>
                                    {formErrors.departmentId && (
                                        <p className="text-red-500 text-sm mt-1">{formErrors.departmentId}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    rows="3"
                                    placeholder="Brief description of the package..."
                                />
                            </div>

                            {/* Test Selection */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Included Tests * ({formData.includedTests.length} selected)
                                </label>
                                {/* Search inside test list */}
                                <div className="relative mb-2">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search tests..."
                                        value={testSearchTerm}
                                        onChange={(e) => setTestSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                                <div className="border border-slate-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                                    {tests
                                        .filter(test =>
                                            !testSearchTerm.trim() ||
                                            test.testName?.toLowerCase().includes(testSearchTerm.toLowerCase()) ||
                                            test.testCode?.toLowerCase().includes(testSearchTerm.toLowerCase())
                                        )
                                        .map(test => (
                                            <label key={test._id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.includedTests.includes(test._id)}
                                                    onChange={() => toggleTestSelection(test._id)}
                                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                                />
                                                <div className="flex-1">
                                                    <span className="font-medium text-slate-800">{test.testName}</span>
                                                    <span className="text-sm text-slate-500 ml-2">₹{test.price}</span>
                                                </div>
                                            </label>
                                        ))
                                    }
                                    {tests.filter(test =>
                                        !testSearchTerm.trim() ||
                                        test.testName?.toLowerCase().includes(testSearchTerm.toLowerCase()) ||
                                        test.testCode?.toLowerCase().includes(testSearchTerm.toLowerCase())
                                    ).length === 0 && (
                                            <p className="text-center text-slate-400 py-4 text-sm">No tests found</p>
                                        )}
                                </div>
                                {formErrors.includedTests && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.includedTests}</p>
                                )}
                            </div>

                            {/* Pricing */}
                            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-700">Package Price (Auto-calculated)</span>
                                    <span className="text-lg font-bold text-indigo-600">₹{calculateIndividualSum()}</span>
                                </div>
                                <p className="text-xs text-slate-500">
                                    Package price is automatically set to the sum of included test prices. Discounts can be applied by the receptionist during test assignment.
                                </p>
                                {/* COMMENTED OUT: Manual package price input
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Package Price (Bundled Rate) *
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.packagePrice}
                                        onChange={(e) => setFormData({ ...formData, packagePrice: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Enter package bundled price"
                                        min="0"
                                    />
                                    {formErrors.packagePrice && (
                                        <p className="text-red-500 text-sm mt-1">{formErrors.packagePrice}</p>
                                    )}
                                </div>
                                {formData.packagePrice && calculateIndividualSum() > 0 && (
                                    <div className="flex justify-between items-center text-green-600">
                                        <span className="text-sm font-bold">Savings</span>
                                        <span className="text-lg font-bold">
                                            ₹{calculateIndividualSum() - formData.packagePrice} ({Math.round((1 - formData.packagePrice / calculateIndividualSum()) * 100)}%)
                                        </span>
                                    </div>
                                )}
                                */}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700"
                                >
                                    {editingPackage ? 'Update Package' : 'Create Package'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteConfirmId && (
                <DeleteConfirmModal
                    isOpen={!!deleteConfirmId}
                    onClose={() => setDeleteConfirmId(null)}
                    onConfirm={() => handleDelete(deleteConfirmId)}
                    itemName="test package"
                />
            )}
        </div>
    );
};

export default TestPackageManagement;
