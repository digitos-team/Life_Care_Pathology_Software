import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import { ClipboardList, User, Stethoscope, Calendar, DollarSign, Clock, ChevronDown, ChevronUp, RefreshCw, FileText, CheckCircle, Layers, Trash2 } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { getPendingOrders, finalizeTestOrder, deleteTestOrder } from '../../api/receptionist/testorder.api';
import SubmitResultModal from './components/SubmitResultModal';
import SubmitBulkResultModal from './components/SubmitBulkResultModal';

const PendingOrders = () => {
    const { showToast } = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [selectedTestForResults, setSelectedTestForResults] = useState(null);
    const [selectedOrderForBulk, setSelectedOrderForBulk] = useState(null);
    const [processingOrder, setProcessingOrder] = useState(null);

    const fetchPendingOrders = async () => {
        try {
            setLoading(true);
            const data = await getPendingOrders();
            setOrders(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching pending orders:', error);
            showToast('Failed to load pending orders', 'error');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const handleResultSuccess = () => {
        fetchPendingOrders();
        setSelectedTestForResults(null);
        setSelectedOrderForBulk(null);
    };

    const handleGenerateReport = async (e, orderId) => {
        e.stopPropagation();
        setProcessingOrder(orderId);
        try {
            await finalizeTestOrder(orderId);
            showToast('Report generated successfully');
            fetchPendingOrders(); // Refresh list (order should disappear if completed)
        } catch (error) {
            console.error('Error generating report:', error);
            showToast(error.message || 'Failed to generate report', 'error');
        } finally {
            setProcessingOrder(null);
        }
    };

    const handleDeleteOrder = async (e, orderId) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
            return;
        }

        setProcessingOrder(orderId);
        try {
            await deleteTestOrder(orderId);
            showToast('Order deleted successfully');
            fetchPendingOrders();
        } catch (error) {
            console.error('Error deleting order:', error);
            showToast(error.message || 'Failed to delete order', 'error');
        } finally {
            setProcessingOrder(null);
        }
    };


    useEffect(() => {
        fetchPendingOrders();
    }, []);

    const toggleOrder = (orderId) => {
        setExpandedOrder(expandedOrder === orderId ? null : orderId);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Pending Orders</h1>
                    <p className="text-slate-500 mt-1">Manage test orders and enter results</p>
                </div>
                <button
                    onClick={fetchPendingOrders}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                    title="Refresh Orders"
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            {orders.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ClipboardList className="text-slate-400" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">No Pending Orders</h3>
                        <p className="text-slate-500 mt-1">All test orders have been processed.</p>
                    </div>
                </Card>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => {
                        const tests = order.tests || order.testItems || [];
                        const allTestsCompleted = tests.length > 0 && tests.every(t => t.status === 'COMPLETED');

                        return (
                            <Card key={order._id} noPadding className="overflow-hidden border border-slate-200 hover:border-indigo-200 transition-all duration-300">
                                <div
                                    className="p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                                    onClick={() => toggleOrder(order._id)}
                                >
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        {/* Order Header Info */}
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${allTestsCompleted ? 'bg-emerald-500 shadow-emerald-200' : 'bg-indigo-600 shadow-indigo-200'
                                                }`}>
                                                {allTestsCompleted ? <CheckCircle size={24} /> : <ClipboardList size={24} />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-800">
                                                    {order.patientId?.fullName || 'Unknown Patient'}
                                                </h3>
                                                <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <User size={14} />
                                                        {order.patientId?.age} Y / {order.patientId?.gender}
                                                    </span>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                    <span className="flex items-center gap-1">
                                                        <Stethoscope size={14} />
                                                        {order.doctor?.name || 'No Doctor'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Order Status & Action */}
                                        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                            <div className="text-right">
                                                <div className="flex items-center justify-end gap-2 text-sm font-bold text-slate-700">
                                                    <Calendar size={14} className="text-indigo-500" />
                                                    {new Date(order.orderDate).toLocaleDateString()}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1 flex items-center justify-end gap-1">
                                                    <Clock size={12} />
                                                    {new Date(order.orderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>

                                            {allTestsCompleted ? (
                                                <button
                                                    onClick={(e) => handleGenerateReport(e, order._id)}
                                                    disabled={processingOrder === order._id}
                                                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg hover:shadow-emerald-200 transition-all flex items-center gap-2"
                                                >
                                                    {processingOrder === order._id ? (
                                                        <RefreshCw size={16} className="animate-spin" />
                                                    ) : (
                                                        <FileText size={16} />
                                                    )}
                                                    Generate Report
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedOrderForBulk(order);
                                                        }}
                                                        className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-all flex items-center gap-2"
                                                    >
                                                        <Layers size={16} />
                                                        Bulk Entry
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDeleteOrder(e, order._id)}
                                                        disabled={processingOrder === order._id}
                                                        className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all shadow-sm hover:shadow-rose-100 disabled:opacity-50"
                                                        title="Delete Order"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300 ${expandedOrder === order._id ? 'bg-indigo-100 text-indigo-600 rotate-180' : 'bg-slate-100 text-slate-400'}`}>
                                                        <ChevronDown size={20} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {expandedOrder === order._id && (
                                    <div className="border-t border-slate-100 bg-slate-50/50 p-6 animate-in slide-in-from-top-2">
                                        <div className="grid gap-4">
                                            {tests.map((test, index) => {
                                                const testStatusColors = {
                                                    PENDING: { bg: 'bg-amber-100', text: 'text-amber-700' },
                                                    IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-700' },
                                                    COMPLETED: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
                                                    CANCELLED: { bg: 'bg-rose-100', text: 'text-rose-700' }
                                                }[test.status] || { bg: 'bg-slate-100', text: 'text-slate-700' };

                                                return (
                                                    <div key={index} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div>
                                                                    <h5 className="font-bold text-slate-800 flex items-center gap-2">
                                                                        {test.testName}
                                                                        <span className="text-xs font-normal text-slate-500 px-2 py-0.5 bg-slate-100 rounded-full">
                                                                            {test.category}
                                                                        </span>
                                                                    </h5>
                                                                    <p className="text-sm font-medium text-indigo-600">₹{test.price}</p>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {(test.status === 'PENDING' || test.status === 'IN_PROGRESS') && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setSelectedTestForResults({ orderId: order._id, test, patientId: order.patientId?._id });
                                                                            }}
                                                                            className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1"
                                                                        >
                                                                            <FileText size={14} />
                                                                            Enter Result
                                                                        </button>
                                                                    )}
                                                                    {test.enteredAt && test.status === 'COMPLETED' && (
                                                                        <span className="text-[10px] text-slate-400 font-medium px-2">
                                                                            {new Date(test.enteredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </span>
                                                                    )}
                                                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${testStatusColors.bg} ${testStatusColors.text}`}>
                                                                        {test.status}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Test Parameters */}
                                                            {test.parameters && test.parameters.length > 0 && (
                                                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                                    {test.parameters.map((param, idx) => (
                                                                        <div key={idx} className="text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                                            <span className="font-semibold text-slate-600">{param.name}</span>
                                                                            <div className="text-slate-400 mt-0.5">
                                                                                {param.referenceRange} {param.unit}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Summary */}
            {!loading && orders.length > 0 && (
                <div className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Showing {orders.length} pending order{orders.length !== 1 ? 's' : ''}
                </div>
            )}

            <SubmitResultModal
                isOpen={!!selectedTestForResults}
                onClose={() => setSelectedTestForResults(null)}
                orderId={selectedTestForResults?.orderId}
                testItem={selectedTestForResults?.test}
                patientId={selectedTestForResults?.patientId}
                onSuccess={handleResultSuccess}
            />

            <SubmitBulkResultModal
                isOpen={!!selectedOrderForBulk}
                onClose={() => setSelectedOrderForBulk(null)}
                order={selectedOrderForBulk}
                onSuccess={handleResultSuccess}
            />
        </div>
    );
};

export default PendingOrders;
