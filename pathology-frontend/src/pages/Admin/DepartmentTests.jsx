import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import {
    ArrowLeft, Microscope, Search, FlaskConical, X
} from 'lucide-react';
import { getLabTests } from '../../api/admin/labTest.api';
import { useToast } from '../../contexts/ToastContext';

const DepartmentTests = ({ department, onBack }) => {
    const { showToast } = useToast();
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchTests();
    }, [department._id]);

    const fetchTests = async () => {
        try {
            setLoading(true);
            const response = await getLabTests({ departmentId: department._id });
            setTests(response.data || response.tests || []);
        } catch (err) {
            console.error('Failed to fetch department tests:', err);
            showToast('Failed to load tests', 'error');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) =>
        new Intl.NumberFormat('en-IN', {
            style: 'currency', currency: 'INR', maximumFractionDigits: 0
        }).format(amount);

    const filteredTests = tests.filter(t =>
        t.testName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium text-sm px-3 py-2 rounded-lg hover:bg-indigo-50"
                >
                    <ArrowLeft size={16} />
                    Back to Departments
                </button>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <FlaskConical size={22} className="text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">{department.name}</h2>
                        <p className="text-slate-500 text-sm mt-0.5">
                            {department.description || 'Department tests'}
                        </p>
                    </div>
                </div>
                {!loading && (
                    <span className="bg-indigo-100 text-indigo-700 text-sm font-semibold px-3 py-1.5 rounded-full">
                        {tests.length} Test{tests.length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* Search */}
            <div className="flex items-center bg-white rounded-xl p-2 px-4 shadow-sm border border-slate-200">
                <Search className="text-slate-400 mr-2 flex-shrink-0" size={18} />
                <input
                    type="text"
                    placeholder="Search tests by name..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-slate-600 font-medium placeholder:text-slate-300"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600 ml-2">
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Tests Table */}
            <Card title={`Tests in ${department.name}`} icon={Microscope} noPadding>
                {loading ? (
                    <div className="p-10 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="text-gray-500 mt-3 text-sm">Loading tests…</p>
                    </div>
                ) : filteredTests.length === 0 ? (
                    <div className="p-10 text-center text-gray-400">
                        <Microscope size={48} className="mx-auto mb-4 opacity-40" />
                        <p className="font-medium">
                            {searchTerm ? 'No tests match your search' : 'No tests in this department'}
                        </p>
                        {searchTerm && (
                            <p className="text-sm mt-1 text-gray-400">Try a different search term</p>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Test Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Parameters</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredTests.map((test, index) => (
                                    <tr key={test._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-gray-400 font-medium">{index + 1}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                                    <Microscope size={13} className="text-indigo-500" />
                                                </div>
                                                <span className="font-semibold text-gray-900">{test.testName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${test.category === 'RADIOLOGY'
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {test.category || 'PATHOLOGY'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            <span className="inline-flex items-center gap-1">
                                                <span className="font-semibold text-gray-800">{test.parameters?.length ?? 0}</span>
                                                <span className="text-gray-400 text-xs">param{(test.parameters?.length ?? 0) !== 1 ? 's' : ''}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-emerald-700 text-base">
                                                {formatCurrency(test.price)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${test.isActive !== false
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-600'
                                                }`}>
                                                {test.isActive !== false ? '● Active' : '● Inactive'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default DepartmentTests;
