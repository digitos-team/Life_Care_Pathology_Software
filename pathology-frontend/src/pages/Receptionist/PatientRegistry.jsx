import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import { Database, Edit3, UserPlus, Filter, Microscope, Upload, FileText, Users, Plus, Search, Calendar, X } from 'lucide-react';
import { getPatients, updatePatient } from '../../api/receptionist/patient.api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import AssignTestModal from './components/AssignTestModal';
import AddHistoricalReportModal from './components/AddHistoricalReportModal';

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
    const [assignTestPatient, setAssignTestPatient] = useState(null);
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
                        Manage patient records and information
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4">
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
                    {user && (user.role === 'Operator' || user.role === 'Admin') && (
                        <button
                            onClick={() => navigate('/patients/add')}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            <UserPlus size={18} />
                            Add Patient
                        </button>
                    )}
                </div>
            </div>

            {/* Edit Patient Form */}
            {editingPatient && (
                <Card title="Edit Patient" icon={Edit3}>
                    <form className="space-y-4" onSubmit={handleEditSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                placeholder="Full Name"
                                value={editingPatient.fullName || ''}
                                onChange={e => setEditingPatient({ ...editingPatient, fullName: e.target.value })}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 placeholder:text-slate-400"
                                required
                            />
                            <input
                                placeholder="Phone Number"
                                value={editingPatient.phone || ''}
                                onChange={e => setEditingPatient({ ...editingPatient, phone: e.target.value })}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 placeholder:text-slate-400"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                placeholder="Age"
                                type="number"
                                value={editingPatient.age || ''}
                                onChange={e => setEditingPatient({ ...editingPatient, age: e.target.value })}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50"
                            />
                            <select
                                value={editingPatient.gender || ''}
                                onChange={e => setEditingPatient({ ...editingPatient, gender: e.target.value })}
                                className="px-3 py-2 rounded-lg border border-slate-200 font-medium text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50"
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="flex gap-3">
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
                {loading ? (
                    <div className="p-4 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="text-gray-500 text-xs mt-1">Loading patients...</p>
                    </div>
                ) : patients.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                        <Database size={32} className="mx-auto mb-2 opacity-50" />
                        <p>No patients found</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {Object.values(filters).some(v => v !== '') ? 'Try adjusting your filters' : 'Patient records will appear here'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto min-h-[450px]">
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
                                        {(user && (user.role === 'Operator' || user.role === 'Admin')) && (
                                            <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        )}
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
                                                    <div className="text-base font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
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
                                            {(user && (user.role === 'Operator' || user.role === 'Admin')) && (
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-base font-medium">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <button
                                                            onClick={() => setAssignTestPatient(patient)}
                                                            className="text-emerald-600 hover:text-emerald-900 p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                                                            title="Assign Test"
                                                        >
                                                            <Microscope size={18} />
                                                        </button>
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
                                                    </div>
                                                </td>
                                            )}
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
            </Card>

            {/* Assign Test Modal */}
            <AssignTestModal
                isOpen={!!assignTestPatient}
                onClose={() => setAssignTestPatient(null)}
                patient={assignTestPatient}
                onSuccess={() => {
                    setAssignTestPatient(null);
                    // Optionally refresh patients or show a success message
                }}
            />

            {/* Upload Historical Report Modal */}
            <AddHistoricalReportModal
                isOpen={!!uploadReportPatient}
                onClose={() => setUploadReportPatient(null)}
                patients={patients} // Pass all patients, though modal will lock to selected one
                patient={uploadReportPatient}
                onSuccess={() => {
                    setUploadReportPatient(null);
                    fetchPatients(); // Refresh to show updated status if applicable
                }}
            />
        </div >
    );
};

export default PatientRegistry;
