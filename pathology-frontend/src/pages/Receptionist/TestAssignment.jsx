
import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import { UserCheck, Microscope, Trash2, Stethoscope, Loader2 } from 'lucide-react';
import { useReceptionist } from '../../contexts/ReceptionistsContext';
import { useToast } from '../../contexts/ToastContext';
import { createTestOrder } from '../../api/receptionist/testorder.api';
import { useLocation } from 'react-router-dom';

const TestAssignment = () => {
    const location = useLocation();
    const contextData = useReceptionist();
    const { showToast } = useToast();

    // Ensure all data are arrays with safety checks
    const patients = Array.isArray(contextData?.patients) ? contextData.patients : [];
    const labTests = Array.isArray(contextData?.labTests) ? contextData.labTests : [];
    const doctors = Array.isArray(contextData?.doctors) ? contextData.doctors : [];

    const [selectedPatient, setSelectedPatient] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [assignedTests, setAssignedTests] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    // Effect to handle navigation state (from shortcut)
    useEffect(() => {
        if (location.state && location.state.patientId) {
            setSelectedPatient(location.state.patientId);
        }
    }, [location.state]);

    // Debug: Log the data from context
    useEffect(() => {
        console.log('TestAssignment - Data from context:', {
            patients: patients.length,
            labTests: labTests.length,
            doctors: doctors.length
        });
    }, [patients, labTests, doctors]);

    // Use labTests from context, fallback if empty
    const availableTests = labTests.length > 0 ? labTests : [];

    const handleAssignTest = (test) => {
        if (!assignedTests.find(t => t.id === test._id || t.id === test.id)) {
            setAssignedTests([...assignedTests, { ...test, id: test._id || test.id }]);
        }
    };

    const handleRemoveTest = (testId) => {
        setAssignedTests(assignedTests.filter(t => t.id !== testId));
    };

    const handleSubmit = async () => {
        if (!selectedPatient) {
            showToast('Please select a patient', 'error');
            return;
        }
        // selectedDoctor is now optional
        if (assignedTests.length === 0) {
            showToast('Please assign at least one test', 'error');
            return;
        }

        const patient = patients.find(p => (p._id || p.id) === selectedPatient);
        if (!patient) {
            showToast('Patient not found', 'error');
            return;
        }

        try {
            setSubmitting(true);
            const response = await createTestOrder({
                patientId: selectedPatient,
                doctorId: selectedDoctor,
                testIds: assignedTests.map(t => t._id || t.id)
            });

            console.log('Test Assignment Response:', response);

            // Check if the response indicates success
            // The API returns the data payload directly on success (e.g. { testOrder: ..., bill: ... })
            // or throws an error on failure. So if we get here with a valid object, it's a success.
            if (response && (response.testOrder || response.success || response.statusCode === 201)) {
                showToast(`Tests assigned successfully to ${patient.fullName || patient.name}`, 'success');
                // Reset form
                setSelectedPatient('');
                setSelectedDoctor('');
                setAssignedTests([]);
            } else {
                console.error('Test assignment failed - Unexpected response format:', response);
                throw new Error(response.message || 'Failed to assign tests');
            }
        } catch (error) {
            console.error('Test Assignment Error:', error);
            console.error('Error details:', error.response?.data);
            showToast(error.response?.data?.message || error.message || 'Failed to assign tests', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in">
            <div className="lg:col-span-2 space-y-6">
                <Card title="Patient & Doctor Selection" icon={UserCheck}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Select Patient</label>
                            {patients.length === 0 ? (
                                <div className="text-center py-4 text-gray-500 bg-slate-50 rounded-2xl border border-dashed">No patients available.</div>
                            ) : (
                                <select
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                    value={selectedPatient}
                                    onChange={e => setSelectedPatient(e.target.value)}
                                >
                                    <option value="">Choose Patient...</option>
                                    {patients.map(p => (
                                        <option key={p._id || p.id} value={p._id || p.id}>
                                            {p.fullName || p.name} ({p._id ? p._id.slice(-6) : p.id})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Referring Doctor</label>
                            {doctors.length === 0 ? (
                                <div className="text-center py-4 text-gray-500 bg-slate-50 rounded-2xl border border-dashed">No doctors available.</div>
                            ) : (
                                <select
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                    value={selectedDoctor}
                                    onChange={e => setSelectedDoctor(e.target.value)}
                                >
                                    <option value="">Choose Doctor (Optional)...</option>
                                    {doctors.map(d => (
                                        <option key={d._id || d.id} value={d._id || d.id}>
                                            {d.name} ({d.specialization})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>
                </Card>

                <Card title="Available Tests" icon={Microscope} noPadding>
                    {availableTests.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">Loading tests or no tests available...</div>
                    ) : (
                        <div className="p-6 max-h-96 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {availableTests.map(t => {
                                const tId = t._id || t.id;
                                const isAssigned = assignedTests.find(at => at.id === tId);
                                return (
                                    <button
                                        key={tId}
                                        onClick={() => handleAssignTest(t)}
                                        disabled={isAssigned}
                                        className={`p-4 border-2 rounded-2xl text-left flex justify-between items-center transition-all ${isAssigned
                                            ? 'bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed'
                                            : 'bg-white hover:border-indigo-400'
                                            }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black uppercase tracking-tight text-indigo-900 truncate">{t.testName}</p>
                                            <p className="text-[10px] text-slate-500 font-bold mt-0.5">{t.category}</p>
                                        </div>
                                        <p className="font-black text-sm ml-2">₹{t.price}</p>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </Card>
            </div>

            <Card title="Assigned Tests" icon={Microscope} className="h-fit">
                <div className="space-y-4">
                    {assignedTests.map(test => (
                        <div key={test.id} className="flex justify-between items-center bg-white p-4 rounded-2xl border">
                            <div>
                                <p className="font-black text-sm uppercase tracking-tight text-indigo-900">{test.testName}</p>
                                <p className="text-[10px] text-slate-500 font-bold">{test.category}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-indigo-600">₹{test.price}</span>
                                <button
                                    onClick={() => handleRemoveTest(test.id)}
                                    className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {assignedTests.length === 0 && (
                        <div className="text-center text-slate-400 italic py-8">
                            No tests assigned yet
                        </div>
                    )}

                    {assignedTests.length > 0 && (
                        <div className="pt-4 border-t">
                            <div className="flex justify-between text-sm font-bold mb-4">
                                <span>Total Tests:</span>
                                <span>{assignedTests.length}</span>
                            </div>
                            <div className="flex justify-between text-lg font-black mb-6">
                                <span>Total Amount:</span>
                                <span className="text-indigo-600 break-all">₹{assignedTests.reduce((sum, test) => sum + test.price, 0).toLocaleString()}</span>
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Assigning...
                                    </>
                                ) : 'Assign Tests Now'}
                            </button>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default TestAssignment;
