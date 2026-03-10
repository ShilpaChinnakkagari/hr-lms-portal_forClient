import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import * as XLSX from 'xlsx';

function SalaryUpload() {
  const navigate = useNavigate();
  const [excelData, setExcelData] = useState([]);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [month, setMonth] = useState(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));
  const [validationErrors, setValidationErrors] = useState([]);
  const [validData, setValidData] = useState([]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    
    // Check if file exists
    if (!file) {
      alert('Please select a file');
      return;
    }

    // Check file type
    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid Excel file (.xlsx, .xls, .csv)');
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          alert('The uploaded file is empty');
          return;
        }

        setExcelData(jsonData);
        validateEmails(jsonData);
        setPreview(true);
      } catch (error) {
        console.error("Error parsing Excel:", error);
        alert('Error parsing Excel file. Please check the file format.');
      }
    };

    reader.onerror = () => {
      alert('Error reading file');
    };

    reader.readAsArrayBuffer(file);
  };

  const validateEmails = async (data) => {
    try {
      setValidationErrors([]);
      const errors = [];
      const valid = [];
      
      // Get all employee emails from database
      const usersRef = collection(db, "users");
      const usersSnap = await getDocs(usersRef);
      const employeeEmails = new Set(usersSnap.docs.map(doc => doc.data().email));
      
      // Check each record
      for (let i = 0; i < data.length; i++) {
        const emp = data[i];
        const email = emp.employeeEmail || emp.Email || emp.email;
        
        if (!email) {
          errors.push(`Row ${i + 1}: No email provided`);
        } else if (!employeeEmails.has(email)) {
          errors.push(`Row ${i + 1}: Email "${email}" is not a registered employee`);
        } else {
          valid.push(emp);
        }
      }
      
      setValidationErrors(errors);
      setValidData(valid);
    } catch (error) {
      console.error("Error validating emails:", error);
      alert('Error validating emails. Please try again.');
    }
  };

  const handleSaveData = async () => {
    if (validationErrors.length > 0 && validData.length === 0) {
      alert('No valid records to save. Please fix the errors first.');
      return;
    }

    setSaving(true);
    
    try {
      for (let i = 0; i < validData.length; i++) {
        const emp = validData[i];
        
        const employeeData = {
          employeeId: emp.employeeId || emp.EmployeeID || `EMP${String(i + 1).padStart(3, '0')}`,
          employeeName: emp.employeeName || emp.Name || 'Unknown',
          employeeEmail: emp.employeeEmail || emp.Email || emp.email,
          department: emp.department || emp.Department || 'Engineering',
          designation: emp.designation || emp.Designation || 'Employee',
          basic: Number(emp.basic || emp.Basic || 0),
          hra: Number(emp.hra || emp.HRA || 0),
          da: Number(emp.da || emp.DA || 0),
          conveyance: Number(emp.conveyance || emp.Conveyance || 0),
          medical: Number(emp.medical || emp.Medical || 0),
          bonus: Number(emp.bonus || emp.Bonus || 0),
          pf: Number(emp.pf || emp.PF || 0),
          professionalTax: Number(emp.professionalTax || emp.ProfessionalTax || 0),
          incomeTax: Number(emp.incomeTax || emp.IncomeTax || 0),
          month: month,
          year: new Date().getFullYear(),
          netSalary: (Number(emp.basic || 0) + Number(emp.hra || 0) + Number(emp.da || 0) + 
                     Number(emp.conveyance || 0) + Number(emp.medical || 0) + Number(emp.bonus || 0)) -
                    (Number(emp.pf || 0) + Number(emp.professionalTax || 0) + Number(emp.incomeTax || 0)),
          generatedOn: new Date(),
          generatedBy: auth.currentUser?.email
        };
        
        await addDoc(collection(db, "salarySlips"), employeeData);
      }
      
      const message = validationErrors.length > 0 
        ? `✅ Successfully saved ${validData.length} salary records! ${validationErrors.length} invalid records skipped.`
        : `✅ Successfully saved ${validData.length} salary records to database!`;
      
      alert(message);
      
      // Reset everything
      setPreview(false);
      setExcelData([]);
      setValidData([]);
      setValidationErrors([]);
      
      // Reset file input
      document.getElementById('file-upload').value = '';
      
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Failed to save salary data. Please try again.");
    } finally {
      setSaving(false);
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
        department: "Engineering",
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
        <div style={styles.sidebarHeader}>
          <h2 style={styles.logo}>HR Portal</h2>
        </div>
        
        <div style={styles.sidebarMenu}>
          <div style={styles.menuItem} onClick={() => handleNavigation('/hr/dashboard')}>
            Dashboard
          </div>
          <div style={styles.menuItem} onClick={() => handleNavigation('/hr/employees')}>
            Employees
          </div>
          <div style={styles.menuItem} onClick={() => handleNavigation('/hr/leave-management')}>
            Leave Management
          </div>
          <div style={{...styles.menuItem, ...styles.activeMenuItem}} onClick={() => handleNavigation('/hr/salary-upload')}>
            Salary Upload
          </div>
          <div style={styles.menuItem} onClick={() => handleNavigation('/hr/salary-reports')}>
            Salary Reports
          </div>
          <div style={styles.menuItem} onClick={() => handleNavigation('/hr/settings')}>
            Settings
          </div>
        </div>

        <button onClick={handleLogout} style={styles.logoutButton}>
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        <h1 style={styles.pageTitle}>Salary Management</h1>
        <p style={styles.pageSubtitle}>Upload Excel and save salary data to database</p>

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
          <div style={styles.buttonGroup}>
            <button onClick={downloadTemplate} style={styles.templateButton}>
              📥 Download Template
            </button>
            <input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              style={styles.fileInput}
              disabled={saving}
            />
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div style={styles.errorSection}>
            <h3 style={styles.errorTitle}>❌ Validation Errors ({validationErrors.length})</h3>
            <p style={styles.errorNote}>These records will be skipped:</p>
            <ul style={styles.errorList}>
              {validationErrors.map((error, index) => (
                <li key={index} style={styles.errorItem}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Valid Data Preview */}
        {validData.length > 0 && (
          <div style={styles.previewSection}>
            <h3 style={styles.sectionTitle}>Step 2: Review Valid Records ({validData.length})</h3>
            <p style={styles.successNote}>✅ These employees exist in database and will be saved:</p>
            
            <div style={styles.tableContainer}>
              <table style={styles.previewTable}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Name</th>
                    <th style={styles.tableHeader}>Email</th>
                    <th style={styles.tableHeader}>Basic</th>
                    <th style={styles.tableHeader}>Net Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {validData.map((emp, index) => {
                    const netSalary = (Number(emp.basic || 0) + Number(emp.hra || 0) + Number(emp.da || 0) + 
                                      Number(emp.conveyance || 0) + Number(emp.medical || 0) + Number(emp.bonus || 0) -
                                      Number(emp.pf || 0) - Number(emp.professionalTax || 0) - Number(emp.incomeTax || 0));
                    
                    return (
                      <tr key={index}>
                        <td style={styles.tableCell}>{emp.employeeName || emp.Name}</td>
                        <td style={styles.tableCell}>{emp.employeeEmail || emp.Email || emp.email}</td>
                        <td style={styles.tableCell}>₹{Number(emp.basic || emp.Basic || 0).toLocaleString()}</td>
                        <td style={styles.tableCell}>₹{netSalary.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={styles.actionButtons}>
              <button
                onClick={() => {
                  setPreview(false);
                  setExcelData([]);
                  setValidData([]);
                  setValidationErrors([]);
                  document.getElementById('file-upload').value = '';
                }}
                style={styles.cancelButton}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveData}
                style={styles.saveButton}
                disabled={saving || validData.length === 0}
              >
                {saving ? 'Saving...' : `💾 Save ${validData.length} Valid Records`}
              </button>
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
    flexDirection: "column"
  },
  sidebarHeader: {
    padding: "24px 20px",
    borderBottom: "1px solid #1f2937"
  },
  logo: {
    fontSize: "20px",
    fontWeight: "600",
    margin: 0,
    color: "white"
  },
  sidebarMenu: {
    flex: 1,
    padding: "20px",
    overflowY: "auto"
  },
  menuItem: {
    padding: "12px 16px",
    marginBottom: "4px",
    borderRadius: "8px",
    cursor: "pointer",
    color: "#9ca3af",
    fontSize: "14px",
    fontWeight: "500"
  },
  activeMenuItem: {
    backgroundColor: "#1f2937",
    color: "white"
  },
  logoutButton: {
    margin: "20px",
    padding: "12px",
    backgroundColor: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500"
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
    margin: "0 0 24px 0"
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
  errorSection: {
    backgroundColor: "#fee2e2",
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "20px",
    border: "1px solid #ef4444"
  },
  errorTitle: {
    fontSize: "16px",
    fontWeight: "600",
    margin: "0 0 8px 0",
    color: "#b91c1c"
  },
  errorNote: {
    fontSize: "14px",
    color: "#b91c1c",
    margin: "0 0 10px 0"
  },
  errorList: {
    margin: 0,
    paddingLeft: "20px"
  },
  errorItem: {
    fontSize: "13px",
    color: "#b91c1c",
    marginBottom: "4px"
  },
  previewSection: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px"
  },
  successNote: {
    fontSize: "14px",
    color: "#059669",
    margin: "0 0 15px 0"
  },
  tableContainer: {
    overflow: "auto",
    maxHeight: "300px",
    marginBottom: "20px"
  },
  previewTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px"
  },
  tableHeader: {
    textAlign: "left",
    padding: "10px",
    backgroundColor: "#f3f4f6",
    fontWeight: "600"
  },
  tableCell: {
    padding: "8px 10px",
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
  saveButton: {
    padding: "10px 20px",
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  }
};

export default SalaryUpload;