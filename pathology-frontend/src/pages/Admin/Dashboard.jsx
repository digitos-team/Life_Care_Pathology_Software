
import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import { IndianRupee, Users, Bell, TrendingUp, BarChart4, Microscope, Activity, Plus, FileText, TestTube } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTodayPatients } from '../../api/receptionist/patient.api';
import { getDailyStats } from '../../api/receptionist/testorder.api';

// Contexts
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';

// Reusable Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, isLoading, subtitle }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow h-32 flex flex-col justify-between">
        <div className="flex items-start justify-between">
            <div className={`p-2.5 rounded-lg ${color}`}>
                <Icon size={20} />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title.split(' ')[0]}</span>
        </div>
        <div className="space-y-1">
            {isLoading ? (
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
            ) : (
                <>
                    <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
                    <p className="text-sm text-gray-600 font-medium">{subtitle || title.split(' ').slice(1).join(' ')}</p>
                </>
            )}
        </div>
    </div>
);

// Reusable Quick Action Card Component
const QuickActionCard = ({ title, description, icon: Icon, color, onClick }) => (
    <button
        onClick={onClick}
        className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 text-left group"
    >
        <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${color} group-hover:scale-110 transition-transform duration-200`}>
                <Icon size={24} />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
            </div>
        </div>
    </button>
);

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Use Global Data Context instead of passed props
    const {
        patients = [],
        doctors = [],
        todayPatients = [],
        labTests = [],
        refreshTodayPatients,
        metrics = { dailyCollection: 0, monthlyExpenses: 0, totalExpenses: 0, monthlyRevenue: 0, totalRevenue: 0 },
        loading: contextLoading
    } = useAdmin();

    useEffect(() => {
        if (refreshTodayPatients) {
            refreshTodayPatients();
        }
        fetchDailyStats();
    }, []);

    const [dailyStats, setDailyStats] = useState({ totalOrders: 0, totalTests: 0 });

    const fetchDailyStats = async () => {
        try {
            const stats = await getDailyStats();
            setDailyStats(stats);
        } catch (error) {
            console.error(error);
        }
    };

    // System overview with real data
    const systemOverview = {
        totalPatients: metrics.totalPatients || 0,
        totalTests: labTests.length || 0,
        totalRevenue: metrics.totalRevenue || 0,
        totalExpenses: metrics.totalExpenses || 0
    };





    // Quick Actions based on user role
    const getQuickActions = () => {
        // If user is null for some reason, return empty
        if (!user) return [];

        const actions = [];

        if (user.role === 'RECEPTIONIST') {
            // Receptionist actions
            actions.push(
                {
                    title: 'Add Patient',
                    description: 'Register a new patient in the system',
                    icon: Plus,
                    color: 'text-blue-600 bg-blue-50',
                    action: () => navigate('/patients') // Navigate to patient registry
                },
                {
                    title: 'Generate Report',
                    description: 'Create and send patient reports',
                    icon: FileText,
                    color: 'text-green-600 bg-green-50',
                    action: () => navigate('/reports') // Navigate to reports
                }
            );
        } else if (user.role === 'Admin') {
            // Admin actions
            actions.push(
                {
                    title: 'Add Test',
                    description: 'Create new laboratory test types',
                    icon: TestTube,
                    color: 'text-purple-600 bg-purple-50',
                    action: () => navigate('/tests') // Navigate to tests section
                },
                {
                    title: 'Add Expense',
                    description: 'Record laboratory expenses',
                    icon: Bell,
                    color: 'text-orange-600 bg-orange-50',
                    action: () => navigate('/expenses') // Navigate to expenses section
                }
            );
        }

        return actions;
    };

    const formatCurrency = (amount) => {
        return `₹${(amount || 0).toLocaleString()}`;
    };

    const [expensePeriod, setExpensePeriod] = useState('monthly');

    return (
        <div className="space-y-8">
            {/* Daily Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                    { label: "Today's Net Revenue", val: formatCurrency(metrics.dailyCollection), color: "text-emerald-700 bg-emerald-50", icon: IndianRupee },
                    { label: "Total Patients", val: metrics.totalPatients || 0, color: "text-blue-700 bg-blue-50", icon: Users },
                    { label: `${expensePeriod.charAt(0).toUpperCase() + expensePeriod.slice(1)} Expenses`, val: formatCurrency(expensePeriod === 'monthly' ? metrics.monthlyExpenses : metrics.yearlyExpenses), color: "text-orange-700 bg-orange-50", icon: Bell, isExpense: true },
                    { label: "Monthly Net Revenue", val: metrics.monthlyRevenue ? formatCurrency(metrics.monthlyRevenue) : "₹ 0", color: "text-purple-700 bg-purple-50", icon: TrendingUp },
                ].map((m, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow h-32 flex flex-col justify-between">
                        <div className="flex items-start justify-between">
                            <div className={`p-2.5 rounded-lg ${m.color}`}>
                                <m.icon size={20} />
                            </div>
                            {m.isExpense ? (
                                <select
                                    value={expensePeriod}
                                    onChange={(e) => setExpensePeriod(e.target.value)}
                                    className="text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-transparent border-none outline-none cursor-pointer hover:text-indigo-600 transition-colors"
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            ) : (
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{m.label.split(' ')[0]}</span>
                            )}
                        </div>
                        <div className="space-y-1">
                            <p className="text-2xl font-bold text-gray-900 leading-none">{m.val}</p>
                            <p className="text-sm text-gray-600 font-medium">{m.label.split(' ').slice(1).join(' ')}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* System Overview Section */}
            <Card title="System Overview" icon={Activity}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <StatCard
                        title="Today's Patients"
                        value={contextLoading ? "..." : (todayPatients.length || 0).toLocaleString()}
                        icon={Users}
                        color="text-blue-700 bg-blue-50"
                        subtitle="Registered today Patients"
                    />
                    <StatCard
                        title="Net Revenue"
                        value={formatCurrency(systemOverview.totalRevenue)}
                        icon={TrendingUp}
                        color="text-emerald-700 bg-emerald-50"
                        subtitle="All-time revenue"
                    />
                    <StatCard
                        title="Total Expenses"
                        value={formatCurrency(systemOverview.totalExpenses)}
                        icon={Bell}
                        color="text-orange-700 bg-orange-50"
                        subtitle="All-time expenses"
                    />
                    <StatCard
                        title="Tests/Orders Today"
                        value={`${dailyStats.totalOrders} / ${dailyStats.totalTests}`}
                        icon={Microscope}
                        color="text-pink-700 bg-pink-50"
                        subtitle="Daily Activity"
                    />
                </div>
            </Card>

            {/* Today's Patients Section */}
            <Card title="Today's Registered Patients" icon={Users} noPadding>
                {contextLoading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="text-gray-500 mt-2">Loading today's patients...</p>
                    </div>
                ) : todayPatients.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <Users size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No patients registered today</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {todayPatients.map((patient) => (
                                    <tr key={patient._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                            {new Date(patient.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td
                                            className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 cursor-pointer hover:text-indigo-600 transition-colors"
                                            onClick={() => navigate(`/patient/${patient._id}`)}
                                        >
                                            {patient.fullName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                            {patient.phone}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => navigate(`/patient/${patient._id}`)}
                                                className="text-indigo-600 hover:text-indigo-900 font-medium"
                                            >
                                                View details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Quick Actions Section */}
            {/* {getQuickActions().length > 0 && (
                <Card title="Quick Actions" icon={Plus}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {getQuickActions().map((action, index) => (
                            <QuickActionCard
                                key={index}
                                title={action.title}
                                description={action.description}
                                icon={action.icon}
                                color={action.color}
                                onClick={action.action}
                            />
                        ))}
                    </div>
                </Card>
            )} */}

            {/* Receptionist Management & Recent Expenses (Admin Only) */}
        </div>
    );
};

export default AdminDashboard;
