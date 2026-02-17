
import React, { useState, useEffect, useMemo } from 'react';
import Card from '../../components/ui/Card';
import { UserCheck, Microscope, Trash2, Stethoscope, Loader2, Search, ChevronDown, ChevronRight, Building2, X } from 'lucide-react';
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
    const departments = Array.isArray(contextData?.departments) ? contextData.departments : [];

    const [selectedPatient, setSelectedPatient] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [assignedTests, setAssignedTests] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    // Search & filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDeptFilter, setSelectedDeptFilter] = useState('');
    const [expandedDepts, setExpandedDepts] = useState({});

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
            doctors: doctors.length,
            departments: departments.length
        });
    }, [patients, labTests, doctors, departments]);

    // Use labTests from context
    const availableTests = labTests.length > 0 ? labTests : [];

    // Group tests by department
    const groupedTests = useMemo(() => {
        let testsToGroup = availableTests;

        // Apply search filter
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            testsToGroup = testsToGroup.filter(t =>
                t.testName?.toLowerCase().includes(term)
            );
        }

        // Apply department filter
        if (selectedDeptFilter) {
            testsToGroup = testsToGroup.filter(t => {
                const deptId = t.departmentId?._id || t.departmentId;
                return deptId === selectedDeptFilter;
            });
        }

        // Group by department
        const groups = {};
        testsToGroup.forEach(t => {
            const deptId = t.departmentId?._id || t.departmentId || 'uncategorized';
            const deptName = t.departmentId?.name || 'Uncategorized';

            if (!groups[deptId]) {
                groups[deptId] = {
                    id: deptId,
                    name: deptName,
                    tests: []
                };
            }
            groups[deptId].tests.push(t);
        });

        // Sort departments alphabetically
        return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
    }, [availableTests, searchTerm, selectedDeptFilter]);

    // Auto-expand all departments when search is active or only one department
    useEffect(() => {
        if (searchTerm.trim() || groupedTests.length === 1) {
            const allExpanded = {};
            groupedTests.forEach(g => { allExpanded[g.id] = true; });
            setExpandedDepts(allExpanded);
        }
    }, [searchTerm, groupedTests.length]);

    const toggleDept = (deptId) => {
        setExpandedDepts(prev => ({
            ...prev,
            [deptId]: !prev[deptId]
        }));
    };

    const expandAll = () => {
        const allExpanded = {};
        groupedTests.forEach(g => { allExpanded[g.id] = true; });
        setExpandedDepts(allExpanded);
    };

    const collapseAll = () => {
        setExpandedDepts({});
    };

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

            if (response && (response.testOrder || response.success || response.statusCode === 201)) {
                showToast(`Tests assigned successfully to ${patient.fullName || patient.name}`, 'success');
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
                                            {d.name} ({d.specializations?.map(s => s.name).join(', ') || 'General'})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Available Tests - Department Grouped */}
                <Card title="Available Tests" icon={Microscope} noPadding>
                    {/* Search & Filter Bar */}
                    <div className="p-4 border-b border-slate-100 space-y-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search tests by name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                                />
                            </div>
                            <select
                                value={selectedDeptFilter}
                                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium min-w-[180px]"
                            >
                                <option value="">All Departments</option>
                                {departments.map(dept => (
                                    <option key={dept._id} value={dept._id}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                            {(searchTerm || selectedDeptFilter) && (
                                <button
                                    onClick={() => { setSearchTerm(''); setSelectedDeptFilter(''); }}
                                    className="px-3 py-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-colors text-sm flex items-center gap-1"
                                >
                                    <X size={14} />
                                    Clear
                                </button>
                            )}
                        </div>

                        {/* Quick actions */}
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                {groupedTests.reduce((sum, g) => sum + g.tests.length, 0)} tests in {groupedTests.length} departments
                            </span>
                            <div className="flex gap-2">
                                <button onClick={expandAll} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider">
                                    Expand All
                                </button>
                                <span className="text-slate-300">|</span>
                                <button onClick={collapseAll} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider">
                                    Collapse All
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Department Accordion */}
                    <div className="max-h-[500px] overflow-y-auto">
                        {groupedTests.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                {searchTerm || selectedDeptFilter
                                    ? 'No tests match your filter'
                                    : 'Loading tests or no tests available...'
                                }
                            </div>
                        ) : (
                            groupedTests.map((group) => (
                                <div key={group.id} className="border-b border-slate-100 last:border-b-0">
                                    {/* Department Header */}
                                    <button
                                        onClick={() => toggleDept(group.id)}
                                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            {expandedDepts[group.id]
                                                ? <ChevronDown size={16} className="text-indigo-500" />
                                                : <ChevronRight size={16} className="text-slate-400" />
                                            }
                                            <Building2 size={14} className="text-indigo-500" />
                                            <span className="text-sm font-bold text-slate-700">{group.name}</span>
                                        </div>
                                        <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase">
                                            {group.tests.length} tests
                                        </span>
                                    </button>

                                    {/* Expanded Tests */}
                                    {expandedDepts[group.id] && (
                                        <div className="px-4 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {group.tests.map(t => {
                                                const tId = t._id || t.id;
                                                const isAssigned = assignedTests.find(at => at.id === tId);
                                                return (
                                                    <button
                                                        key={tId}
                                                        onClick={() => handleAssignTest(t)}
                                                        disabled={isAssigned}
                                                        className={`p-3 border-2 rounded-xl text-left flex justify-between items-center transition-all ${isAssigned
                                                            ? 'bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed'
                                                            : 'bg-white hover:border-indigo-400 hover:shadow-sm'
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
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>

            <Card title="Assigned Tests" icon={Microscope} className="h-fit">
                <div className="space-y-4">
                    {assignedTests.map(test => (
                        <div key={test.id} className="flex justify-between items-center bg-white p-4 rounded-2xl border">
                            <div>
                                <p className="font-black text-sm uppercase tracking-tight text-indigo-900">{test.testName}</p>
                                <p className="text-[10px] text-slate-500 font-bold">
                                    {test.departmentId?.name || test.category}
                                </p>
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
