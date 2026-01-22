
import React from 'react';
import Card from '../../../components/ui/Card';
import { ClipboardList, CheckCircle } from 'lucide-react';

const ReportsPanel = ({ bills, reports, setReports, workBillId, setWorkBillId, labValues, setLabValues, validateReport }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-sm animate-in fade-in">
        <Card title="Investigation Entry" icon={ClipboardList}>
            <div className="space-y-8">
                <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    value={workBillId}
                    onChange={e => { setWorkBillId(e.target.value); }}
                >
                    <option value="">Load Pending Order...</option>
                    {bills.filter(b => !reports.find(r => r.billId === b.id)).map(b => (
                        <option key={b.id} value={b.id}>{b.patientName} — {b.id}</option>
                    ))}
                </select>

                {workBillId && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-top-4">
                        {bills.find(b => b.id === workBillId).items.map(item => (
                            <div key={item.id} className="p-8 bg-slate-50/50 border border-slate-100 rounded-[2.5rem] shadow-inner">
                                <h4 className="text-[10px] font-black text-indigo-600 uppercase mb-6 tracking-widest">
                                    {item.name}
                                </h4>
                                <div className="grid grid-cols-2 gap-6">
                                    {Object.entries(item.ranges).map(([p, r]) => (
                                        <div key={p} className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                {p} ({r})
                                            </label>
                                            <input
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-base font-black outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                                                value={labValues[item.id]?.[p] || ''}
                                                onChange={e => setLabValues({ ...labValues, [item.id]: { ...(labValues[item.id] || {}), [p]: e.target.value } })}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <button
                            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                            onClick={() => { validateReport(); }}
                        >
                            Sign & Issue Record
                        </button>
                    </div>
                )}
            </div>
        </Card>

        <Card title="Validated Vault" icon={CheckCircle} noPadding>
            <div className="p-6 border-b">
                <input
                    placeholder="Search reports..."
                    value={''}
                    onChange={() => { }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                />
            </div>

            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <tr>
                        <th className="px-8 py-5">Record ID</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {reports.map(r => (
                        <tr key={r.id} className="hover:bg-slate-50/50 group transition-colors">
                            <td className="px-8 py-5 font-black text-indigo-500 uppercase tracking-tighter">
                                {r.id} <span className="text-slate-400 ml-2 font-bold">({r.patientName})</span>
                            </td>
                            <td className="px-8 py-5 text-right">
                                <div className="flex justify-end gap-1">
                                    <button
                                        onClick={() => { setWorkBillId(r.billId); setReports(reports.filter(x => x.id !== r.id)); }}
                                        className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-xl"
                                        title="Correct Result"
                                    >
                                        ↺
                                    </button>
                                    <button
                                        onClick={() => { if (window.confirm("Delete?")) { setReports(reports.filter(x => x.id !== r.id)); } }}
                                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"
                                        title="Delete"
                                    >
                                        ✖
                                    </button>
                                    <button className="h-10 w-10 p-0 ml-1 rounded-xl bg-transparent">
                                        Print
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Card>
    </div>
);

export default ReportsPanel;
