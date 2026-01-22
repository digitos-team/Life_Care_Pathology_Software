import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { createPatient } from '../../api/receptionist/patient.api';
import { useToast } from '../../contexts/ToastContext';
import { toPascalCase } from '../../utils/formatUtils';

const AddPatient = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [patientForm, setPatientForm] = useState({
        fullName: '',
        phone: '',
        age: '',
        gender: '',
        email: '',
        address: {
            street: '',
            city: '',
            state: '',
            pincode: ''
        }
    });

    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!patientForm.fullName || !patientForm.phone || !patientForm.age || !patientForm.gender) {
            showToast("Please fill all required fields", "warning");
            return;
        }

        // Validate phone number length
        if (patientForm.phone.length !== 10) {
            showToast("Phone number must be exactly 10 digits", "warning");
            return;
        }

        setSubmitting(true);
        try {
            // Convert age to number before sending
            const patientData = {
                ...patientForm,
                age: parseInt(patientForm.age, 10)
            };
            await createPatient(patientData);
            showToast("Patient registered successfully", "success");
            navigate('/patients');
        } catch (err) {
            console.error("Error creating patient:", err);
            const errorMessage = err.response?.data?.message || err.message || "Failed to register patient";
            showToast(errorMessage, "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2
                        className="text-2xl font-black"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        Add New Patient
                    </h2>
                    <p
                        className="mt-1"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        Register a new patient in the system
                    </p>
                </div>
                <button
                    onClick={() => navigate('/patients')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                    style={{
                        backgroundColor: 'var(--button-secondary)',
                        color: 'var(--text-primary)'
                    }}
                >
                    <ArrowLeft size={18} />
                    Back to Patients
                </button>
            </div>

            {/* Add Patient Form */}
            <Card title="Patient Information" icon={UserPlus}>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                                Full Name *
                            </label>
                            <input
                                placeholder="Enter full name"
                                value={patientForm.fullName}
                                onChange={e => setPatientForm({ ...patientForm, fullName: e.target.value })}
                                onBlur={e => setPatientForm({ ...patientForm, fullName: toPascalCase(e.target.value) })}
                                className="w-full px-4 py-3 rounded-2xl outline-none transition-all"
                                style={{
                                    backgroundColor: 'var(--input-bg)',
                                    border: '1px solid var(--input-border)',
                                    color: 'var(--input-text)'
                                }}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                                Phone Number *
                            </label>
                            <input
                                placeholder="Enter 10-digit phone number"
                                type="tel"
                                maxLength="10"
                                value={patientForm.phone}
                                onChange={e => {
                                    const value = e.target.value;
                                    if (value === '' || /^\d+$/.test(value)) {
                                        setPatientForm({ ...patientForm, phone: value });
                                    }
                                }}
                                className="w-full px-4 py-3 rounded-2xl outline-none transition-all"
                                style={{
                                    backgroundColor: 'var(--input-bg)',
                                    border: '1px solid var(--input-border)',
                                    color: 'var(--input-text)'
                                }}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                            Email (Optional)
                        </label>
                        <input
                            placeholder="Enter email address"
                            type="email"
                            value={patientForm.email}
                            onChange={e => setPatientForm({ ...patientForm, email: e.target.value })}
                            className="w-full px-4 py-3 rounded-2xl outline-none transition-all"
                            style={{
                                backgroundColor: 'var(--input-bg)',
                                border: '1px solid var(--input-border)',
                                color: 'var(--input-text)'
                            }}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                                Age *
                            </label>
                            <input
                                placeholder="Enter age"
                                type="number"
                                min="0"
                                step="1"
                                value={patientForm.age}
                                onChange={e => {
                                    const value = e.target.value;
                                    if (value === '' || /^\d+$/.test(value)) {
                                        setPatientForm({ ...patientForm, age: value });
                                    }
                                }}
                                className="w-full px-4 py-3 rounded-2xl outline-none transition-all"
                                style={{
                                    backgroundColor: 'var(--input-bg)',
                                    border: '1px solid var(--input-border)',
                                    color: 'var(--input-text)'
                                }}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                                Gender *
                            </label>
                            <select
                                value={patientForm.gender}
                                onChange={e => setPatientForm({ ...patientForm, gender: e.target.value })}
                                className="w-full px-4 py-3 rounded-2xl font-medium text-sm outline-none transition-all"
                                style={{
                                    backgroundColor: 'var(--input-bg)',
                                    border: '1px solid var(--input-border)',
                                    color: 'var(--input-text)'
                                }}
                                required
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    {/* Address Fields */}
                    <div className="border-t pt-4" style={{ borderColor: 'var(--border-primary)' }}>
                        <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Address</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                                    Street
                                </label>
                                <input
                                    placeholder="Enter street address"
                                    value={patientForm.address.street}
                                    onChange={e => setPatientForm({
                                        ...patientForm,
                                        address: { ...patientForm.address, street: e.target.value }
                                    })}
                                    className="w-full px-4 py-3 rounded-2xl outline-none transition-all"
                                    style={{
                                        backgroundColor: 'var(--input-bg)',
                                        border: '1px solid var(--input-border)',
                                        color: 'var(--input-text)'
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                                    City
                                </label>
                                <input
                                    placeholder="Enter city"
                                    value={patientForm.address.city}
                                    onChange={e => setPatientForm({
                                        ...patientForm,
                                        address: { ...patientForm.address, city: e.target.value }
                                    })}
                                    className="w-full px-4 py-3 rounded-2xl outline-none transition-all"
                                    style={{
                                        backgroundColor: 'var(--input-bg)',
                                        border: '1px solid var(--input-border)',
                                        color: 'var(--input-text)'
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                                    State
                                </label>
                                <input
                                    placeholder="Enter state"
                                    value={patientForm.address.state}
                                    onChange={e => setPatientForm({
                                        ...patientForm,
                                        address: { ...patientForm.address, state: e.target.value }
                                    })}
                                    className="w-full px-4 py-3 rounded-2xl outline-none transition-all"
                                    style={{
                                        backgroundColor: 'var(--input-bg)',
                                        border: '1px solid var(--input-border)',
                                        color: 'var(--input-text)'
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                                    Pincode
                                </label>
                                <input
                                    placeholder="Enter pincode"
                                    value={patientForm.address.pincode}
                                    onChange={e => setPatientForm({
                                        ...patientForm,
                                        address: { ...patientForm.address, pincode: e.target.value }
                                    })}
                                    className="w-full px-4 py-3 rounded-2xl outline-none transition-all"
                                    style={{
                                        backgroundColor: 'var(--input-bg)',
                                        border: '1px solid var(--input-border)',
                                        color: 'var(--input-text)'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-colors"
                            style={{
                                backgroundColor: 'var(--accent-indigo)',
                                color: 'var(--text-inverse)'
                            }}
                        >
                            {submitting ? 'Registering...' : 'Register Patient'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/patients')}
                            className="px-6 py-3 rounded-lg font-medium text-sm transition-colors"
                            style={{
                                backgroundColor: 'var(--button-secondary)',
                                color: 'var(--text-primary)'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default AddPatient;
