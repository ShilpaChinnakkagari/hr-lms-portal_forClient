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

const HR_EMAIL = "shilpa.btech.aws@gmail.com";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
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

  const isHR = user.email === HR_EMAIL;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/hr/dashboard" element={isHR ? <HRDashboard /> : <Navigate to="/employee/dashboard" />} />
        <Route path="/hr/employees" element={isHR ? <Employees /> : <Navigate to="/employee/dashboard" />} />
        <Route path="/hr/leave-management" element={isHR ? <LeaveManagement /> : <Navigate to="/employee/dashboard" />} />
        <Route path="/employee/dashboard" element={!isHR ? <EmployeeDashboard /> : <Navigate to="/hr/dashboard" />} />
        <Route path="/employee/apply-leave" element={!isHR ? <ApplyLeave /> : <Navigate to="/hr/dashboard" />} />
        <Route path="/" element={<Navigate to={isHR ? "/hr/dashboard" : "/employee/dashboard"} />} />
        <Route path="/employee/profile" element={
  !isHR ? <EmployeeProfile /> : <Navigate to="/hr/dashboard" />
} />
<Route path="/hr/salary-upload" element={
  user && user.email === HR_EMAIL ? <SalaryUpload /> : <Navigate to="/login" />
} />
<Route path="/hr/salary-reports" element={
  user && user.email === HR_EMAIL ? <SalaryReports /> : <Navigate to="/login" />
} />
<Route path="/employee/salary-slips" element={
  !isHR ? <SalarySlips /> : <Navigate to="/hr/dashboard" />
} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;