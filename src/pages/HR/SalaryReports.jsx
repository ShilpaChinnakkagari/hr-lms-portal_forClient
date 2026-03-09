import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import * as XLSX from 'xlsx';

function SalaryReports() {
  const navigate = useNavigate();
  const [salarySlips, setSalarySlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
    fetchSalarySlips();
  }, []);

  const fetchSalarySlips = async () => {
    try {
      const slipsQuery = query(collection(db, "salarySlips"), orderBy("generatedOn", "desc"));
      const slipsSnap = await getDocs(slipsQuery);
      const slipsData = slipsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSalarySlips(slipsData);
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

  const handleNavigation = (path) => {
    navigate(path);
  };

  const viewPDF = (pdfUrl) => {
    window.open(pdfUrl, '_blank');
  };

  const downloadPDF = (pdfUrl, fileName) => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    const exportData = salarySlips.map(slip => ({
      'Employee ID': slip.employeeId,
      'Employee Name': slip.employeeName,
      'Email': slip.employeeEmail,
      'Month': slip.month,
      'Basic': slip.basic,
      'HRA': slip.hra,
      'DA': slip.da,
      'Conveyance': slip.conveyance,
      'Medical': slip.medical,
      'Bonus': slip.bonus,
      'PF': slip.pf,
      'Professional Tax': slip.professionalTax,
      'Income Tax': slip.incomeTax,
      'Net Salary': slip.netSalary,
      'Generated On': slip.generatedOn?.toDate?.().toLocaleDateString() || slip.generatedOn
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Salary Reports");
    XLSX.writeFile(wb, `salary_reports_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredSlips = selectedMonth 
    ? salarySlips.filter(slip => slip.month === selectedMonth)
    : salarySlips;

  const uniqueMonths = [...new Set(salarySlips.map(slip => slip.month))];

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('en-IN');
    }
    return timestamp;
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div>Loading salary reports...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <h2 style={styles.logo}>HR Portal</h2>
        <div style={styles.menu}>
          <div style={styles.menuItem} onClick={() => handleNavigation('/hr/dashboard')}>Dashboard</div>
          <div style={styles.menuItem} onClick={() => handleNavigation('/hr/employees')}>Employees</div>
          <div style={styles.menuItem} onClick={() => handleNavigation('/hr/leave-management')}>Leave Management</div>
          <div style={styles.menuItem} onClick={() => handleNavigation('/hr/salary-upload')}>Salary Upload</div>
          <div style={{...styles.menuItem, ...styles.activeMenuItem}}>Salary Reports</div>
        </div>
        <button onClick={handleLogout} style={styles.logout}>Logout</button>
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.pageTitle}>Salary Reports</h1>
          <div style={styles.headerButtons}>
            <button onClick={() => handleNavigation('/hr/salary-upload')} style={styles.uploadButton}>
              📤 Go to Upload
            </button>
            <button onClick={exportToExcel} style={styles.exportButton}>
              📥 Export to Excel
            </button>
          </div>
        </div>
        <p style={styles.pageSubtitle}>View and download PDF salary slips</p>

        {/* Filters */}
        <div style={styles.filters}>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="">All Months</option>
            {uniqueMonths.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
          <div style={styles.stats}>
            Total Slips: {filteredSlips.length}
          </div>
        </div>

        {/* Summary Cards */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>💰</div>
            <div>
              <div style={styles.statLabel}>Total Salary Paid</div>
              <div style={styles.statValue}>
                ₹{filteredSlips.reduce((sum, slip) => sum + (slip.netSalary || 0), 0).toLocaleString()}
              </div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📊</div>
            <div>
              <div style={styles.statLabel}>Total Slips</div>
              <div style={styles.statValue}>{filteredSlips.length}</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📅</div>
            <div>
              <div style={styles.statLabel}>Unique Months</div>
              <div style={styles.statValue}>{uniqueMonths.length}</div>
            </div>
          </div>
        </div>

        {/* Salary Slips Table */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Employee</th>
                <th style={styles.tableHeader}>Month</th>
                <th style={styles.tableHeader}>Basic</th>
                <th style={styles.tableHeader}>HRA</th>
                <th style={styles.tableHeader}>DA</th>
                <th style={styles.tableHeader}>Conveyance</th>
                <th style={styles.tableHeader}>Medical</th>
                <th style={styles.tableHeader}>Bonus</th>
                <th style={styles.tableHeader}>PF</th>
                <th style={styles.tableHeader}>Prof Tax</th>
                <th style={styles.tableHeader}>Income Tax</th>
                <th style={styles.tableHeader}>Net Salary</th>
                <th style={styles.tableHeader}>PDF</th>
                <th style={styles.tableHeader}>Generated On</th>
              </tr>
            </thead>
            <tbody>
              {filteredSlips.map(slip => (
                <tr key={slip.id}>
                  <td style={styles.tableCell}>
                    <div style={styles.employeeName}>{slip.employeeName}</div>
                    <div style={styles.employeeEmail}>{slip.employeeEmail}</div>
                  </td>
                  <td style={styles.tableCell}>{slip.month}</td>
                  <td style={styles.tableCell}>₹{slip.basic?.toLocaleString()}</td>
                  <td style={styles.tableCell}>₹{slip.hra?.toLocaleString()}</td>
                  <td style={styles.tableCell}>₹{slip.da?.toLocaleString()}</td>
                  <td style={styles.tableCell}>₹{slip.conveyance?.toLocaleString()}</td>
                  <td style={styles.tableCell}>₹{slip.medical?.toLocaleString()}</td>
                  <td style={styles.tableCell}>₹{slip.bonus?.toLocaleString()}</td>
                  <td style={styles.tableCell}>₹{slip.pf?.toLocaleString()}</td>
                  <td style={styles.tableCell}>₹{slip.professionalTax?.toLocaleString()}</td>
                  <td style={styles.tableCell}>₹{slip.incomeTax?.toLocaleString()}</td>
                  <td style={{...styles.tableCell, fontWeight: "bold", color: "#059669"}}>
                    ₹{slip.netSalary?.toLocaleString()}
                  </td>
                  <td style={styles.tableCell}>
                    {slip.pdfUrl && (
                      <div style={styles.pdfButtons}>
                        <button 
                          onClick={() => viewPDF(slip.pdfUrl)}
                          style={styles.viewPdfButton}
                          title="View PDF"
                        >
                          👁️
                        </button>
                        <button 
                          onClick={() => downloadPDF(slip.pdfUrl, `Salary_${slip.employeeName}_${slip.month}.pdf`)}
                          style={styles.downloadPdfButton}
                          title="Download PDF"
                        >
                          ⬇️
                        </button>
                      </div>
                    )}
                  </td>
                  <td style={styles.tableCell}>{formatDate(slip.generatedOn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
  loadingContainer: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6"
  },
  sidebar: {
    width: "250px",
    backgroundColor: "#111827",
    color: "white",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    padding: "20px"
  },
  logo: {
    fontSize: "20px",
    fontWeight: "600",
    marginBottom: "30px"
  },
  menu: {
    flex: 1
  },
  menuItem: {
    padding: "10px",
    marginBottom: "5px",
    borderRadius: "6px",
    cursor: "pointer",
    color: "#9ca3af"
  },
  activeMenuItem: {
    backgroundColor: "#374151",
    color: "white"
  },
  logout: {
    padding: "10px",
    backgroundColor: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  },
  content: {
    flex: 1,
    backgroundColor: "#f9fafb",
    padding: "32px",
    overflowY: "auto"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px"
  },
  pageTitle: {
    fontSize: "28px",
    fontWeight: "600",
    margin: 0
  },
  headerButtons: {
    display: "flex",
    gap: "10px"
  },
  uploadButton: {
    padding: "10px 20px",
    backgroundColor: "#8b5cf6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px"
  },
  exportButton: {
    padding: "10px 20px",
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px"
  },
  pageSubtitle: {
    fontSize: "16px",
    color: "#6b7280",
    margin: "0 0 24px 0"
  },
  filters: {
    display: "flex",
    gap: "20px",
    marginBottom: "24px",
    alignItems: "center"
  },
  filterSelect: {
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    minWidth: "200px"
  },
  stats: {
    fontSize: "14px",
    color: "#6b7280"
  },
  statsGrid: {
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
    display: "flex",
    alignItems: "center",
    gap: "16px"
  },
  statIcon: {
    fontSize: "32px",
    backgroundColor: "#f3f4f6",
    width: "60px",
    height: "60px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "12px"
  },
  statLabel: {
    color: "#6b7280",
    fontSize: "14px",
    marginBottom: "4px"
  },
  statValue: {
    fontSize: "24px",
    fontWeight: "600"
  },
  tableContainer: {
    backgroundColor: "white",
    borderRadius: "12px",
    overflow: "auto",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1600px"
  },
  tableHeader: {
    textAlign: "left",
    padding: "16px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#6b7280",
    backgroundColor: "#f9fafb",
    borderBottom: "1px solid #e5e7eb"
  },
  tableCell: {
    padding: "12px",
    fontSize: "13px",
    borderBottom: "1px solid #e5e7eb"
  },
  employeeName: {
    fontSize: "13px",
    fontWeight: "500"
  },
  employeeEmail: {
    fontSize: "11px",
    color: "#6b7280"
  },
  pdfButtons: {
    display: "flex",
    gap: "8px"
  },
  viewPdfButton: {
    padding: "4px 8px",
    backgroundColor: "#f3f4f6",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px"
  },
  downloadPdfButton: {
    padding: "4px 8px",
    backgroundColor: "#e0f2fe",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px"
  }
};

export default SalaryReports;