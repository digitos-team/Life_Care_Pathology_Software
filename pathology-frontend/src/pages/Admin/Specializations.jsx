import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import { Layers, Plus, Edit3, Trash2, Search } from 'lucide-react';
import {
    getAllSpecializations,
    createSpecialization,
    updateSpecialization,
    deleteSpecialization
} from '../../api/admin/specialization.api';
import { useToast } from '../../contexts/ToastContext';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';

const Specializations = () => {
    const { showToast } = useToast();
    const [specializations, setSpecializations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSpec, setEditingSpec] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    // Fetch specializations
    const fetchSpecializations = async () => {
        try {
            setLoading(true);
            const response = await getAllSpecializations();
            // Handle nested data structure
            const data = response.data || response;
            setSpecializations(Array.isArray(data) ? data : []);
        } catch (error) {
            showToast('Failed to fetch specializations', 'error');
            console.error('Fetch specializations error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSpecializations();
    }, []);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle form submit (create or update)
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name.trim()) {
            showToast('Please enter a specialization name', 'error');
            return;
        }

        try {
            if (editingSpec) {
                await updateSpecialization(editingSpec._id, formData);
                showToast('Specialization updated successfully', 'success');
            } else {
                await createSpecialization(formData);
                showToast('Specialization created successfully', 'success');
            }
            setShowModal(false);
            resetForm();
            fetchSpecializations();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to save specialization', 'error');
        }
    };

    // Handle initial edit
    const handleEdit = (spec) => {
        setEditingSpec(spec);
        setFormData({
            name: spec.name,
            description: spec.description || ''
        });
        setShowModal(true);
    };

    // Handle delete
    const handleDelete = (id) => {
        setDeleteConfirmId(id);
    };

    const confirmDelete = async () => {
        if (!deleteConfirmId) return;
        try {
            await deleteSpecialization(deleteConfirmId);
            showToast('Specialization deleted successfully', 'success');
            setDeleteConfirmId(null);
            fetchSpecializations();
        } catch (error) {
            showToast('Failed to delete specialization', 'error');
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            name: '',
            description: ''
        });
        setEditingSpec(null);
    };

    // Filtered specializations
    const filteredSpecs = specializations.filter(spec =>
        spec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spec.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Specializations</h2>
                    <p className="text-slate-500 mt-1 font-medium">Manage medical categories for doctor commissions</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl hover:bg-indigo-700 flex items-center gap-2 font-black transition-all shadow-lg shadow-indigo-200 active:scale-95"
                >
                    <Plus size={20} />
                    Add New
                </button>
            </div>

            {/* Statistics & Search */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 flex items-center bg-white rounded-3xl p-2 pl-6 shadow-sm border border-slate-100">
                    <Search className="text-slate-400 mr-4" size={20} />
                    <input
                        type="text"
                        placeholder="Search specializations..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-slate-600 font-medium placeholder:text-slate-300"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-xl flex items-center justify-between">
                    <div>
                        <p className="text-indigo-100 text-xs font-black uppercase tracking-widest mb-1">Total Categories</p>
                        <h3 className="text-3xl font-black leading-none">{specializations.length}</h3>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                        <Layers size={24} />
                    </div>
                </div>
            </div>

            {/* List */}
            <Card title="Specialization List" icon={Layers} noPadding>
                <div className="min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center pt-24">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                            <p className="text-slate-400 font-bold mt-4">Fetching data...</p>
                        </div>
                    ) : filteredSpecs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center pt-24 text-slate-400">
                            <Layers size={64} className="mb-4 opacity-20" />
                            <p className="font-bold">No categories found</p>
                            <p className="text-sm font-medium mt-1">
                                {searchTerm ? 'Try adjusting your search' : 'Start by adding a new specialization'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                            Specialization Name
                                        </th>
                                        <th className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                            Description
                                        </th>
                                        <th className="px-8 py-5 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                            Doctor Count
                                        </th>
                                        <th className="px-8 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredSpecs.map((spec) => (
                                        <tr key={spec._id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-5 whitespace-nowrap">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                        {spec.name.charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-black text-slate-700">{spec.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-sm font-medium text-slate-500 max-w-xs truncate">
                                                {spec.description || 'No description provided'}
                                            </td>
                                            <td className="px-8 py-5 whitespace-nowrap text-center">
                                                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-black">
                                                    {spec.doctorCount || 0} Docs
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 whitespace-nowrap text-right">
                                                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEdit(spec)}
                                                        className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                        title="Edit Category"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(spec._id)}
                                                        className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                                        title="Delete Category"
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden border border-white">
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-2xl font-black text-slate-800">
                                    {editingSpec ? 'Edit Category' : 'New Category'}
                                </h3>
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                    <Layers size={24} />
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                                        Category Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-[1.25rem] text-slate-700 font-bold placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all"
                                        placeholder="e.g., Hematology"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-[1.25rem] text-slate-700 font-bold placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all"
                                        placeholder="Brief details about this specialized field..."
                                        rows="3"
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-8 py-4 bg-slate-100 text-slate-600 rounded-[1.25rem] font-black active:scale-95 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-8 py-4 bg-indigo-600 text-white rounded-[1.25rem] font-black shadow-lg shadow-indigo-100 active:scale-95 transition-all"
                                    >
                                        {editingSpec ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            <DeleteConfirmModal
                isOpen={!!deleteConfirmId}
                onClose={() => setDeleteConfirmId(null)}
                onConfirm={confirmDelete}
                title="Remove Category"
                message="Are you sure? Removing this specialization might affect existing doctor commission logic."
            />
        </div>
    );
};

export default Specializations;
