import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import { Stethoscope, Plus, Edit3, Trash2, X } from 'lucide-react';
import { getDoctors, createDoctor, updateDoctor, deleteDoctor } from '../../api/admin/doctors.api';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { toPascalCase } from '../../utils/formatUtils';
import DoctorCommissionReport from '../../components/DoctorCommissionReport';

const DoctorsSection = () => {
    const { showToast } = useToast();
    const { user } = useAuth();

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    // Commission report view state
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [showCommissionReport, setShowCommissionReport] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        email: '',
        specialization: '',
        degree: '',
        address: '',
        commissionPercentage: ''
    });

    const [formErrors, setFormErrors] = useState({});

    // List state
    const [doctors, setDoctors] = useState([]);
    const [listLoading, setListLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });

    // Fetch doctors on mount
    useEffect(() => {
        fetchDoctors();
    }, [pagination.page]);

    const fetchDoctors = async () => {
        try {
            setListLoading(true);
            const response = await getDoctors({
                page: pagination.page,
                limit: pagination.limit
            });

            if (response.data) {
                // Backend returns { doctors: [], pagination: {} }
                const doctorsList = response.data.doctors || [];
                setDoctors(doctorsList);
                setPagination(prev => ({
                    ...prev,
                    page: response.data.pagination?.currentPage || 1,
                    total: response.data.pagination?.totalRecords || 0,
                    totalPages: response.data.pagination?.totalPages || 1
                }));
            } else {
                setDoctors([]);
            }
        } catch (error) {
            showToast('Failed to fetch doctors', 'error');
            console.error('Fetch doctors error:', error);
        } finally {
            setListLoading(false);
        }
    };

    // Form validation
    const validateForm = () => {
        const errors = {};

        if (!formData.name.trim()) errors.name = 'Doctor name is required';
        if (!formData.mobile.trim()) errors.mobile = 'Mobile number is required';
        if (!formData.specialization.trim()) errors.specialization = 'Specialization is required';

        // Commission validation (0-100)
        if (formData.commissionPercentage === '' || formData.commissionPercentage === null) {
            errors.commissionPercentage = 'Commission percentage is required';
        } else {
            const commission = Number(formData.commissionPercentage);
            if (commission < 0 || commission > 100) {
                errors.commissionPercentage = 'Commission percentage must be between 0 and 100';
            }
        }

        // Email validation (lowercase)
        if (formData.email && formData.email.trim()) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                errors.email = 'Please enter a valid email address';
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
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
                name: formData.name.trim(),
                mobile: formData.mobile.trim(),
                email: formData.email ? formData.email.toLowerCase().trim() : '',
                specialization: formData.specialization.trim(),
                degree: formData.degree ? formData.degree.trim() : '',
                address: formData.address ? formData.address.trim() : '',
                commissionPercentage: Number(formData.commissionPercentage),
                labId: user?.labId
            };

            if (editingDoctor) {
                await updateDoctor(editingDoctor._id || editingDoctor.id, submitData);
                showToast('Doctor updated successfully');
            } else {
                await createDoctor(submitData);
                showToast('Doctor created successfully');
            }

            resetForm();
            fetchDoctors();
        } catch (error) {
            showToast(error.message || 'Failed to save doctor', 'error');
            console.error('Submit doctor error:', error);
        } finally {
            setSubmitting(false);
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            name: '',
            mobile: '',
            email: '',
            specialization: '',
            degree: '',
            address: '',
            commissionPercentage: ''
        });
        setFormErrors({});
        setEditingDoctor(null);
        setShowForm(false);
    };

    // Handle edit
    const handleEdit = (doctor) => {
        setEditingDoctor(doctor);
        setFormData({
            name: doctor.name || '',
            mobile: doctor.mobile || '',
            email: doctor.email || '',
            specialization: doctor.specialization || '',
            degree: doctor.degree || '',
            address: doctor.address || '',
            commissionPercentage: doctor.commissionPercentage?.toString() || doctor.commission?.toString() || ''
        });
        setShowForm(true);
    };

    // Handle delete
    const handleDelete = (doctorId) => {
        setDeleteConfirmId(doctorId);
    };

    const confirmDelete = async () => {
        if (!deleteConfirmId) return;
        try {
            await deleteDoctor(deleteConfirmId);
            showToast('Doctor deleted successfully');
            setDeleteConfirmId(null);
            fetchDoctors();
        } catch (error) {
            showToast('Failed to delete doctor', 'error');
            console.error('Delete doctor error:', error);
        }
    };

    // Handle view commission report
    const handleViewCommission = (doctor) => {
        setSelectedDoctor(doctor);
        setShowCommissionReport(true);
    };

    // Handle back from commission report
    const handleBackFromCommission = () => {
        setShowCommissionReport(false);
        setSelectedDoctor(null);
    };

    return (
        <div className="space-y-6">
            {/* Show Commission Report Component if a doctor is selected */}
            {showCommissionReport && selectedDoctor ? (
                <DoctorCommissionReport
                    doctor={selectedDoctor}
                    onBack={handleBackFromCommission}
                />
            ) : (
                <>
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-black text-slate-800">Doctor Management</h2>
                            <p className="text-slate-600 mt-1">Manage doctor profiles and commission settings</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                            <div className="text-sm text-blue-600 font-medium">Total Doctors</div>
                            <div className="text-lg font-bold text-blue-700">
                                {pagination.total}
                            </div>
                        </div>
                    </div>

                    {/* Add Doctor Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                        >
                            <Plus size={16} />
                            Add Doctor
                        </button>
                    </div>

                    {/* Doctor Form Modal */}
                    {showForm && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                                <div className="p-6 border-b">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-semibold">
                                            {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
                                        </h3>
                                        <button
                                            onClick={resetForm}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Doctor Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                                onBlur={(e) => setFormData(prev => ({ ...prev, name: toPascalCase(e.target.value) }))}
                                                className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${formErrors.name ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                placeholder="Enter doctor's full name"
                                            />
                                            {formErrors.name && (
                                                <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Mobile Number *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.mobile}
                                                onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                                                className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${formErrors.mobile ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                placeholder="Enter mobile number"
                                            />
                                            {formErrors.mobile && (
                                                <p className="text-red-500 text-xs mt-1">{formErrors.mobile}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                                className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${formErrors.email ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                placeholder="doctor@example.com"
                                            />
                                            {formErrors.email && (
                                                <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">
                                                Email will be stored in lowercase and must be unique
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Commission Percentage *
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.1"
                                                value={formData.commissionPercentage}
                                                onChange={(e) => setFormData(prev => ({ ...prev, commissionPercentage: e.target.value }))}
                                                className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${formErrors.commissionPercentage ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                placeholder="0.0"
                                            />
                                            {formErrors.commissionPercentage && (
                                                <p className="text-red-500 text-xs mt-1">{formErrors.commissionPercentage}</p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">
                                                Percentage must be between 0 and 100
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Specialization *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.specialization}
                                                onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                                                className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${formErrors.specialization ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                placeholder="e.g., Cardiology, General Medicine"
                                            />
                                            {formErrors.specialization && (
                                                <p className="text-red-500 text-xs mt-1">{formErrors.specialization}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Degree
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.degree}
                                                onChange={(e) => setFormData(prev => ({ ...prev, degree: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="e.g., MD, MBBS, MS"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Address
                                        </label>
                                        <textarea
                                            value={formData.address}
                                            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                            rows="3"
                                            placeholder="Clinic/Hospital address"
                                        />
                                    </div>

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
                                            {submitting ? 'Saving...' : (editingDoctor ? 'Update Doctor' : 'Create Doctor')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Doctors Table */}
                    <Card title="Registered Doctors" icon={Stethoscope} noPadding>
                        {listLoading ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                                <p className="text-gray-500 mt-2">Loading doctors...</p>
                            </div>
                        ) : doctors.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Stethoscope size={48} className="mx-auto mb-4 opacity-50" />
                                <p>No doctors registered</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    Add your first doctor to get started
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Doctor ID
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Name & Contact
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Specialization
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Degree
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Commission
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {doctors.map((doctor) => (
                                                <tr key={doctor._id || doctor.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                                                        {doctor._id ? doctor._id.slice(-8) : (doctor.id || 'N/A')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <button
                                                            onClick={() => handleViewCommission(doctor)}
                                                            className="text-left group"
                                                        >
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 hover:underline transition-colors">
                                                                    {doctor.name}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {doctor.mobile}
                                                                </div>
                                                                {doctor.email && (
                                                                    <div className="text-xs text-gray-400">
                                                                        {doctor.email}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {doctor.specialization}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {doctor.degree || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                                                        {doctor.commissionPercentage || doctor.commission || 0}%
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex justify-end space-x-2">
                                                            <button
                                                                onClick={() => handleEdit(doctor)}
                                                                className="text-indigo-600 hover:text-indigo-900"
                                                                title="Edit Doctor"
                                                            >
                                                                <Edit3 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(doctor._id || doctor.id)}
                                                                className="text-red-600 hover:text-red-900"
                                                                title="Delete Doctor"
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

                                {/* Pagination */}
                                {pagination.totalPages > 1 && (
                                    <div className="px-6 py-3 border-t border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-gray-700">
                                                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                                                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                                                {pagination.total} results
                                            </div>
                                            <div className="flex space-x-1">
                                                <button
                                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                                    disabled={pagination.page === 1}
                                                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                                >
                                                    Previous
                                                </button>
                                                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                                    const pageNum = i + 1;
                                                    return (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                                                            className={`px-3 py-1 text-sm border rounded-md ${pagination.page === pageNum
                                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                                : 'border-gray-300 hover:bg-gray-50'
                                                                }`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    );
                                                })}
                                                <button
                                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                                    disabled={pagination.page === pagination.totalPages}
                                                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </Card>

                    {/* Delete Confirmation Modal */}
                    {deleteConfirmId && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-xl">
                                <div className="p-6 text-center">
                                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Trash2 size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Doctor?</h3>
                                    <p className="text-gray-500 mb-6">
                                        Are you sure you want to delete this doctor? This action cannot be undone.
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setDeleteConfirmId(null)}
                                            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={confirmDelete}
                                            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default DoctorsSection;