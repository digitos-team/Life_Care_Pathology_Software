import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import { Building2, Plus, Edit3, Trash2, X, Search, ChevronRight, FlaskConical } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';
import {
    getDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
} from '../../api/admin/department.api';
import DepartmentTests from './DepartmentTests';

const Departments = () => {
    const { showToast } = useToast();

    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // When set, renders DepartmentTests view instead of the list
    const [selectedDepartment, setSelectedDepartment] = useState(null);

    const [formData, setFormData] = useState({ name: '', description: '' });
    const [errors, setErrors] = useState({});

    useEffect(() => { fetchDepartments(); }, []);

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const response = await getDepartments();
            setDepartments(response.data || []);
        } catch (error) {
            console.error('Fetch departments error:', error);
            showToast('Failed to fetch departments', 'error');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Department name is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setSubmitting(true);
        try {
            if (editingDepartment) {
                await updateDepartment(editingDepartment._id, formData);
                showToast('Department updated successfully');
            } else {
                await createDepartment(formData);
                showToast('Department created successfully');
            }
            fetchDepartments();
            resetForm();
        } catch (error) {
            console.error('Submit error:', error);
            showToast(error.response?.data?.message || 'Failed to save department', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', description: '' });
        setEditingDepartment(null);
        setErrors({});
        setShowForm(false);
    };

    const handleEdit = (department) => {
        setEditingDepartment(department);
        setFormData({ name: department.name, description: department.description || '' });
        setShowForm(true);
    };

    const handleDelete = async () => {
        if (!deleteConfirmId) return;
        try {
            await deleteDepartment(deleteConfirmId);
            showToast('Department deleted successfully');
            fetchDepartments();
            setDeleteConfirmId(null);
        } catch (error) {
            console.error('Delete error:', error);
            showToast('Failed to delete department', 'error');
        }
    };

    const filteredDepartments = departments.filter(dept =>
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ── If a department is selected, show its tests view ──────────────────────
    if (selectedDepartment) {
        return (
            <DepartmentTests
                department={selectedDepartment}
                onBack={() => setSelectedDepartment(null)}
            />
        );
    }

    // ── Departments list ───────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">Departments</h2>
                    <p className="text-slate-600 mt-1">Click a department to view its tests</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                    <Plus size={16} />
                    Add Department
                </button>
            </div>

            {/* Search Bar */}
            <div className="flex items-center bg-white rounded-xl p-2 px-4 shadow-sm border border-slate-200">
                <Search className="text-slate-400 mr-2" size={18} />
                <input
                    type="text"
                    placeholder="Search departments..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-slate-600 font-medium placeholder:text-slate-300"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <Card title="Laboratory Departments" icon={Building2} noPadding>
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="text-gray-500 mt-2">Loading departments...</p>
                    </div>
                ) : filteredDepartments.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <Building2 size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No departments found</p>
                        <p className="text-sm text-gray-400 mt-1">
                            {searchTerm ? 'Try adjusting your search' : 'Create your first department to get started'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredDepartments.map((dept) => (
                                    <tr
                                        key={dept._id}
                                        className="hover:bg-indigo-50 cursor-pointer transition-colors group"
                                        onClick={() => setSelectedDepartment(dept)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-200 transition-colors">
                                                    <FlaskConical size={15} className="text-indigo-600" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                                                        {dept.name}
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-0.5">Click to view tests</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{dept.description || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div
                                                className="flex justify-end items-center gap-1"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    onClick={() => handleEdit(dept)}
                                                    className="text-indigo-600 hover:text-indigo-900 p-1.5 hover:bg-indigo-100 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit3 size={15} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirmId(dept._id)}
                                                    className="text-red-600 hover:text-red-900 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                                <ChevronRight size={15} className="text-gray-300 ml-1 group-hover:text-indigo-400 transition-colors" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Add / Edit Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h3 className="text-lg font-semibold">
                                {editingDepartment ? 'Edit Department' : 'New Department'}
                            </h3>
                            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className={`w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="e.g. Hematology"
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    rows="3"
                                    placeholder="Optional description"
                                />
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
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
                                    {submitting ? 'Saving...' : (editingDepartment ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <DeleteConfirmModal
                isOpen={!!deleteConfirmId}
                onClose={() => setDeleteConfirmId(null)}
                onConfirm={handleDelete}
                title="Delete Department"
                message="Are you sure you want to delete this department? This action cannot be undone."
            />
        </div>
    );
};

export default Departments;
