import React, { useState } from 'react';
import { X } from 'lucide-react';

const EXPENSE_CATEGORIES = [
    'LAB_MATERIALS',
    'SALARY',
    'COMMISSION',
    'UTILITY',
    'RENT',
    'MISCELLANEOUS'
];

const EditExpenseModal = ({ expense, onClose, onSubmit, submitting }) => {
    const [formData, setFormData] = useState({
        title: expense.title || '',
        category: expense.category || 'MISCELLANEOUS',
        amount: expense.amount || '',
        date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
        quantity: expense.quantity || '',
        unit: expense.unit || '',
        supplier: expense.supplier || ''
    });

    const [errors, setErrors] = useState({});

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.category) newErrors.category = 'Category is required';
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            newErrors.amount = 'Amount must be greater than 0';
        }
        if (!formData.date) newErrors.date = 'Date is required';

        // Validate LAB_MATERIALS specific fields
        if (formData.category === 'LAB_MATERIALS') {
            if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
                newErrors.quantity = 'Quantity is required for lab materials';
            }
            if (!formData.unit.trim()) {
                newErrors.unit = 'Unit is required for lab materials';
            }
            if (!formData.supplier.trim()) {
                newErrors.supplier = 'Supplier is required for lab materials';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;

        const payload = {
            title: formData.title,
            category: formData.category,
            amount: parseFloat(formData.amount),
            date: formData.date
        };

        // Add LAB_MATERIALS specific fields
        if (formData.category === 'LAB_MATERIALS') {
            payload.quantity = parseFloat(formData.quantity);
            payload.unit = formData.unit;
            payload.supplier = formData.supplier;
        }

        onSubmit(payload);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Edit Expense</h3>
                        <p className="text-sm text-gray-500">Update expense details</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${errors.title ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="Expense title"
                        />
                        {errors.title && (
                            <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                        )}
                    </div>

                    {/* Category and Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category *
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => handleChange('category', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${errors.category ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            >
                                {EXPENSE_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>
                                        {cat.replace('_', ' ')}
                                    </option>
                                ))}
                            </select>
                            {errors.category && (
                                <p className="text-red-500 text-xs mt-1">{errors.category}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date *
                            </label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => handleChange('date', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${errors.date ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            {errors.date && (
                                <p className="text-red-500 text-xs mt-1">{errors.date}</p>
                            )}
                        </div>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amount (₹) *
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => handleChange('amount', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${errors.amount ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="0.00"
                        />
                        {errors.amount && (
                            <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
                        )}
                    </div>

                    {/* Lab Materials Specific Fields */}
                    {formData.category === 'LAB_MATERIALS' && (
                        <div className="border-t pt-4 space-y-4">
                            <h4 className="text-sm font-semibold text-gray-700">Lab Materials Details</h4>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Quantity *
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.quantity}
                                        onChange={(e) => handleChange('quantity', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${errors.quantity ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="0"
                                    />
                                    {errors.quantity && (
                                        <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Unit *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.unit}
                                        onChange={(e) => handleChange('unit', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${errors.unit ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="e.g., Box, Bottle, Pack"
                                    />
                                    {errors.unit && (
                                        <p className="text-red-500 text-xs mt-1">{errors.unit}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Supplier *
                                </label>
                                <input
                                    type="text"
                                    value={formData.supplier}
                                    onChange={(e) => handleChange('supplier', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${errors.supplier ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Supplier name"
                                />
                                {errors.supplier && (
                                    <p className="text-red-500 text-xs mt-1">{errors.supplier}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all"
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 font-medium disabled:opacity-50 disabled:shadow-none transition-all"
                        >
                            {submitting ? 'Updating...' : 'Update Expense'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditExpenseModal;
