import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import { Calendar, Users, UserPlus, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { getDailyPatient, getTotalPatientCount } from '../../api/receptionist/patient.api';
import { getDailyStats } from '../../api/receptionist/testorder.api';
import { useToast } from '../../contexts/ToastContext';

const ReceptionistDashboard = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const today = new Date();
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1); // 1-indexed
    const [dailyData, setDailyData] = useState([]);
    const [dailyStats, setDailyStats] = useState({ totalOrders: 0, totalTests: 0 });
    const [totalLifetimePatients, setTotalLifetimePatients] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showCalendar, setShowCalendar] = useState(false);

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Fetch daily patient data
    const fetchDailyData = async () => {
        try {
            setLoading(true);
            const data = await getDailyPatient(selectedYear, selectedMonth);
            setDailyData(Array.isArray(data) ? data : []);

            // Also fetch daily stats
            const stats = await getDailyStats();
            setDailyStats(stats);

            // Fetch total lifetime patients
            const totalCountRes = await getTotalPatientCount();
            setTotalLifetimePatients(totalCountRes.data.totalPatients || 0);
        } catch (error) {
            console.error('Error fetching daily data:', error);
            showToast('Failed to fetch daily data', 'error');
            setDailyData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDailyData();
    }, [selectedYear, selectedMonth]);

    // Calculate today's patients
    const todayDay = today.getDate();
    const todayPatients = dailyData.find(d => d._id?.day === todayDay)?.totalPatients || 0;

    // Calculate total patients for the month
    const totalMonthPatients = dailyData.reduce((sum, d) => sum + (d.totalPatients || 0), 0);

    // Navigation handlers
    const handlePrevMonth = () => {
        if (selectedMonth === 1) {
            setSelectedMonth(12);
            setSelectedYear(selectedYear - 1);
        } else {
            setSelectedMonth(selectedMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (selectedMonth === 12) {
            setSelectedMonth(1);
            setSelectedYear(selectedYear + 1);
        } else {
            setSelectedMonth(selectedMonth + 1);
        }
    };

    // Generate calendar grid
    const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month - 1, 1).getDay();

    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth);

    const calendarDays = [];
    for (let i = 0; i < firstDay; i++) {
        calendarDays.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const patientCount = dailyData.find(d => d._id?.day === day)?.totalPatients || 0;
        calendarDays.push({ day, count: patientCount });
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                        Receptionist Dashboard
                    </h2>
                    <p className="text-slate-600 mt-1">
                        Overview of patient visits and activity
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <button
                            onClick={() => setShowCalendar(!showCalendar)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-sm font-medium ${showCalendar
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                        >
                            <Calendar size={16} />
                            Calendar
                        </button>

                        {showCalendar && (
                            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-slate-200 shadow-xl z-50 p-4 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                <div className="flex items-center justify-between mb-3">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handlePrevMonth(); }}
                                        className="p-1 rounded-md hover:bg-slate-100 transition-colors"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <h4 className="text-sm font-bold text-slate-800">
                                        {monthNames[selectedMonth - 1]} {selectedYear}
                                    </h4>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleNextMonth(); }}
                                        className="p-1 rounded-md hover:bg-slate-100 transition-colors"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>

                                {loading ? (
                                    <div className="py-10 text-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mx-auto"></div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-7 gap-1">
                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                                            <div key={day} className="text-center text-[10px] font-bold text-slate-400 py-1">
                                                {day}
                                            </div>
                                        ))}
                                        {calendarDays.map((dayData, index) => (
                                            <div
                                                key={index}
                                                className={`p-1 min-h-[32px] rounded-lg border flex flex-col items-center justify-center relative ${dayData === null
                                                    ? 'border-transparent'
                                                    : dayData.day === todayDay && selectedMonth === (today.getMonth() + 1) && selectedYear === today.getFullYear()
                                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                                                        : 'border-slate-50 hover:border-slate-200 bg-slate-50/50 text-slate-600'
                                                    }`}
                                            >
                                                {dayData && (
                                                    <>
                                                        <span className="text-[11px] font-semibold">{dayData.day}</span>
                                                        {dayData.count > 0 && (
                                                            <div className="absolute bottom-1 w-1 h-1 bg-emerald-500 rounded-full" />
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="mt-3 pt-2 border-t border-slate-100 flex justify-center">
                                    <button
                                        onClick={() => setShowCalendar(false)}
                                        className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-wider"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card noPadding>
                    <div className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>
                            <Users size={28} className="text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-600">
                                Total Registered
                            </p>
                            <p className="text-3xl font-bold text-slate-800">
                                {loading ? '...' : totalLifetimePatients}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card noPadding>
                    <div className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)' }}>
                            <UserPlus size={28} className="text-indigo-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-600">
                                Today's Patients
                            </p>
                            <p className="text-3xl font-bold text-slate-800">
                                {loading ? '...' : todayPatients}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card noPadding>
                    <div className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                            <Calendar size={28} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-600">
                                This Month
                            </p>
                            <p className="text-3xl font-bold text-slate-800">
                                {loading ? '...' : totalMonthPatients}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card noPadding>
                    <div className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)' }}>
                            <FileText size={28} className="text-pink-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-600">
                                Today's Orders / Tests
                            </p>
                            <p className="text-3xl font-bold text-slate-800">
                                {loading ? '...' : `${dailyStats.totalOrders} / ${dailyStats.totalTests}`}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                    onClick={() => navigate('/patients')}
                    className="p-6 rounded-2xl border border-slate-200 bg-white transition-all hover:shadow-lg hover:border-indigo-200 text-left group"
                >
                    <div className="p-3 w-fit rounded-xl bg-indigo-50 text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                        <Users size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">View All Patients</h3>
                    <p className="text-sm text-slate-600 mt-1">
                        Browse and manage patient records
                    </p>
                </button>

                <button
                    onClick={() => navigate('/patients/add')}
                    className="p-6 rounded-2xl border border-slate-200 bg-white transition-all hover:shadow-lg hover:border-emerald-200 text-left group"
                >
                    <div className="p-3 w-fit rounded-xl bg-emerald-50 text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                        <UserPlus size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Register New Patient</h3>
                    <p className="text-sm text-slate-600 mt-1">
                        Add a new patient to the system
                    </p>
                </button>
            </div>
        </div>
    );
};

export default ReceptionistDashboard;
