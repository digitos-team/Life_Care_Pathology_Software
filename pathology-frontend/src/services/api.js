// Lightweight in-memory service helpers for the app
function genId(prefix = '') {
  return `${prefix}${Date.now().toString(36).substr(-6).toUpperCase()}`;
}

export function upsertPatient(patientForm, patients) {
  if (patientForm.id) {
    const updated = patients.map(p => p.id === patientForm.id ? patientForm : p);
    return { patients: updated, createdId: null };
  }
  const newId = `P-${1000 + patients.length + 1}`;
  const newPatient = { ...patientForm, id: newId };
  return { patients: [...patients, newPatient], createdId: newId };
}

export function createInvoice({ billingTargetP, billingBasket, billingAdjustment, patients, doctors, todayDate }) {
  const pat = patients.find(p => p.id === billingTargetP) || { name: 'Unknown' };
  const sub = billingBasket.reduce((acc, t) => acc + (t.price || 0), 0);
  const disc = billingAdjustment.type === 'percent' ? (sub * (billingAdjustment.val / 100)) : Number(billingAdjustment.val || 0);
  const finalAmount = Math.round(sub + (sub * 0.05) - disc);
  const newBill = {
    id: `INV-${genId('')}`,
    patientId: billingTargetP,
    patientName: pat.name,
    doctorId: billingAdjustment.refDoc || null,
    items: billingBasket,
    finalAmount,
    date: todayDate,
  };

  const sample = { id: `SMP-${newBill.id.split('-')[1]}`, billId: newBill.id, patientName: pat.name, status: 'Pending', tests: billingBasket.length };

  let expense = null;
  if (billingAdjustment.refDoc) {
    const doc = doctors.find(d => d.id === billingAdjustment.refDoc);
    if (doc) {
      const comm = Math.round(finalAmount * (doc.commission / 100));
      expense = { id: Date.now(), category: 'Doctor Commission', amount: comm, date: todayDate, description: `Ref: ${newBill.id} (${doc.name})` };
    }
  }

  return { newBill, sample, expense };
}

export function finalizeReport({ workBillId, bills, labValues, todayDate }) {
  const b = bills.find(x => x.id === workBillId);
  if (!b) return null;
  const report = {
    id: `REP-${b.id.split('-')[1]}`,
    billId: b.id,
    patientName: b.patientName,
    items: b.items.map(i => ({ ...i, values: labValues[i.id] || {} })),
    date: todayDate,
    status: 'Completed',
  };
  return report;
}

export default {
  upsertPatient,
  createInvoice,
  finalizeReport,
};
