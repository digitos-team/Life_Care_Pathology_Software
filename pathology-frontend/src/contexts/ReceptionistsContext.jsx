import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

// APIs - Receptionist-specific data fetching
import { getPatients } from '../api/receptionist/patient.api';
import { getDoctors } from '../api/admin/doctors.api';
import { getLabTests } from '../api/admin/labTest.api';
import { getLabDetails } from '../api/admin/lab.api';
import { getDepartments } from '../api/admin/department.api';

export const ReceptionistContext = createContext(null);

export const ReceptionistProvider = ({ children }) => {
    // Global Data State
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [bills, setBills] = useState([]);
    const [sampleQueue, setSampleQueue] = useState([]);
    const [labTests, setLabTests] = useState([]);
    const [departments, setDepartments] = useState([]);

    // Lab Configuration
    const [labConfig, setLabConfig] = useState(null);

    // Loading States
    const [loading, setLoading] = useState(false);

    // Derived Metrics
    const todayDate = new Date().toLocaleDateString();

    const metrics = useMemo(() => {
        const billsArray = Array.isArray(bills) ? bills : [];
        const doctorsArray = Array.isArray(doctors) ? doctors : [];

        const dailyCollection = billsArray.filter(b => b.date === todayDate).reduce((acc, b) => acc + b.finalAmount, 0);

        const docRanking = doctorsArray.map(d => ({
            ...d,
            billCount: billsArray.filter(b => b.doctorId === d.id).length,
            revenue: billsArray.filter(b => b.doctorId === d.id).reduce((acc, b) => acc + b.finalAmount, 0)
        })).sort((a, b) => b.revenue - a.revenue);

        return { dailyCollection, docRanking };
    }, [bills, doctors, todayDate]);


    // Initial Data Fetch
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch all initial data
            const [pData, dData, tData, lData, depData] = await Promise.all([
                getPatients().catch(err => { console.error("Patients fetch failed", err); return null; }),
                getDoctors().catch(err => { console.error("Doctors fetch failed", err); return null; }),
                getLabTests().catch(err => { console.error("Lab Tests fetch failed", err); return null; }),
                getLabDetails().catch(err => { console.error("Lab details fetch failed", err); return null; }),
                getDepartments().catch(err => { console.error("Departments fetch failed", err); return null; })
            ]);

            console.log('ReceptionistsContext - Raw API responses:', { pData, dData, tData });

            // Extract patients - handle nested structure
            if (pData) {
                const patientsList = pData.data?.data?.patients || pData.data?.patients || pData.data?.data || pData.data || [];
                setPatients(Array.isArray(patientsList) ? patientsList : []);
                console.log('ReceptionistsContext - Patients extracted:', patientsList.length);
            }

            // Extract doctors - handle nested structure
            if (dData) {
                const doctorsList = dData.data?.doctors || dData.data?.data || dData.data || [];
                setDoctors(Array.isArray(doctorsList) ? doctorsList : []);
                console.log('ReceptionistsContext - Doctors extracted:', doctorsList.length);
            }

            // Extract lab tests - handle nested structure
            if (tData) {
                const testsList = tData.data?.data || tData.data || [];
                setLabTests(Array.isArray(testsList) ? testsList : []);
                console.log('ReceptionistsContext - Lab Tests extracted:', testsList.length);
            }

            // Extract lab details
            if (lData) {
                setLabConfig(lData.data || lData);
            }

            // Extract departments
            if (depData) {
                const deptList = depData.data || depData || [];
                setDepartments(Array.isArray(deptList) ? deptList : []);
                console.log('ReceptionistsContext - Departments extracted:', deptList.length);
            }

        } catch (err) {
            console.error("Failed to fetch initial data", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (localStorage.getItem('accessToken')) {
            fetchData();
        }
    }, [fetchData]);

    const updateLabSettings = (newSettings) => {
        setLabConfig(prev => ({ ...prev, ...newSettings }));
    };

    return (
        <ReceptionistContext.Provider value={{
            patients, setPatients,
            doctors, setDoctors,
            bills, setBills,
            sampleQueue, setSampleQueue,
            labTests, setLabTests,
            departments, setDepartments,
            labConfig, updateLabSettings,
            metrics,
            loading,
            refreshData: fetchData
        }}>
            {children}
        </ReceptionistContext.Provider>
    );
};

export const useReceptionist = () => {
    const context = useContext(ReceptionistContext);
    if (!context) {
        throw new Error('useReceptionist must be used within a ReceptionistProvider');
    }
    return context;
};