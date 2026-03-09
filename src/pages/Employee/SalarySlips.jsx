import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function SalarySlips() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [salarySlips, setSalarySlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchSalarySlips(currentUser);
      } else {
        navigate('/login');
      }
    });
    return unsubscribe;
  }, [navigate]);

  const fetchSalarySlips = async (currentUser) => {
    try {
      const slipsRef = collection(db, "salarySlips");
      const slipsQuery = query(
        slipsRef,
        where("employeeEmail", "==", currentUser.email)
      );
      
      const slipsSnap = await getDocs(slipsQuery);
      
      const slips = slipsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setSalarySlips(slips);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching salary slips:", error);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const downloadPDF = (slip) => {
    const doc = new jsPDF();
    
    // Company Header
    doc.setFontSize(20);
    doc.setTextColor(0, 51, 102);
    doc.text("HR LMS PORTAL", 105, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.text("SALARY SLIP", 105, 30, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Month: ${slip.month}`, 20, 45);
    
    // Employee Details
    doc.setFontSize(11);
    doc.text(`Employee Name: ${slip.employeeName}`, 20, 60);
    doc.text(`Employee ID: ${slip.employeeId}`, 20, 68);
    doc.text(`Email: ${slip.employeeEmail}`, 20, 76);
    
    const allowances = (slip.hra || 0) + (slip.da || 0) + (slip.conveyance || 0) + 
                      (slip.medical || 0) + (slip.bonus || 0);
    const deductions = (slip.pf || 0) + (slip.professionalTax || 0) + (slip.incomeTax || 0);
    
    // Salary Table
    autoTable(doc, {
      startY: 100,
      head: [['Earnings', 'Amount (₹)', 'Deductions', 'Amount (₹)']],
      body: [
        ['Basic Salary', slip.basic || 0, 'PF', slip.pf || 0],
        ['HRA', slip.hra || 0, 'Professional Tax', slip.professionalTax || 0],
        ['DA', slip.da || 0, 'Income Tax', slip.incomeTax || 0],
        ['Conveyance', slip.conveyance || 0, '', ''],
        ['Medical', slip.medical || 0, '', ''],
        ['Bonus', slip.bonus || 0, '', ''],
        ['', '', '', ''],
        ['Total Earnings', (slip.basic || 0) + allowances, 'Total Deductions', deductions]
      ],
      foot: [['NET SALARY', `₹${slip.netSalary || 0}`, '', '']],
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
    });
    
    // Footer
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, doc.lastAutoTable.finalY + 20);
    doc.text("This is a computer generated salary slip.", 20, doc.lastAutoTable.finalY + 28);
    
    doc.save(`Salary_${slip.employeeName}_${slip.month}.pdf`);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('en-IN');
    }
    return timestamp;
  };

  if (loading) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f3f4f6"
      }}>
        Loading your salary slips...
      </div>
    );
  }

  const styles = {
    container: {
      display: "flex",
      height: "100vh",
      width: "100vw",
      fontFamily: "sans-serif",
      overflow: "hidden"
    },
    sidebar: {
      width: sidebarCollapsed ? "70px" : "250px",
      backgroundColor: "#111827",
      color: "white",
      height: "100vh",
      transition: "width 0.3s ease",
      display: "flex",
      flexDirection: "column",
      position: "relative"
    },
    toggleButton: {
      position: "absolute",
      right: "-12px",
      top: "20px",
      width: "24px",
      height: "24px",
      backgroundColor: "#374151",
      border: "2px solid #111827",
      borderRadius: "50%",
      color: "white",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "12px",
      zIndex: 10
    },
    sidebarHeader: {
      padding: sidebarCollapsed ? "20px 0" : "24px 20px",
      borderBottom: "1px solid #1f2937",
      textAlign: sidebarCollapsed ? "center" : "left"
    },
    logo: {
      fontSize: "20px",
      fontWeight: "600",
      margin: 0
    },
    sidebarMenu: {
      flex: 1,
      padding: sidebarCollapsed ? "20px 0" : "20px",
      display: "flex",
      flexDirection: "column",
      gap: "5px"
    },
    menuItem: {
      padding: sidebarCollapsed ? "12px 0" : "12px 16px",
      borderRadius: "6px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: sidebarCollapsed ? "center" : "flex-start",
      gap: "12px",
      color: "#9ca3af"
    },
    activeMenuItem: {
      backgroundColor: "#374151",
      color: "white"
    },
    logoutButton: {
      margin: sidebarCollapsed ? "10px" : "20px",
      padding: sidebarCollapsed ? "12px 0" : "12px",
      backgroundColor: "#dc2626",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: sidebarCollapsed ? "center" : "flex-start",
      gap: "12px"
    },
    mainContent: {
      flex: 1,
      backgroundColor: "#f9fafb",
      padding: "32px",
      overflowY: "auto"
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "32px"
    },
    welcome: {
      fontSize: "28px",
      fontWeight: "600",
      margin: "0 0 8px 0"
    },
    subtitle: {
      fontSize: "16px",
      color: "#6b7280",
      margin: 0
    },
    userInfo: {
      display: "flex",
      alignItems: "center",
      gap: "15px",
      backgroundColor: "white",
      padding: "8px 16px",
      borderRadius: "8px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
    },
    userEmail: {
      fontSize: "14px",
      color: "#4b5563"
    },
    userAvatar: {
      width: "32px",
      height: "32px",
      borderRadius: "50%",
      backgroundColor: "#3b82f6",
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "600"
    },
    statsContainer: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "20px",
      marginBottom: "32px"
    },
    statCard: {
      backgroundColor: "white",
      padding: "20px",
      borderRadius: "12px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      textAlign: "center"
    },
    statValue: {
      fontSize: "28px",
      fontWeight: "600",
      color: "#059669"
    },
    statLabel: {
      fontSize: "14px",
      color: "#6b7280",
      marginTop: "5px"
    },
    slipsContainer: {
      backgroundColor: "white",
      borderRadius: "12px",
      overflow: "auto",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: "800px"
    },
    tableHeader: {
      backgroundColor: "#f9fafb",
      padding: "16px",
      textAlign: "left",
      fontSize: "12px",
      fontWeight: "600",
      color: "#6b7280",
      borderBottom: "1px solid #e5e7eb"
    },
    tableRow: {
      borderBottom: "1px solid #e5e7eb"
    },
    tableCell: {
      padding: "16px",
      fontSize: "14px"
    },
    monthCell: {
      fontWeight: "600",
      color: "#111827"
    },
    amountCell: {
      fontWeight: "500",
      color: "#059669"
    },
    downloadButton: {
      padding: "6px 12px",
      backgroundColor: "#3b82f6",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "12px"
    },
    emptyState: {
      textAlign: "center",
      padding: "48px",
      color: "#9ca3af"
    }
  };

  const totalEarnings = salarySlips.reduce((sum, slip) => sum + (slip.netSalary || 0), 0);
  const averageSalary = salarySlips.length > 0 ? totalEarnings / salarySlips.length : 0;

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={styles.toggleButton}>
          {sidebarCollapsed ? '→' : '←'}
        </button>
        <div style={styles.sidebarHeader}>
          {sidebarCollapsed ? <span style={{ fontSize: "24px" }}>👤</span> : <h2 style={styles.logo}>Employee Portal</h2>}
        </div>
        <div style={styles.sidebarMenu}>
          <div style={styles.menuItem} onClick={() => navigate('/employee/dashboard')}>📊{!sidebarCollapsed && " Dashboard"}</div>
          <div style={styles.menuItem} onClick={() => navigate('/employee/apply-leave')}>✈️{!sidebarCollapsed && " Apply Leave"}</div>
          <div style={styles.menuItem} onClick={() => navigate('/employee/profile')}>👤{!sidebarCollapsed && " My Profile"}</div>
          <div style={{...styles.menuItem, ...styles.activeMenuItem}} onClick={() => navigate('/employee/salary-slips')}>💰{!sidebarCollapsed && " Salary Slips"}</div>
        </div>
        <button onClick={handleLogout} style={styles.logoutButton}>🚪{!sidebarCollapsed && " Logout"}</button>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.welcome}>My Salary History</h1>
            <p style={styles.subtitle}>View and download your salary slips</p>
          </div>
          <div style={styles.userInfo}>
            <span style={styles.userEmail}>{user?.email}</span>
            <div style={styles.userAvatar}>{user?.displayName?.charAt(0) || 'U'}</div>
          </div>
        </div>

        {/* Stats Cards */}
        {salarySlips.length > 0 && (
          <div style={styles.statsContainer}>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{salarySlips.length}</div>
              <div style={styles.statLabel}>Total Slips</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>₹{totalEarnings.toLocaleString()}</div>
              <div style={styles.statLabel}>Total Credited</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>₹{Math.round(averageSalary).toLocaleString()}</div>
              <div style={styles.statLabel}>Average Salary</div>
            </div>
          </div>
        )}

        {/* Salary Slips Table */}
        <div style={styles.slipsContainer}>
          {salarySlips.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No salary data added by HR yet</p>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>Month</th>
                  <th style={styles.tableHeader}>Basic</th>
                  <th style={styles.tableHeader}>Allowances</th>
                  <th style={styles.tableHeader}>Deductions</th>
                  <th style={styles.tableHeader}>Net Salary</th>
                  <th style={styles.tableHeader}>Added On</th>
                  <th style={styles.tableHeader}>Download</th>
                </tr>
              </thead>
              <tbody>
                {salarySlips.map((slip) => {
                  const allowances = (slip.hra || 0) + (slip.da || 0) + 
                                   (slip.conveyance || 0) + (slip.medical || 0) + 
                                   (slip.bonus || 0);
                  const deductions = (slip.pf || 0) + (slip.professionalTax || 0) + 
                                    (slip.incomeTax || 0);
                  
                  return (
                    <tr key={slip.id} style={styles.tableRow}>
                      <td style={{...styles.tableCell, ...styles.monthCell}}>{slip.month}</td>
                      <td style={styles.tableCell}>₹{slip.basic?.toLocaleString()}</td>
                      <td style={styles.tableCell}>₹{allowances.toLocaleString()}</td>
                      <td style={styles.tableCell}>₹{deductions.toLocaleString()}</td>
                      <td style={{...styles.tableCell, ...styles.amountCell}}>
                        ₹{slip.netSalary?.toLocaleString()}
                      </td>
                      <td style={styles.tableCell}>{formatDate(slip.generatedOn)}</td>
                      <td style={styles.tableCell}>
                        <button 
                          onClick={() => downloadPDF(slip)}
                          style={styles.downloadButton}
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default SalarySlips;