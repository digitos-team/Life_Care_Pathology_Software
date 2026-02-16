
// import {
//     LayoutDashboard, TrendingDown, Microscope, Stethoscope,
//     Database, CreditCard, ClipboardList, Settings2, DollarSign, Tag

// } from 'lucide-react';

// export const NAV_MENU = [
//     { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin'], path: '/dashboard' },
//     { id: 'receptionist-dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Operator'], path: '/receptionist-dashboard' },
//     { id: 'expenses', label: 'Expenses', icon: TrendingDown, roles: ['Admin'], path: '/expenses' },
//     { id: 'revenue', label: 'Revenue', icon: DollarSign, roles: ['Admin'], path: '/revenue' },
//     { id: 'discounts', label: 'Discounts', icon: Tag, roles: ['Admin'], path: '/discounts' },
//     { id: 'tests', label: 'Tests', icon: Microscope, roles: ['Admin'], path: '/tests' },
//     { id: 'doctors', label: 'Doctors', icon: Stethoscope, roles: ['Admin'], path: '/doctors' },
//     { id: 'patients', label: 'Patients', icon: Database, roles: ['Admin', 'Operator'], path: '/patients' },
//     { id: 'assign-tests', label: 'Assign Tests', icon: Microscope, roles: ['Operator'], path: '/assign-tests' },
//     { id: 'billing', label: 'Billing', icon: CreditCard, roles: ['Operator'], path: '/billing' },
//     { id: 'reports', label: 'Reports', icon: ClipboardList, roles: ['Operator'], path: '/reports' },
//     { id: 'settings', label: 'Settings', icon: Settings2, roles: ['Admin'], path: '/settings' },
// ];
import {
    LayoutDashboard, TrendingDown, Microscope, Stethoscope,
    Database, CreditCard, ClipboardList, Settings2, DollarSign, Tag, Layers, Coins, Building2, Package
} from 'lucide-react';

export const NAV_MENU = [
    // Admin dashboard
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin'], path: '/dashboard' },
    // Receptionist dashboard
    { id: 'receptionist-dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Operator'], path: '/receptionist-dashboard' },

    // Shared & Receptionist routes in requested order
    { id: 'patients', label: 'Patients', icon: Database, roles: ['Admin', 'Operator'], path: '/patients' },
    { id: 'pending-orders', label: 'Pending Test Reports', icon: ClipboardList, roles: ['Operator'], path: '/pending-orders' },
    { id: 'reports', label: 'Reports', icon: ClipboardList, roles: ['Operator'], path: '/reports' },
    { id: 'billing', label: 'Billing', icon: CreditCard, roles: ['Operator'], path: '/billing' },

    // Admin routes
    { id: 'expenses', label: 'Expenses', icon: TrendingDown, roles: ['Admin'], path: '/expenses' },
    { id: 'billing-admin', label: 'Billing', icon: CreditCard, roles: ['Admin'], path: '/admin-billing' },
    { id: 'revenue', label: 'Revenue', icon: DollarSign, roles: ['Admin'], path: '/revenue' },
    { id: 'discounts', label: 'Discounts', icon: Tag, roles: ['Admin'], path: '/discounts' },
    { id: 'departments', label: 'Departments', icon: Building2, roles: ['Admin'], path: '/departments' },
    { id: 'specializations', label: 'Specializations', icon: Layers, roles: ['Admin'], path: '/specializations' },
    { id: 'commission', label: 'Commission Analytics', icon: Coins, roles: ['Admin'], path: '/commission' },
    { id: 'tests', label: 'Tests', icon: Microscope, roles: ['Admin'], path: '/tests' },
    { id: 'test-packages', label: 'Test Packages', icon: Package, roles: ['Admin'], path: '/test-packages' },
    { id: 'doctors', label: 'Doctors', icon: Stethoscope, roles: ['Admin'], path: '/doctors' },
    { id: 'settings', label: 'Settings', icon: Settings2, roles: ['Admin'], path: '/settings' },
];
