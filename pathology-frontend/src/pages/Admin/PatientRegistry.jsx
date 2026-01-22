import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import { Database, Edit3, UserPlus, Filter, Upload, Trash2, Users, TrendingUp, Plus, Search, Calendar, X } from 'lucide-react';
import { getPatients, updatePatient, deletePatient } from '../../api/receptionist/patient.api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import AddHistoricalReportModal from '../Receptionist/components/AddHistoricalReportModal';

const PatientRegistry = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    // List state
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });

    // Filters
    const [filters, setFilters] = useState({
        search: '',
        gender: ''
    });

    // Edit Form State
    const [editingPatient, setEditingPatient] = useState(null);
    const [uploadReportPatient, setUploadReportPatient] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Fetch patients
    const fetchPatients = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, value]) => value !== '')
                )
            };

            const response = await getPatients(params);
            const patientsArray = Array.isArray(response.data) ? response.data :
                Array.isArray(response.patients) ? response.patients : [];
            setPatients(patientsArray);
            setPagination(prev => ({
                ...prev,
                total: response.total || 0,
                totalPages: response.totalPages || 0
            }));
        } catch (error) {
            showToast('Failed to fetch patients', 'error');
            console.error('Fetch patients error:', error);
            setPatients([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, [pagination.page, filters]);

    // Handle Edit Submit
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editingPatient) return;

        setSubmitting(true);
        try {
            await updatePatient(editingPatient._id, editingPatient);
            showToast("Patient updated successfully", "success");
            setEditingPatient(null);
            fetchPatients();
        } catch (err) {
            console.error("Error updating patient:", err);
            showToast(err.message || "Failed to update patient", "error");
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Delete
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const handleDeletePatient = async (id) => {
        try {
            await deletePatient(id);
            showToast("Patient deleted successfully", "success");
            setDeleteConfirmId(null);
            fetchPatients();
        } catch (err) {
            console.error("Error deleting patient:", err);
            showToast(err.message || "Failed to delete patient", "error");
        }
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-IN');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                        Patient Records
                    </h2>
                    <p className="text-slate-600 mt-1">
                        Manage all patient records and information
                    </p>
                </div>
                <Card className="w-full sm:w-80">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Total Patients</p>
                            <p className="text-2xl font-bold text-indigo-600 mt-1">
                                {pagination.total}
                            </p>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-lg">
                            <Users className="text-indigo-600" size={24} />
                        </div>
                    </div>
                </Card>
                {/* <button
                    onClick={() => navigate('/patients/add')}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <UserPlus size={18} />
                    Add Patient
                </button> */}
            </div>

            {/* Stats Cards */}
            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> */}
            {/* <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Total Patients</p>
                            <p className="text-2xl font-bold text-indigo-600 mt-1">
                                {pagination.total}
                            </p>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-lg">
                            <Users className="text-indigo-600" size={24} />
                        </div>
                    </div>
                </Card> */}

            {/* <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Monthly Registrations</p>
                            <p className="text-2xl font-bold text-emerald-600 mt-1">
                                {patients.length > 5 ? 'Active' : 'New'}
                            </p>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-lg">
                            <TrendingUp className="text-emerald-600" size={24} />
                        </div>
                    </div>
                </Card> */}

            {/* <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Quick Actions</p>
                            <p className="text-sm font-medium text-slate-500 mt-1 italic">
                                Ready to manage
                            </p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                            <Database className="text-slate-600" size={24} />
                        </div>
                    </div>
                </Card> */}
            {/* </div> */}

            {/* Edit Patient Form */}
            {editingPatient && (
                <Card title="Edit Patient" icon={Edit3}>
                    <form className="space-y-2" onSubmit={handleEditSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <input
                                placeholder="Full Name"
                                value={editingPatient.fullName || ''}
                                onChange={e => setEditingPatient({ ...editingPatient, fullName: e.target.value })}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                required
                            />
                            <input
                                placeholder="Phone Number"
                                value={editingPatient.phone || ''}
                                onChange={e => setEditingPatient({ ...editingPatient, phone: e.target.value })}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <input
                                placeholder="Age"
                                type="number"
                                value={editingPatient.age || ''}
                                onChange={e => setEditingPatient({ ...editingPatient, age: e.target.value })}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                            <select
                                value={editingPatient.gender || ''}
                                onChange={e => setEditingPatient({ ...editingPatient, gender: e.target.value })}
                                className="px-3 py-2 rounded-lg border border-slate-200 font-medium text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 shadow-sm transition-colors"
                            >
                                {submitting ? 'Saving...' : 'Update Patient'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditingPatient(null)}
                                className="flex-1 py-2 px-4 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </Card>
            )}

            {/* Filters */}
            <Card title="Filters" icon={Filter}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Search Records
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name, ID or phone..."
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Gender
                        </label>
                        <select
                            value={filters.gender}
                            onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        >
                            <option value="">All Genders</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={() => setFilters({ search: '', gender: '' })}
                            className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <X size={16} />
                            Clear Filters
                        </button>
                    </div>
                </div>
            </Card>

            {/* Patient List */}
            <Card title="Patient Records" icon={Database} noPadding>
                <div className="min-h-[450px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center pt-24">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            <p className="text-gray-500 mt-2">Loading patients...</p>
                        </div>
                    ) : patients.length === 0 ? (
                        <div className="flex flex-col items-center justify-center pt-24 text-gray-500">
                            <Database size={48} className="mb-4 opacity-50" />
                            <p className="text-sm font-medium">No patients found</p>
                            <p className="text-xs text-gray-400 mt-1">
                                {Object.values(filters).some(v => v !== '') ? 'Try adjusting your filters' : 'Patient records will appear here'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-base">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                                                Patient ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                                                Patient Info
                                            </th>
                                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                                                Contact
                                            </th>
                                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                                                Last Updated
                                            </th>
                                            <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {(Array.isArray(patients) ? patients : []).map((patient) => (
                                            <tr key={patient._id || patient.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-indigo-600">
                                                    {patient.patientId || (patient._id ? patient._id.slice(-8) : (patient.id || 'N/A'))}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div
                                                        onClick={() => navigate(`/patient/${patient._id || patient.id}`)}
                                                        className="cursor-pointer group"
                                                    >
                                                        <div className="text-base font-semibold text-gray-900 group-hover:text-indigo-600">
                                                            {patient.fullName || patient.name || 'Unknown'}
                                                        </div>
                                                        <div className="text-sm text-gray-500 mt-1">
                                                            {patient.age ? `${patient.age} years` : ''} • {patient.gender || 'N/A'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-base text-gray-600">
                                                    <div className="font-medium">{patient.phone || '-'}</div>
                                                    {patient.email && (
                                                        <div className="text-sm text-gray-400 mt-1">{patient.email}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-base text-gray-500">
                                                    {formatDate(patient.updatedAt || patient.createdAt)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-base font-medium">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <button
                                                            onClick={() => setUploadReportPatient(patient)}
                                                            className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Upload Historical Report"
                                                        >
                                                            <Upload size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingPatient(patient)}
                                                            className="text-indigo-600 hover:text-indigo-900 p-2 hover:bg-indigo-50 rounded-lg transition-colors"
                                                            title="Edit Patient"
                                                        >
                                                            <Edit3 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirmId(patient._id || patient.id)}
                                                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete Patient"
                                                        >
                                                            <Trash2 size={18} />
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
                                <div className="px-6 py-4 border-t border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-slate-600">
                                            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                                            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                                            {pagination.total} results
                                        </div>
                                        <div className="flex space-x-1">
                                            <button
                                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                                disabled={pagination.page === 1}
                                                className="px-3 py-1 text-sm border border-slate-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                                            >
                                                Previous
                                            </button>
                                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                                const pageNum = i + Math.max(1, pagination.page - 2);
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                                                        className={`px-3 py-1 text-sm border rounded-md transition-colors ${pagination.page === pageNum
                                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                            : 'border-slate-300 hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                            <button
                                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                                disabled={pagination.page === pagination.totalPages}
                                                className="px-3 py-1 text-sm border border-slate-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Card>



            {/* Upload Historical Report Modal */}
            <AddHistoricalReportModal
                isOpen={!!uploadReportPatient}
                onClose={() => setUploadReportPatient(null)}
                patients={patients}
                patient={uploadReportPatient}
                onSuccess={() => {
                    setUploadReportPatient(null);
                    fetchPatients();
                }}
            />

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Patient?</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Are you sure you want to delete this patient? This action cannot be undone and all associated data will be lost.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDeletePatient(deleteConfirmId)}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 shadow-sm transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default PatientRegistry;
