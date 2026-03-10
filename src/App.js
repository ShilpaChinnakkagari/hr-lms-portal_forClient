import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import Login from './pages/Login';
import HRDashboard from './pages/HR/Dashboard';
import Employees from './pages/HR/Employees';
import LeaveManagement from './pages/HR/LeaveManagement';
import EmployeeDashboard from './pages/Employee/Dashboard';
import ApplyLeave from './pages/Employee/ApplyLeave';
import EmployeeProfile from './pages/Employee/Profile';
import SalaryUpload from './pages/HR/SalaryUpload';
import SalaryReports from './pages/HR/SalaryReports';
import SalarySlips from './pages/Employee/SalarySlips';
import HRSettings from './pages/HR/Settings';
import { checkUserIsHR } from './utils/hrAuth';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isHR, setIsHR] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Check if user has HR role in database
        const hasHRRole = await checkUserIsHR(firebaseUser.email);
        setIsHR(hasHRRole);
      } else {
        setIsHR(false);
      }
      
      setLoading(false);
      setChecking(false);
    });
    
    return unsubscribe;
  }, []);

  if (loading || checking) {
    return (
      <div style={{ 
        height: "100vh", 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center",
        backgroundColor: "#f3f4f6"
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* HR Routes - only if user has HR role in database */}
        <Route path="/hr/dashboard" element={isHR ? <HRDashboard /> : <Navigate to="/employee/dashboard" />} />
        <Route path="/hr/employees" element={isHR ? <Employees /> : <Navigate to="/employee/dashboard" />} />
        <Route path="/hr/leave-management" element={isHR ? <LeaveManagement /> : <Navigate to="/employee/dashboard" />} />
        <Route path="/hr/settings" element={isHR ? <HRSettings /> : <Navigate to="/employee/dashboard" />} />
        <Route path="/hr/salary-upload" element={isHR ? <SalaryUpload /> : <Navigate to="/employee/dashboard" />} />
        <Route path="/hr/salary-reports" element={isHR ? <SalaryReports /> : <Navigate to="/employee/dashboard" />} />
        
        {/* Employee Routes - for all authenticated users who are not HR */}
        <Route path="/employee/dashboard" element={!isHR ? <EmployeeDashboard /> : <Navigate to="/hr/dashboard" />} />
        <Route path="/employee/apply-leave" element={!isHR ? <ApplyLeave /> : <Navigate to="/hr/dashboard" />} />
        <Route path="/employee/profile" element={!isHR ? <EmployeeProfile /> : <Navigate to="/hr/dashboard" />} />
        <Route path="/employee/salary-slips" element={!isHR ? <SalarySlips /> : <Navigate to="/hr/dashboard" />} />
        
        {/* Default Route */}
        <Route path="/" element={<Navigate to={isHR ? "/hr/dashboard" : "/employee/dashboard"} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;