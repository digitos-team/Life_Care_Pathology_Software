import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import { Tag, Plus, Edit3, Trash2, Percent, DollarSign } from 'lucide-react';
import { getDiscounts, createDiscount, toggleDiscountStatus, deleteDiscount } from '../../api/admin/discounts.api';
import { useToast } from '../../contexts/ToastContext';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';

const Discounts = () => {
    const { showToast } = useToast();
    const [discounts, setDiscounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'PERCENT',
        value: '',
        isActive: true,
        isDefault: false
    });

    // Fetch discounts
    const fetchDiscounts = async () => {
        try {
            setLoading(true);
            const response = await getDiscounts(false);
            // Handle nested data structure from ApiResponse
            const data = response.data || response;
            setDiscounts(Array.isArray(data) ? data : []);
        } catch (error) {
            showToast('Failed to fetch discounts', 'error');
            console.error('Fetch discounts error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDiscounts();
    }, []);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handle form submit (create or update)
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name.trim()) {
            showToast('Please enter a discount name', 'error');
            return;
        }
        if (!formData.value || formData.value <= 0) {
            showToast('Please enter a valid discount value', 'error');
            return;
        }
        if (formData.type === 'PERCENT' && formData.value > 100) {
            showToast('Percentage discount cannot exceed 100%', 'error');
            return;
        }

        try {
            const payload = {
                name: formData.name,
                description: formData.description,
                type: formData.type,
                value: parseFloat(formData.value),
                isActive: formData.isActive,
                isDefault: formData.isDefault
            };

            await createDiscount(payload);
            showToast('Discount created successfully', 'success');
            setShowModal(false);
            resetForm();
            fetchDiscounts();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to create discount', 'error');
        }
    };

    // Handle toggle active status
    const handleToggleStatus = async (discountId, currentStatus) => {
        try {
            await toggleDiscountStatus(discountId, !currentStatus);
            showToast(`Discount ${!currentStatus ? 'activated' : 'deactivated'} successfully`, 'success');
            fetchDiscounts();
        } catch (error) {
            showToast('Failed to update discount status', 'error');
        }
    };

    // Handle delete
    const handleDelete = (discountId) => {
        setDeleteConfirmId(discountId);
    };

    const confirmDelete = async () => {
        if (!deleteConfirmId) return;
        try {
            await deleteDiscount(deleteConfirmId);
            showToast('Discount deleted successfully', 'success');
            setDeleteConfirmId(null);
            fetchDiscounts();
        } catch (error) {
            showToast('Failed to delete discount', 'error');
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            type: 'PERCENT',
            value: '',
            isActive: true,
            isDefault: false
        });
        setEditingDiscount(null);
    };

    // Format discount display
    const formatDiscountValue = (type, value) => {
        return type === 'PERCENT' ? `${value}%` : `₹${value}`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Discount Management</h2>
                    <p className="text-slate-600 mt-1">Create and manage discounts for your lab</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-medium border border-indigo-700"
                >
                    <Plus size={16} />
                    Add Discount
                </button>
            </div>

            {/* Discounts List */}
            <Card title="Discounts" icon={Tag} noPadding>
                <div className="min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center pt-24">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            <p className="text-gray-500 mt-2">Loading discounts...</p>
                        </div>
                    ) : discounts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center pt-24 text-gray-500">
                            <Tag size={48} className="mb-4 opacity-50" />
                            <p>No discounts found</p>
                            <p className="text-sm text-gray-400 mt-1">
                                Create your first discount to get started
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Description
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Value
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {discounts.map((discount) => (
                                        <tr key={discount._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {discount.name}
                                                {discount.isDefault && (
                                                    <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                        Default
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {discount.description || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    {discount.type === 'PERCENT' ? (
                                                        <><Percent size={14} /> Percentage</>
                                                    ) : (
                                                        <><DollarSign size={14} /> Fixed</>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600">
                                                {formatDiscountValue(discount.type, discount.value)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <button
                                                    onClick={() => handleToggleStatus(discount._id, discount.isActive)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${discount.isActive ? 'bg-emerald-600' : 'bg-gray-300'
                                                        }`}
                                                >
                                                    <span
                                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${discount.isActive ? 'translate-x-6' : 'translate-x-1'
                                                            }`}
                                                    />
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleDelete(discount._id)}
                                                        className="text-red-600 hover:text-red-900"
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
                    )}
                </div>
            </Card>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">
                                {editingDiscount ? 'Edit Discount' : 'Add New Discount'}
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Discount Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="e.g., Senior Citizen Discount"
                                        required
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Optional description"
                                        rows="2"
                                    />
                                </div>

                                {/* Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Discount Type *
                                    </label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="PERCENT">Percentage (%)</option>
                                        <option value="FLAT">Fixed Amount (₹)</option>
                                    </select>
                                </div>

                                {/* Value */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Discount Value *
                                    </label>
                                    <input
                                        type="number"
                                        name="value"
                                        value={formData.value}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder={formData.type === 'PERCENT' ? 'e.g., 10' : 'e.g., 100'}
                                        min="0"
                                        max={formData.type === 'PERCENT' ? '100' : undefined}
                                        step="0.01"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formData.type === 'PERCENT'
                                            ? 'Enter percentage (0-100)'
                                            : 'Enter fixed amount in rupees'}
                                    </p>
                                </div>

                                {/* Active Status */}
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label className="ml-2 block text-sm text-gray-700">
                                        Active (discount is applicable)
                                    </label>
                                </div>

                                {/* Default Status */}
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="isDefault"
                                        checked={formData.isDefault}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label className="ml-2 block text-sm text-gray-700">
                                        Set as default discount
                                    </label>
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            resetForm();
                                        }}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                    >
                                        {editingDiscount ? 'Update' : 'Create'} Discount
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={!!deleteConfirmId}
                onClose={() => setDeleteConfirmId(null)}
                onConfirm={confirmDelete}
                title="Delete Discount?"
                message="Are you sure you want to delete this discount? This action cannot be undone."
            />
        </div>
    );
};

export default Discounts;
