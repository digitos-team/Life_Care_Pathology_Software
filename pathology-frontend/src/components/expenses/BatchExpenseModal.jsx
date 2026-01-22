import React, { useState } from 'react';
import { X, Plus, Trash2, Calendar, Upload } from 'lucide-react';

const EXPENSE_CATEGORIES = [
    'LAB_MATERIALS',
    'SALARY',
    // 'COMMISSION',
    'UTILITY',
    'RENT',
    'MISCELLANEOUS'
];

const BatchExpenseModal = ({ onClose, onSubmit, submitting, initialMode = 'daily' }) => {
    // Mode: 'monthly' or 'daily'
    const [mode, setMode] = useState(initialMode);

    // Date Selection
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    );
    const [selectedDate, setSelectedDate] = useState(
        now.toISOString().split('T')[0]
    );

    // Receipt File
    const [receipt, setReceipt] = useState(null);

    // Rows
    const [rows, setRows] = useState([
        { id: 1, title: '', category: 'MISCELLANEOUS', amount: '', quantity: '', unit: '', supplier: '' }
    ]);

    const handleAddRow = () => {
        setRows([...rows, {
            id: Date.now(),
            title: '',
            category: 'MISCELLANEOUS',
            amount: '',
            quantity: '',
            unit: '',
            supplier: ''
        }]);
    };

    const handleRemoveRow = (id) => {
        if (rows.length > 1) {
            setRows(rows.filter(row => row.id !== id));
        }
    };

    const handleChange = (id, field, value) => {
        setRows(rows.map(row =>
            row.id === id ? { ...row, [field]: value } : row
        ));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Basic validation
            if (file.size > 5 * 1024 * 1024) {
                alert("File too large (Max 5MB)");
                return;
            }
            setReceipt(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Filter out empty rows
        const validRows = rows.filter(row => row.title.trim() && row.amount);
        if (validRows.length === 0) return;

        // Prepare Common Date
        let commonDate;
        if (mode === 'daily') {
            commonDate = selectedDate;
        } else {
            // Start of the selected month
            commonDate = `${selectedMonth}-01`;
        }

        // Prepare Data
        const expensesPayload = validRows.map(row => {
            const item = {
                title: row.title,
                category: row.category,
                amount: parseFloat(row.amount),
                date: commonDate
            };

            // Add dynamic fields for LAB_MATERIALS
            if (row.category === 'LAB_MATERIALS') {
                item.quantity = parseFloat(row.quantity) || 0;
                item.unit = row.unit;
                item.supplier = row.supplier;
            }
            return item;
        });

        // Use FormData to send file + data
        const formData = new FormData();
        formData.append('expenses', JSON.stringify(expensesPayload));

        if (receipt) {
            formData.append('receipt', receipt);
        }

        onSubmit(formData);
    };

    // Calculate total
    const totalAmount = rows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col shadow-xl">

                {/* Header */}
                <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Add Expenses</h3>
                        <p className="text-sm text-gray-500">Add one or multiple expenses at once</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 bg-white">

                    {/* Controls Bar */}
                    <div className="flex flex-wrap items-end gap-6 mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
                        {/* Mode Toggle */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Entry Mode</label>
                            <div className="flex bg-white rounded-md border border-gray-300 p-1">
                                <button
                                    type="button"
                                    onClick={() => setMode('daily')}
                                    className={`px-4 py-1.5 text-sm font-medium rounded ${mode === 'daily' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    Daily (Specific Date)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('monthly')}
                                    className={`px-4 py-1.5 text-sm font-medium rounded ${mode === 'monthly' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    Monthly (Bulk)
                                </button>
                            </div>
                        </div>

                        {/* Date Picker */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                {mode === 'daily' ? 'Select Date' : 'Select Month'}
                            </label>
                            {mode === 'daily' ? (
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm w-40"
                                />
                            ) : (
                                <input
                                    type="month"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm w-40"
                                />
                            )}
                        </div>

                        {/* Receipt Upload */}
                        <div className="flex-1">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Common Receipt (Optional)
                            </label>
                            <div className="flex items-center gap-3">
                                <label className="flex items-center px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-white bg-white text-sm text-gray-700 transition-colors">
                                    <Upload size={16} className="mr-2 text-gray-500" />
                                    {receipt ? 'Change File' : 'Upload File'}
                                    <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                                </label>
                                {receipt && (
                                    <span className="text-sm text-gray-600 truncate max-w-[200px] flex items-center bg-green-50 px-2 py-1 rounded text-green-700">
                                        {receipt.name}
                                        <button onClick={() => setReceipt(null)} className="ml-2 text-green-800 hover:text-green-900"><X size={14} /></button>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="py-3 px-4 w-[25%]">Title</th>
                                    <th className="py-3 px-4 w-[15%]">Category</th>
                                    <th className="py-3 px-4 w-[15%] text-right">Amount (₹)</th>
                                    {/* Dynamic Columns Header */}
                                    <th className="py-3 px-4 w-[35%]">Details (For Lab Materials)</th>
                                    <th className="py-3 px-4 w-[5%]"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {rows.map((row, index) => (
                                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-3">
                                            <input
                                                type="text"
                                                value={row.title}
                                                onChange={(e) => handleChange(row.id, 'title', e.target.value)}
                                                placeholder="Expense item"
                                                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                                autoFocus={index === rows.length - 1}
                                            />
                                        </td>
                                        <td className="p-3">
                                            <select
                                                value={row.category}
                                                onChange={(e) => handleChange(row.id, 'category', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
                                            >
                                                {EXPENSE_CATEGORIES.map(cat => (
                                                    <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="p-3">
                                            <input
                                                type="number"
                                                min="0"
                                                value={row.amount}
                                                onChange={(e) => handleChange(row.id, 'amount', e.target.value)}
                                                placeholder="0.00"
                                                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm text-right"
                                            />
                                        </td>
                                        {/* Dynamic Fields */}
                                        <td className="p-3">
                                            {row.category === 'LAB_MATERIALS' ? (
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        placeholder="Qty"
                                                        value={row.quantity}
                                                        onChange={(e) => handleChange(row.id, 'quantity', e.target.value)}
                                                        className="w-20 px-2 py-2 border border-gray-200 rounded-md text-sm"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Unit (e.g. Box)"
                                                        value={row.unit}
                                                        onChange={(e) => handleChange(row.id, 'unit', e.target.value)}
                                                        className="w-24 px-2 py-2 border border-gray-200 rounded-md text-sm"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Supplier"
                                                        value={row.supplier}
                                                        onChange={(e) => handleChange(row.id, 'supplier', e.target.value)}
                                                        className="flex-1 px-2 py-2 border border-gray-200 rounded-md text-sm"
                                                    />
                                                </div>
                                            ) : (
                                                <span className="text-gray-300 text-xs italic pl-2">Not applicable</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-center">
                                            <button
                                                onClick={() => handleRemoveRow(row.id)}
                                                disabled={rows.length === 1}
                                                className="text-gray-400 hover:text-red-500 disabled:opacity-20 transition-colors p-1 rounded-full hover:bg-red-50"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <button
                        onClick={handleAddRow}
                        className="mt-4 flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors px-2 py-1 rounded hover:bg-indigo-50 w-fit"
                    >
                        <Plus size={16} className="mr-1" /> Add Another Row
                    </button>

                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-gray-50 flex justify-between items-center rounded-b-lg">
                    <div className="text-base text-gray-700">
                        Total Amount: <span className="font-bold text-gray-900 text-lg ml-2">₹{totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all"
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || rows.some(r => !r.title || !r.amount)}
                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 font-medium disabled:opacity-50 disabled:shadow-none transition-all"
                        >
                            {submitting ? 'Saving...' : `Save ${rows.length} Items`}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BatchExpenseModal;
