import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';

function SalaryUpload() {
  const navigate = useNavigate();
  const [excelData, setExcelData] = useState([]);
  const [preview, setPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [month, setMonth] = useState(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      setExcelData(jsonData);
      setPreview(true);
    };
    
    reader.readAsArrayBuffer(file);
  };

  const handleGenerateAll = async () => {
    setGenerating(true);
    
    try {
      // Create a new workbook
      const wb = XLSX.utils.book_new();
      
      // Prepare data for Excel
      const salaryData = excelData.map(emp => {
        const basic = Number(emp.basic || emp.Basic || 0);
        const hra = Number(emp.hra || emp.HRA || 0);
        const da = Number(emp.da || emp.DA || 0);
        const conveyance = Number(emp.conveyance || emp.Conveyance || 0);
        const medical = Number(emp.medical || emp.Medical || 0);
        const bonus = Number(emp.bonus || emp.Bonus || 0);
        const pf = Number(emp.pf || emp.PF || 0);
        const professionalTax = Number(emp.professionalTax || emp.ProfessionalTax || 0);
        const incomeTax = Number(emp.incomeTax || emp.IncomeTax || 0);
        
        const totalEarnings = basic + hra + da + conveyance + medical + bonus;
        const totalDeductions = pf + professionalTax + incomeTax;
        const netSalary = totalEarnings - totalDeductions;
        
        return {
          'Employee ID': emp.employeeId || emp.EmployeeID || '',
          'Employee Name': emp.employeeName || emp.Name || '',
          'Employee Email': emp.employeeEmail || emp.Email || '',
          'Month': month,
          'Basic Salary': basic,
          'HRA': hra,
          'DA': da,
          'Conveyance': conveyance,
          'Medical': medical,
          'Bonus': bonus,
          'PF': pf,
          'Professional Tax': professionalTax,
          'Income Tax': incomeTax,
          'Net Salary': netSalary
        };
      });
      
      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(salaryData);
      XLSX.utils.book_append_sheet(wb, ws, "Salary Slips");
      
      // Generate Excel file (fast!)
      XLSX.writeFile(wb, `salary_slips_${month.replace(/ /g, '_')}.xlsx`);
      
      // Save to Firestore (optional - remove if you don't need history)
      for (const emp of excelData) {
        const basic = Number(emp.basic || emp.Basic || 0);
        const hra = Number(emp.hra || emp.HRA || 0);
        const da = Number(emp.da || emp.DA || 0);
        const conveyance = Number(emp.conveyance || emp.Conveyance || 0);
        const medical = Number(emp.medical || emp.Medical || 0);
        const bonus = Number(emp.bonus || emp.Bonus || 0);
        const pf = Number(emp.pf || emp.PF || 0);
        const professionalTax = Number(emp.professionalTax || emp.ProfessionalTax || 0);
        const incomeTax = Number(emp.incomeTax || emp.IncomeTax || 0);
        
        const totalEarnings = basic + hra + da + conveyance + medical + bonus;
        const totalDeductions = pf + professionalTax + incomeTax;
        
        await addDoc(collection(db, "salarySlips"), {
          employeeId: emp.employeeId || emp.EmployeeID || '',
          employeeEmail: emp.employeeEmail || emp.Email || '',
          employeeName: emp.employeeName || emp.Name || '',
          month: month,
          year: new Date().getFullYear(),
          basic: basic,
          hra: hra,
          da: da,
          conveyance: conveyance,
          medical: medical,
          bonus: bonus,
          pf: pf,
          professionalTax: professionalTax,
          incomeTax: incomeTax,
          netSalary: totalEarnings - totalDeductions,
          generatedOn: new Date(),
          generatedBy: auth.currentUser?.email
        });
      }
      
      alert(`Successfully generated Excel file with ${excelData.length} salary slips!`);
      setPreview(false);
      setExcelData([]);
      
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate salary slips. Check console.");
    } finally {
      setGenerating(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const downloadTemplate = () => {
    const template = [
      {
        employeeId: "EMP001",
        employeeName: "John Doe",
        employeeEmail: "john@example.com",
        basic: 30000,
        hra: 15000,
        da: 5000,
        conveyance: 2000,
        medical: 1250,
        bonus: 5000,
        pf: 3600,
        professionalTax: 200,
        incomeTax: 3000
      }
    ];
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(template);
    XLSX.utils.book_append_sheet(wb, ws, "Salary Template");
    XLSX.writeFile(wb, "salary_template.xlsx");
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <h2 style={styles.logo}>HR Portal</h2>
        <div style={styles.menu}>
          <div style={styles.menuItem} onClick={() => handleNavigation('/hr/dashboard')}>Dashboard</div>
          <div style={styles.menuItem} onClick={() => handleNavigation('/hr/employees')}>Employees</div>
          <div style={styles.menuItem} onClick={() => handleNavigation('/hr/leave-management')}>Leave Management</div>
          <div style={{...styles.menuItem, ...styles.activeMenuItem}}>Salary Upload</div>
        </div>
        <button onClick={handleLogout} style={styles.logout}>Logout</button>
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        <h1 style={styles.pageTitle}>Salary Management</h1>
        <p style={styles.pageSubtitle}>Upload Excel and generate salary slips for all employees</p>

        {/* Month Selection */}
        <div style={styles.monthSection}>
          <label style={styles.label}>Salary Month:</label>
          <input
            type="text"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={styles.monthInput}
            placeholder="e.g. March 2026"
          />
        </div>

        {/* Upload Section */}
        <div style={styles.uploadSection}>
          <h3 style={styles.sectionTitle}>Step 1: Upload Excel File</h3>
          <p style={styles.uploadNote}>
            Download template first, then upload filled Excel file
          </p>
          
          <div style={styles.buttonGroup}>
            <button onClick={downloadTemplate} style={styles.templateButton}>
              📥 Download Template
            </button>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              style={styles.fileInput}
              disabled={generating}
            />
          </div>
        </div>

        {/* Preview Section */}
        {preview && excelData.length > 0 && (
          <div style={styles.previewSection}>
            <h3 style={styles.sectionTitle}>Step 2: Preview Data</h3>
            
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Employee</th>
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
                  </tr>
                </thead>
                <tbody>
                  {excelData.map((row, index) => {
                    const earnings = (Number(row.basic) || 0) + (Number(row.hra) || 0) + 
                                   (Number(row.da) || 0) + (Number(row.conveyance) || 0) + 
                                   (Number(row.medical) || 0) + (Number(row.bonus) || 0);
                    const deductions = (Number(row.pf) || 0) + (Number(row.professionalTax) || 0) + 
                                      (Number(row.incomeTax) || 0);
                    const net = earnings - deductions;
                    
                    return (
                      <tr key={index}>
                        <td style={styles.tableCell}>
                          <div>{row.employeeName || row.Name}</div>
                          <div style={{ fontSize: "11px", color: "#6b7280" }}>{row.employeeEmail || row.Email}</div>
                        </td>
                        <td style={styles.tableCell}>₹{row.basic || row.Basic || 0}</td>
                        <td style={styles.tableCell}>₹{row.hra || row.HRA || 0}</td>
                        <td style={styles.tableCell}>₹{row.da || row.DA || 0}</td>
                        <td style={styles.tableCell}>₹{row.conveyance || row.Conveyance || 0}</td>
                        <td style={styles.tableCell}>₹{row.medical || row.Medical || 0}</td>
                        <td style={styles.tableCell}>₹{row.bonus || row.Bonus || 0}</td>
                        <td style={styles.tableCell}>₹{row.pf || row.PF || 0}</td>
                        <td style={styles.tableCell}>₹{row.professionalTax || row.ProfessionalTax || 0}</td>
                        <td style={styles.tableCell}>₹{row.incomeTax || row.IncomeTax || 0}</td>
                        <td style={{...styles.tableCell, fontWeight: "bold", color: "#059669"}}>
                          ₹{net}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={styles.actionButtons}>
              <button
                onClick={() => setPreview(false)}
                style={styles.cancelButton}
                disabled={generating}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateAll}
                style={styles.generateButton}
                disabled={generating}
              >
                {generating ? 'Generating...' : 'Generate Excel File'}
              </button>
            </div>
          </div>
        )}

        {generating && (
          <div style={styles.loadingOverlay}>
            <div style={styles.loadingBox}>
              <div style={styles.spinner}></div>
              <p>Generating Excel file... Please wait.</p>
            </div>
          </div>
        )}
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
  pageTitle: {
    fontSize: "28px",
    fontWeight: "600",
    margin: "0 0 8px 0"
  },
  pageSubtitle: {
    fontSize: "16px",
    color: "#6b7280",
    margin: "0 0 32px 0"
  },
  monthSection: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "20px"
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    marginBottom: "8px"
  },
  monthInput: {
    width: "300px",
    padding: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px"
  },
  uploadSection: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "20px"
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    margin: "0 0 10px 0"
  },
  uploadNote: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "15px"
  },
  buttonGroup: {
    display: "flex",
    gap: "15px",
    alignItems: "center"
  },
  templateButton: {
    padding: "10px 20px",
    backgroundColor: "#f3f4f6",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px"
  },
  fileInput: {
    padding: "8px",
    border: "1px dashed #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    flex: 1
  },
  previewSection: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px"
  },
  tableContainer: {
    overflowX: "auto",
    marginBottom: "20px"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1200px"
  },
  tableHeader: {
    textAlign: "left",
    padding: "12px",
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
  actionButtons: {
    display: "flex",
    gap: "15px",
    justifyContent: "flex-end"
  },
  cancelButton: {
    padding: "10px 20px",
    backgroundColor: "#f3f4f6",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  },
  generateButton: {
    padding: "10px 20px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  },
  loadingOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000
  },
  loadingBox: {
    backgroundColor: "white",
    padding: "32px",
    borderRadius: "12px",
    textAlign: "center"
  },
  spinner: {
    border: "4px solid #f3f4f6",
    borderTop: "4px solid #3b82f6",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    animation: "spin 1s linear infinite",
    margin: "0 auto 20px"
  }
};

// Add this for the spinner animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default SalaryUpload;