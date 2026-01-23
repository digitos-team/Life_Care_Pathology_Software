import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import Card from './ui/Card';
import { getDoctorCommissionReport } from '../api/admin/doctors.api';

const DoctorCommissionReport = ({ doctor, onBack }) => {
    const [reportType, setReportType] = useState('all');
    const [commissionData, setCommissionData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (doctor) {
            fetchCommissionReport('all');
        }
    }, [doctor]);

    const fetchCommissionReport = async (type) => {
        try {
            setLoading(true);
            const response = await getDoctorCommissionReport(doctor._id || doctor.id, type);
            setCommissionData(response.data || response);
        } catch (error) {
            console.error('Failed to fetch commission report:', error);
            setCommissionData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleTypeChange = (type) => {
        setReportType(type);
        fetchCommissionReport(type);
    };

    if (!doctor) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Back to Doctors List"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{doctor.name}</h2>
                    <p className="text-gray-600">
                        {doctor.specializations?.map(s => s.name).join(', ') || 'General Practice'} • {doctor.degree || 'No Degree'}
                    </p>
                </div>
            </div>

            {/* Doctor Info Card */}
            <Card title="Doctor Information">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Contact</p>
                        <p className="text-sm font-medium text-gray-900">{doctor.mobile}</p>
                        {doctor.email && <p className="text-xs text-gray-500">{doctor.email}</p>}
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Specialized Rate</p>
                        <p className="text-2xl font-bold text-indigo-600">{doctor.specializedCommissionPercentage || 0}%</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Generalized Rate</p>
                        <p className="text-2xl font-bold text-slate-600">{doctor.generalizedCommissionPercentage || 0}%</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Doctor ID</p>
                        <p className="text-sm font-mono text-gray-700">{(doctor._id || doctor.id)?.slice(-8)}</p>
                    </div>
                </div>
            </Card>

            {/* Commission Report Card */}
            <Card title="Commission Report" icon={TrendingUp}>
                <div className="space-y-4">
                    {/* Filter Buttons */}
                    <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => handleTypeChange('all')}
                            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${reportType === 'all'
                                ? 'bg-white text-green-700 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            All Time
                        </button>
                        <button
                            onClick={() => handleTypeChange('monthly')}
                            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${reportType === 'monthly'
                                ? 'bg-white text-green-700 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => handleTypeChange('daily')}
                            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${reportType === 'daily'
                                ? 'bg-white text-green-700 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Daily
                        </button>
                    </div>

                    {/* Commission Data Display */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                            <p className="text-gray-500 mt-4">Loading commission data...</p>
                        </div>
                    ) : commissionData ? (
                        reportType === 'all' ? (
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-sm text-green-700 font-medium mb-2">Total Commission Earned</p>
                                        <p className="text-4xl font-bold text-green-600">
                                            ₹{commissionData.totalCommission?.toLocaleString() || 0}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-green-700 font-medium mb-2">Total Transactions</p>
                                        <p className="text-4xl font-bold text-gray-700">
                                            {commissionData.count || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {Array.isArray(commissionData) && commissionData.length > 0 ? (
                                    commissionData.map((item, index) => (
                                        <div
                                            key={index}
                                            className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                                        >
                                            <div className="flex justify-between items-center mb-3">
                                                <div>
                                                    <p className="text-lg font-semibold text-gray-900">{item._id}</p>
                                                    <p className="text-sm text-gray-500">{item.count} transactions</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-green-600">
                                                        ₹{item.totalCommission?.toLocaleString() || 0}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Detailed Commissions List */}
                                            <div className="space-y-2 mt-4 border-t pt-3">
                                                {item.commissions?.map((comm, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex justify-between items-center text-sm p-2 hover:bg-white rounded transition-colors group"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 group-hover:scale-125 transition-transform"></div>
                                                            <div>
                                                                <p className="font-medium text-gray-700">
                                                                    {comm.patientName || 'Unknown Patient'}
                                                                </p>
                                                                <p className="text-xs text-gray-400 font-mono">
                                                                    {comm.billNumber || 'N/A'} {comm.testNames && `• ${Array.isArray(comm.testNames) ? comm.testNames.join(', ') : comm.testNames}`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-green-600">₹{comm.amount?.toLocaleString()}</p>
                                                            <p className="text-[10px] text-gray-400">
                                                                {comm.date ? new Date(comm.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                                        <p className="text-gray-500">No commission data available for this period</p>
                                    </div>
                                )}
                            </div>
                        )
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <p className="text-gray-500">No commission data available</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default DoctorCommissionReport;
