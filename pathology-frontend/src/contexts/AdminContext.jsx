import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback
} from "react";

// APIs
import { getPatients, getTodayPatients, getTotalPatientCount } from "../api/receptionist/patient.api";
import { getDoctors } from "../api/admin/doctors.api";
import { getExpenses, getExpenseStats } from "../api/admin/expenses.api";
import { getLabTests } from "../api/admin/labTest.api";
import { getRevenueStats, getRevenueAnalytics } from "../api/admin/revenue.api";
import { getLabDetails, updateLabDetails } from "../api/admin/lab.api";

export const AdminContext = createContext(null);

export const AdminProvider = ({ children }) => {
  // Global Data State
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [todayPatients, setTodayPatients] = useState([]);
  const [totalPatientsCount, setTotalPatientsCount] = useState(0);

  // Revenue & Expense Stats
  const [revenueStats, setRevenueStats] = useState({ totalRevenue: 0, totalCommission: 0, netRevenue: 0 });
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [revenueAnalytics, setRevenueAnalytics] = useState({ yearlyTotal: {}, monthly: [], daily: [] });
  const [expenseStats, setExpenseStats] = useState({ monthlyTotal: 0, yearlyTotal: 0, allTimeTotal: 0 });

  // Lab Configuration
  const [labConfig, setLabConfig] = useState(null);

  // Loading State
  const [loading, setLoading] = useState(false);

  // Derived Metrics
  const metrics = useMemo(() => {
    // Current month revenue
    const currentMonth = new Date().getMonth() + 1;
    const monthlyRevenueData = revenueAnalytics.monthly?.find(m => m._id === currentMonth);
    const monthlyRevenue = monthlyRevenueData ? monthlyRevenueData.netRevenue : 0; // Use netRevenue

    return {
      dailyCollection: todayRevenue,
      totalRevenue: revenueStats.netRevenue, // Use netRevenue
      monthlyRevenue: monthlyRevenue,
      totalPatients: totalPatientsCount,
      monthlyExpenses: expenseStats.monthlyTotal,
      yearlyExpenses: expenseStats.yearlyTotal,
      totalExpenses: expenseStats.allTimeTotal,
    };
  }, [todayRevenue, revenueStats, revenueAnalytics, totalPatientsCount, expenseStats]);

  // Refresh functions
  const refreshTodayPatients = useCallback(async () => {
    try {
      const response = await getTodayPatients();
      setTodayPatients(response.data || []);
    } catch (err) {
      console.error("Failed to refresh today's patients", err);
    }
  }, []);

  const fetchAllStats = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

      const [
        pData,
        dData,
        eData,
        tData,
        tpData,
        tpcData,
        revStats,
        revToday,
        revAnalytics,
        expStats,
        lData
      ] = await Promise.all([
        getPatients().catch(() => ({ data: [] })),
        getDoctors().catch(() => ({ data: [] })),
        getExpenses().catch(() => ({ data: [] })),
        getLabTests().catch(() => ({ data: [] })),
        getTodayPatients().catch(() => ({ data: [] })),
        getTotalPatientCount().catch(() => ({ data: { totalPatients: 0 } })),
        getRevenueStats().catch(() => ({ data: { stats: {} } })),
        getRevenueStats({ startDate: startOfDay, endDate: endOfDay }).catch(() => ({ data: { stats: {} } })),
        getRevenueAnalytics(now.getFullYear()).catch(() => ({ data: { monthly: [] } })),
        getExpenseStats().catch(() => ({ monthlyTotal: 0, yearlyTotal: 0, allTimeTotal: 0 })),
        getLabDetails().catch(() => ({ data: null }))
      ]);

      const ensureArray = (data) => {
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.data)) return data.data;
        return [];
      };

      setPatients(ensureArray(pData));
      setDoctors(ensureArray(dData));
      setExpenses(ensureArray(eData));
      setLabTests(ensureArray(tData));
      setTodayPatients(tpData.data || []);
      setTotalPatientsCount(tpcData.data?.totalPatients || 0);
      setRevenueStats(revStats.data?.stats || { totalRevenue: 0, totalCommission: 0, netRevenue: 0 });
      setTodayRevenue(revToday.data?.stats?.netRevenue || 0); // Use netRevenue for daily collection
      setRevenueAnalytics(revAnalytics.data || { yearlyTotal: {}, monthly: [], daily: [] });
      setExpenseStats(expStats?.data || { monthlyTotal: 0, yearlyTotal: 0, allTimeTotal: 0 });
      setLabConfig(lData?.data || lData || null);

    } catch (err) {
      console.error("Failed to fetch admin data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial Data Fetch
  useEffect(() => {
    fetchAllStats();
  }, [fetchAllStats]);

  const updateLabSettings = async (newSettings) => {
    try {
      const response = await updateLabDetails(newSettings);
      if (response && (response.success || response.data)) {
        setLabConfig(response.data || response);
        return { success: true };
      }
      return { success: false, message: response?.message || "Failed to update settings" };
    } catch (error) {
      console.error("Update lab settings failed", error);
      return { success: false, message: error.message };
    }
  };

  return (
    <AdminContext.Provider
      value={{
        patients,
        setPatients,
        doctors,
        setDoctors,
        expenses,
        setExpenses,
        labTests,
        setLabTests,
        todayPatients,
        refreshTodayPatients,
        totalPatientsCount,
        revenueStats,
        todayRevenue,
        revenueAnalytics,
        expenseStats,
        labConfig,
        updateLabSettings,
        metrics,
        loading,
        refreshData: fetchAllStats
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};
