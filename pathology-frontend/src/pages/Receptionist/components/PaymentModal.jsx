import React, { useState, useEffect } from 'react';
import { X, CreditCard, Banknote, Smartphone, CheckCircle } from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';
import { recordPayment } from '../../../api/receptionist/payment.api';

const PaymentModal = ({ isOpen, onClose, bill, onSuccess }) => {
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [transactionId, setTransactionId] = useState('');
    const [amount, setAmount] = useState(bill?.totalAmount || 0);

    useEffect(() => {
        if (bill) {
            setAmount(bill.totalAmount);
        }
    }, [bill]);

    if (!isOpen || !bill) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (amount <= 0) {
            showToast('Invalid payment amount', 'error');
            return;
        }

        setIsLoading(true);
        try {
            await recordPayment({
                billId: bill._id,
                amount: Number(amount),
                paymentMethod,
                transactionId: paymentMethod !== 'CASH' ? transactionId : undefined
            });

            showToast('Payment recorded successfully', 'success');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Payment error:', error);
            const errorMessage = error.response?.data?.message || 'Failed to record payment';
            showToast(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">Record Payment</h3>
                        <p className="text-sm text-slate-500">Bill #{bill.billNumber}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Amount Display */}
                    <div className="text-center p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                        <p className="text-sm font-bold text-indigo-600 uppercase tracking-wide">Total Payable</p>
                        <p className="text-3xl font-black text-indigo-900 mt-1">₹{bill.totalAmount}</p>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700">Payment Method</label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'CASH', label: 'Cash', icon: Banknote },
                                { id: 'UPI', label: 'UPI', icon: Smartphone },
                                { id: 'CARD', label: 'Card', icon: CreditCard }
                            ].map(method => (
                                <button
                                    key={method.id}
                                    type="button"
                                    onClick={() => setPaymentMethod(method.id)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${paymentMethod === method.id
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50'
                                        }`}
                                >
                                    <method.icon size={20} className="mb-1" />
                                    <span className="text-xs font-bold">{method.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Transaction ID (if not Cash) */}
                    {paymentMethod !== 'CASH' && (
                        <div className="space-y-2 animate-in slide-in-from-top-2">
                            <label className="text-sm font-bold text-slate-700">Transaction ID / Ref No.</label>
                            <input
                                type="text"
                                value={transactionId}
                                onChange={(e) => setTransactionId(e.target.value)}
                                placeholder="Enter transaction details"
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                required
                            />
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg hover:shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <CheckCircle size={20} />
                                Confirm Payment
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PaymentModal;
