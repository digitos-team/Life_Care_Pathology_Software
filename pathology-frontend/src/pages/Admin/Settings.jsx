import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import { User, Clock, Mail, MapPin, Phone, Building2, Landmark, UserPlus, Trash2, X, Info, Save, Settings as SettingsIcon, Globe, FileBadge, CheckCircle2 } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { getReceptionists, createReceptionist, deleteReceptionist, updateReceptionist } from '../../api/admin/receptionist.api';
import { Pencil } from 'lucide-react';

const Settings = () => {
    const { labConfig, updateLabSettings } = useAdmin();
    const { showToast } = useToast();
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState('general');
    const [isSaving, setIsSaving] = useState(false);
    const [receptionists, setReceptionists] = useState([]);
    const [loadingReceptionists, setLoadingReceptionists] = useState(false);
    // const [deleteConfirmId, setDeleteConfirmId] = useState(null); // Removed duplicate
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    const initialReceptionistState = {
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        bankDetails: {
            bankName: '',
            accountNumber: '',
            ifscCode: '',
            accountHolderName: ''
        }
    };

    const [receptionistFormData, setReceptionistFormData] = useState(initialReceptionistState);

    const [labFormData, setLabFormData] = useState({
        labName: '',
        contact: '',
        address: '',
        licenseNumber: '',
        gstNumber: '',
        panNumber: '',
        email: '',
        // website: '',
        // operatingHours: '',
        bankDetails: {
            bankName: '',
            accountNumber: '',
            ifscCode: '',
            accountName: ''
        }
    });

    useEffect(() => {
        if (labConfig) {
            setLabFormData({
                labName: labConfig.labName || '',
                contact: labConfig.contact || '',
                address: labConfig.address || '',
                licenseNumber: labConfig.licenseNumber || '',
                gstNumber: labConfig.gstNumber || '',
                panNumber: labConfig.panNumber || '',
                email: labConfig.email || '',
                // website: labConfig.website || '',
                // operatingHours: labConfig.operatingHours || '',
                bankDetails: {
                    bankName: labConfig.bankDetails?.bankName || '',
                    accountNumber: labConfig.bankDetails?.accountNumber || '',
                    ifscCode: labConfig.bankDetails?.ifscCode || '',
                    accountName: labConfig.bankDetails?.accountName || ''
                }
            });
        }
    }, [labConfig]);

    const handleLabConfigSubmit = async (e) => {
        if (e) e.preventDefault();
        setIsSaving(true);
        try {
            const result = await updateLabSettings(labFormData);
            if (result.success) {
                showToast("Configuration saved successfully", "success");
            } else {
                showToast(result.message || "Failed to update settings", "error");
            }
        } catch (error) {
            showToast("An unexpected error occurred", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const tabs = [
        { id: 'general', label: 'Laboratory Profile', icon: Building2 },
        { id: 'financial', label: 'Financial & Bank', icon: Landmark },
        { id: 'users', label: 'Receptionist', icon: UserPlus }
    ];

    // Fetch receptionists when users tab is active
    useEffect(() => {
        if (activeTab === 'users') {
            fetchReceptionists();
        }
    }, [activeTab]);

    const fetchReceptionists = async () => {
        setLoadingReceptionists(true);
        try {
            const result = await getReceptionists();
            if (result.success) {
                setReceptionists(result.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch receptionists:', error);
        } finally {
            setLoadingReceptionists(false);
        }
    };

    const handleCreateOrUpdateReceptionist = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            let result;
            if (isEditing) {
                result = await updateReceptionist(editId, receptionistFormData);
            } else {
                result = await createReceptionist(receptionistFormData);
            }

            if (result.success) {
                showToast(`Receptionist ${isEditing ? 'updated' : 'created'} successfully`, 'success');
                setReceptionistFormData(initialReceptionistState);
                setShowAddModal(false);
                setIsEditing(false);
                setEditId(null);
                fetchReceptionists();
            } else {
                showToast(result.message || `Failed to ${isEditing ? 'update' : 'create'} receptionist`, 'error');
            }
        } catch (error) {
            showToast('An unexpected error occurred', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const openEditModal = (receptionist) => {
        setReceptionistFormData({
            name: receptionist.name,
            email: receptionist.email,
            password: '', // Password is optional on update, or handled differently
            phone: receptionist.phone || '',
            address: receptionist.address || '',
            bankDetails: {
                bankName: receptionist.bankDetails?.bankName || '',
                accountNumber: receptionist.bankDetails?.accountNumber || '',
                ifscCode: receptionist.bankDetails?.ifscCode || '',
                accountHolderName: receptionist.bankDetails?.accountHolderName || ''
            }
        });
        setEditId(receptionist._id);
        setIsEditing(true);
        setShowAddModal(true);
    };

    const openCreateModal = () => {
        setReceptionistFormData(initialReceptionistState);
        setIsEditing(false);
        setEditId(null);
        setShowAddModal(true);
    };

    const handleDeleteReceptionist = async (userId) => {
        try {
            const result = await deleteReceptionist(userId);
            if (result.success) {
                showToast('Receptionist deleted successfully', 'success');
                setDeleteConfirmId(null);
                fetchReceptionists();
            } else {
                showToast(result.message || 'Failed to delete receptionist', 'error');
            }
        } catch (error) {
            showToast('An unexpected error occurred', 'error');
        }
    };

    // Common input styles with dark mode support
    const inputClasses = "w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-xl focus:border-[var(--border-focus)] focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 outline-none transition-all text-[var(--text-primary)]";
    const labelClasses = "text-sm font-semibold text-[var(--text-secondary)]";

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-primary)] shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg">
                        <SettingsIcon size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>
                        <p className="text-[var(--text-tertiary)] text-sm">Manage lab configuration and users</p>
                    </div>
                </div>
                <button
                    onClick={handleLabConfigSubmit}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-semibold text-sm shadow-lg disabled:opacity-50"
                >
                    {isSaving ? <Clock size={18} className="animate-spin" /> : <Save size={18} />}
                    {isSaving ? "Saving..." : "Save Changes"}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border-primary)] shadow-sm">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-1 last:mb-0 ${activeTab === tab.id
                                    ? 'bg-indigo-600 text-white shadow-lg'
                                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                                    }`}
                            >
                                <div className={`p-2 rounded-lg flex-shrink-0 ${activeTab === tab.id ? 'bg-white/20' : 'bg-[var(--bg-secondary)]'}`}>
                                    <tab.icon size={18} />
                                </div>
                                <span className="font-medium text-sm text-left">{tab.label}</span>
                            </button>
                        ))}
                    </div>


                </div>

                {/* Content Area */}
                <div className="lg:col-span-4">
                    {activeTab === 'general' && (
                        <div className="animate-in fade-in duration-300">
                            <Card title="Laboratory Information" icon={Building2}>
                                <div className="space-y-6 p-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className={labelClasses}>Lab Name</label>
                                            <input
                                                className={inputClasses}
                                                value={labFormData.labName}
                                                placeholder="Enter lab name"
                                                onChange={e => setLabFormData({ ...labFormData, labName: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className={labelClasses}>License Number</label>
                                            <input
                                                className={inputClasses}
                                                value={labFormData.licenseNumber}
                                                placeholder="Medical license number"
                                                onChange={e => setLabFormData({ ...labFormData, licenseNumber: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className={labelClasses}>Contact Number</label>
                                            <input
                                                className={inputClasses}
                                                value={labFormData.contact}
                                                placeholder="+91-0000000000"
                                                onChange={e => setLabFormData({ ...labFormData, contact: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className={labelClasses}>Address</label>
                                        <textarea
                                            className={`${inputClasses} resize-none`}
                                            rows={3}
                                            placeholder="Complete lab address"
                                            value={labFormData.address}
                                            onChange={e => setLabFormData({ ...labFormData, address: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'financial' && (
                        <div className="animate-in fade-in duration-300">
                            <Card title="Bank Details" icon={Landmark}>
                                <div className="space-y-6 p-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className={labelClasses}>Bank Name</label>
                                            <input
                                                className={inputClasses}
                                                value={labFormData.bankDetails.bankName}
                                                placeholder="e.g. HDFC Bank"
                                                onChange={e => setLabFormData({
                                                    ...labFormData,
                                                    bankDetails: { ...labFormData.bankDetails, bankName: e.target.value }
                                                })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className={labelClasses}>IFSC Code</label>
                                            <input
                                                className={`${inputClasses} font-mono`}
                                                value={labFormData.bankDetails.ifscCode}
                                                placeholder="e.g. HDFC0001234"
                                                onChange={e => setLabFormData({
                                                    ...labFormData,
                                                    bankDetails: { ...labFormData.bankDetails, ifscCode: e.target.value.toUpperCase() }
                                                })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className={labelClasses}>Account Number</label>
                                            <input
                                                className={inputClasses}
                                                value={labFormData.bankDetails.accountNumber}
                                                placeholder="Account number"
                                                onChange={e => setLabFormData({
                                                    ...labFormData,
                                                    bankDetails: { ...labFormData.bankDetails, accountNumber: e.target.value }
                                                })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className={labelClasses}>Account Holder Name</label>
                                            <input
                                                className={inputClasses}
                                                value={labFormData.bankDetails.accountName}
                                                placeholder="Account holder name"
                                                onChange={e => setLabFormData({
                                                    ...labFormData,
                                                    bankDetails: { ...labFormData.bankDetails, accountName: e.target.value }
                                                })}
                                            />
                                        </div>
                                    </div>

                                    <div className="p-4 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-start gap-3">
                                        <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200 mb-1">Bank details sync</h4>
                                            <p className="text-xs text-emerald-700 dark:text-emerald-300">These details will appear on all invoices and reports.</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="animate-in fade-in duration-300 space-y-6">
                            {/* Add Button */}
                            {/* <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={openCreateModal}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-lg"
                                >
                                    <UserPlus size={18} />
                                    Add Receptionist
                                </button>
                            </div> */}

                            {/* Receptionists List */}
                            <Card title="Receptionists" icon={User}>
                                {loadingReceptionists ? (
                                    <div className="p-8 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                                        <p className="text-[var(--text-tertiary)] mt-2">Loading...</p>
                                    </div>
                                ) : receptionists.length === 0 ? (
                                    <div className="p-8 text-center text-[var(--text-tertiary)]">
                                        <User size={48} className="mx-auto mb-4 opacity-30" />
                                        <p className="font-medium text-[var(--text-secondary)]">No receptionists found</p>
                                        <p className="text-sm mt-1">Click "Add Receptionist" to create one</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase">Name</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase">Email</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase">Phone</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--text-tertiary)] uppercase">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[var(--border-primary)]">
                                                {receptionists.map((receptionist) => (
                                                    <tr key={receptionist._id} className="hover:bg-[var(--bg-hover)]">
                                                        <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{receptionist.name}</td>
                                                        <td className="px-4 py-3 text-[var(--text-secondary)]">{receptionist.email}</td>
                                                        <td className="px-4 py-3 text-[var(--text-secondary)]">{receptionist.phone || '-'}</td>
                                                        <td className="px-4 py-3 text-right">
                                                            <button
                                                                onClick={() => openEditModal(receptionist)}
                                                                className="text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 mr-2"
                                                                title="Edit"
                                                            >
                                                                <Pencil size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteConfirmId(receptionist._id)}
                                                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Receptionist Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[var(--bg-modal)] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-[var(--border-primary)]">
                        <div className="p-6 border-b border-[var(--border-primary)] flex justify-between items-center">
                            <h3 className="text-lg font-bold text-[var(--text-primary)]">{isEditing ? 'Edit Receptionist' : 'Add New Receptionist'}</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateOrUpdateReceptionist} className="p-5 space-y-4">
                            {/* Personal Information */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-2">Personal Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Full Name *</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-3 py-2 text-sm bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 dark:focus:ring-indigo-900 outline-none transition-all text-[var(--text-primary)]"
                                            value={receptionistFormData.name}
                                            onChange={e => setReceptionistFormData({ ...receptionistFormData, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Email Address *</label>
                                        <input
                                            type="email"
                                            required
                                            className="w-full px-3 py-2 text-sm bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 dark:focus:ring-indigo-900 outline-none transition-all text-[var(--text-primary)]"
                                            value={receptionistFormData.email}
                                            onChange={e => setReceptionistFormData({ ...receptionistFormData, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Password {isEditing && '(Leave blank to keep current)'}</label>
                                        <input
                                            type="password"
                                            required={!isEditing}
                                            className="w-full px-3 py-2 text-sm bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 dark:focus:ring-indigo-900 outline-none transition-all text-[var(--text-primary)]"
                                            value={receptionistFormData.password}
                                            onChange={e => setReceptionistFormData({ ...receptionistFormData, password: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Phone Number</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 text-sm bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 dark:focus:ring-indigo-900 outline-none transition-all text-[var(--text-primary)]"
                                            value={receptionistFormData.phone}
                                            onChange={e => setReceptionistFormData({ ...receptionistFormData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Address</label>
                                    <textarea
                                        className="w-full px-3 py-2 text-sm bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 dark:focus:ring-indigo-900 outline-none transition-all text-[var(--text-primary)] resize-none"
                                        rows={2}
                                        value={receptionistFormData.address}
                                        onChange={e => setReceptionistFormData({ ...receptionistFormData, address: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Bank Details */}
                            <div className="space-y-3 pt-3 border-t border-[var(--border-primary)]">
                                <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-2">Bank Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Bank Name</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 text-sm bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 dark:focus:ring-indigo-900 outline-none transition-all text-[var(--text-primary)]"
                                            value={receptionistFormData.bankDetails.bankName}
                                            onChange={e => setReceptionistFormData({
                                                ...receptionistFormData,
                                                bankDetails: { ...receptionistFormData.bankDetails, bankName: e.target.value }
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">IFSC Code</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 text-sm bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 dark:focus:ring-indigo-900 outline-none transition-all text-[var(--text-primary)] font-mono"
                                            value={receptionistFormData.bankDetails.ifscCode}
                                            onChange={e => setReceptionistFormData({
                                                ...receptionistFormData,
                                                bankDetails: { ...receptionistFormData.bankDetails, ifscCode: e.target.value.toUpperCase() }
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Account Number</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 text-sm bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 dark:focus:ring-indigo-900 outline-none transition-all text-[var(--text-primary)]"
                                            value={receptionistFormData.bankDetails.accountNumber}
                                            onChange={e => setReceptionistFormData({
                                                ...receptionistFormData,
                                                bankDetails: { ...receptionistFormData.bankDetails, accountNumber: e.target.value }
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Account Holder Name</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 text-sm bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 dark:focus:ring-indigo-900 outline-none transition-all text-[var(--text-primary)]"
                                            value={receptionistFormData.bankDetails.accountHolderName}
                                            onChange={e => setReceptionistFormData({
                                                ...receptionistFormData,
                                                bankDetails: { ...receptionistFormData.bankDetails, accountHolderName: e.target.value }
                                            })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-primary)]">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-6 py-2.5 text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-xl font-semibold hover:bg-[var(--bg-hover)] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-200 transition-all"
                                >
                                    {isSaving ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Receptionist' : 'Create Receptionist')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[var(--bg-modal)] rounded-2xl max-w-sm w-full p-6 text-center border border-[var(--border-primary)]">
                        <div className="w-14 h-14 bg-red-500/20 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={28} />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Delete Receptionist?</h3>
                        <p className="text-[var(--text-tertiary)] text-sm mb-6">This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="flex-1 px-4 py-2.5 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-lg font-medium hover:bg-[var(--bg-hover)]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteReceptionist(deleteConfirmId)}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
