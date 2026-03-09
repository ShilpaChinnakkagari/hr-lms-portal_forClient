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
  const [saving, setSaving] = useState(false);
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

  // SAVE DATA ONLY - NO PDF GENERATION
  const handleSaveData = async () => {
    setSaving(true);
    
    try {
      for (let i = 0; i < excelData.length; i++) {
        const emp = excelData[i];
        
        const employeeData = {
          employeeId: emp.employeeId || emp.EmployeeID || `EMP${String(i + 1).padStart(3, '0')}`,
          employeeName: emp.employeeName || emp.Name || 'Unknown',
          employeeEmail: emp.employeeEmail || emp.Email || 'unknown@email.com',
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
        
        // Save to Firestore only - NO PDF
        await addDoc(collection(db, "salarySlips"), employeeData);
      }
      
      alert(`✅ Successfully saved ${excelData.length} salary records to database!`);
      setPreview(false);
      setExcelData([]);
      
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to save salary data");
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
        <h2 style={styles.logo}>HR Portal</h2>
        <div style={styles.menu}>
          <div style={styles.menuItem} onClick={() => handleNavigation('/hr/dashboard')}>Dashboard</div>
          <div style={styles.menuItem} onClick={() => handleNavigation('/hr/employees')}>Employees</div>
          <div style={styles.menuItem} onClick={() => handleNavigation('/hr/leave-management')}>Leave Management</div>
          <div style={{...styles.menuItem, ...styles.activeMenuItem}}>Salary Upload</div>
          <div style={styles.menuItem} onClick={() => handleNavigation('/hr/salary-reports')}>Salary Reports</div>
        </div>
        <button onClick={handleLogout} style={styles.logout}>Logout</button>
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        <h1 style={styles.pageTitle}>Salary Management</h1>
        <p style={styles.pageSubtitle}>Upload Excel and save salary data to database (No PDF generation)</p>

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
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              style={styles.fileInput}
              disabled={saving}
            />
          </div>
        </div>

        {/* Preview Section */}
        {preview && excelData.length > 0 && (
          <div style={styles.previewSection}>
            <h3 style={styles.sectionTitle}>Step 2: Save to Database</h3>
            <p>Found {excelData.length} employee records to save</p>
            <div style={styles.actionButtons}>
              <button
                onClick={() => setPreview(false)}
                style={styles.cancelButton}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveData}
                style={styles.saveButton}
                disabled={saving}
              >
                {saving ? 'Saving...' : '💾 Save to Database Only'}
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
  previewSection: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px"
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