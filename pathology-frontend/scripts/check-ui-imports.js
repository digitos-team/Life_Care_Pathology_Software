const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const files = [
  'src/components/Receptionist/PatientRegistry.jsx',
  'src/components/Receptionist/ReportsPanel.jsx',
  'src/components/Receptionist/BillingPanel.jsx',
  'src/components/Admin/AdminDashboard.jsx',
  'src/components/Admin/InventorySection.jsx',
  'src/components/Admin/SettingsSection.jsx',
  'src/components/Admin/ExpensesSection.jsx',
  'src/components/InventoryForm.jsx',
  'src/components/ReportModal.jsx'
];

files.forEach(f => {
  const fp = path.join(root, f);
  if (!fs.existsSync(fp)) { console.log(f + ' -- MISSING'); return; }
  const content = fs.readFileSync(fp,'utf8');
  const m = content.match(/import\s+\w+\s+from\s+['\"]([^'\"]+)['\"]/g);
  if (!m) { console.log(f + ' -- no imports?'); return; }
  m.forEach(impt => {
    const parts = impt.match(/from\s+['\"]([^'\"]+)['\"]/);
    if (!parts) return;
    const imp = parts[1];
    if (imp.includes('/ui/')) {
      const resolved = path.join(path.dirname(fp), imp) + '.jsx';
      const exists = fs.existsSync(resolved);
      console.log(f + ' -> ' + imp + ' -> ' + resolved + ' -> ' + (exists ? 'OK' : 'MISSING'));
    }
  });
});
