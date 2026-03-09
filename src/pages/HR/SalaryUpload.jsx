import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function SalaryUpload() {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [excelData, setExcelData] = useState([]);
  const [preview, setPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [month, setMonth] = useState(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));
  const [employees, setEmployees] = useState([]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      console.log("Excel Data:", jsonData);
      setExcelData(jsonData);
      setPreview(true);
    };
    
    reader.readAsArrayBuffer(file);
  };

  const generatePDF = async (employeeData) => {
    return new Promise(async (resolve) => {
      const doc = new jsPDF();
      
      // Company Header
      doc.setFontSize(20);
      doc.setTextColor(0, 51, 102);
      doc.text("HR LMS PORTAL", 105, 20, { align: 'center' });
      
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("SALARY SLIP", 105, 30, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`Month: ${month}`, 20, 45);
      
      // Employee Details
      doc.setFontSize(11);
      doc.text(`Employee Name: ${employeeData.employeeName}`, 20, 60);
      doc.text(`Employee ID: ${employeeData.employeeId}`, 20, 68);
      doc.text(`Email: ${employeeData.employeeEmail}`, 20, 76);
      doc.text(`Department: ${employeeData.department}`, 20, 84);
      doc.text(`Designation: ${employeeData.designation}`, 20, 92);
      
      // Salary Table
      const tableColumn = ["Earnings", "Amount (₹)", "Deductions", "Amount (₹)"];
      const tableRows = [
        ["Basic", employeeData.basic, "PF", employeeData.pf],
        ["HRA", employeeData.hra, "Professional Tax", employeeData.professionalTax],
        ["DA", employeeData.da, "Income Tax", employeeData.incomeTax],
        ["Conveyance", employeeData.conveyance, "", ""],
        ["Medical", employeeData.medical, "", ""],
        ["Bonus", employeeData.bonus, "", ""],
        ["", "", "", ""],
        ["Total Earnings", employeeData.totalEarnings, "Total Deductions", employeeData.totalDeductions]
      ];
      
      doc.autoTable({
        startY: 100,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [0, 51, 102] },
        foot: [["NET SALARY", `₹${employeeData.netSalary}`, "", ""]],
        footStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' }
      });
      
      // Footer
      const date = new Date();
      doc.setFontSize(10);
      doc.text(`Generated on: ${date.toLocaleDateString()}`, 20, doc.lastAutoTable.finalY + 20);
      doc.text("This is a system generated salary slip.", 20, doc.lastAutoTable.finalY + 28);
      
      // Save as blob
      const pdfBlob = doc.output('blob');
      resolve(pdfBlob);
    });
  };

  const uploadToStorage = async (pdfBlob, employeeEmail, month) => {
    const fileName = `salary_${employeeEmail}_${month.replace(/ /g, '_')}.pdf`;
    const storageRef = ref(storage, `salary-slips/${fileName}`);
    await uploadBytes(storageRef, pdfBlob);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  };

  const handleGenerateAll = async () => {
    setGenerating(true);
    
    try {
      // Fetch all employees from database
      const usersSnap = await getDocs(collection(db, "users"));
      const employeesData = usersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(emp => emp.role === 'employee');
      
      setEmployees(employeesData);
      
      // If Excel data is provided, use it, otherwise use employee data
      const salaryData = excelData.length > 0 ? excelData : employeesData;
      
      for (const emp of salaryData) {
        // Find matching employee in database
        const dbEmp = employeesData.find(e => e.email === emp.employeeEmail || e.email === emp.Email);
        
        if (!dbEmp) continue;
        
        const employeeData = {
          employeeId: dbEmp.id,
          employeeName: emp.employeeName || emp.Name || dbEmp.name,
          employeeEmail: emp.employeeEmail || emp.Email || dbEmp.email,
          department: dbEmp.department,
          designation: dbEmp.designation,
          basic: emp.basic || emp.Basic || 0,
          hra: emp.hra || emp.HRA || 0,
          da: emp.da || emp.DA || 0,
          conveyance: emp.conveyance || emp.Conveyance || 0,
          medical: emp.medical || emp.Medical || 0,
          bonus: emp.bonus || emp.Bonus || 0,
          pf: emp.pf || emp.PF || 0,
          professionalTax: emp.professionalTax || emp.ProfessionalTax || 0,
          incomeTax: emp.incomeTax || emp.IncomeTax || 0,
          totalEarnings: (emp.basic || 0) + (emp.hra || 0) + (emp.da || 0) + 
                        (emp.conveyance || 0) + (emp.medical || 0) + (emp.bonus || 0),
          totalDeductions: (emp.pf || 0) + (emp.professionalTax || 0) + (emp.incomeTax || 0),
          netSalary: (emp.basic || 0) + (emp.hra || 0) + (emp.da || 0) + 
                    (emp.conveyance || 0) + (emp.medical || 0) + (emp.bonus || 0) -
                    ((emp.pf || 0) + (emp.professionalTax || 0) + (emp.incomeTax || 0))
        };
        
        // Generate PDF
        const pdfBlob = await generatePDF(employeeData);
        
        // Upload to Storage
        const pdfUrl = await uploadToStorage(pdfBlob, employeeData.employeeEmail, month);
        
        // Save to Firestore
        await addDoc(collection(db, "salarySlips"), {
          ...employeeData,
          month: month,
          pdfUrl: pdfUrl,
          generatedOn: new Date(),
          generatedBy: auth.currentUser?.email
        });
      }
      
      alert(`Successfully generated salary slips for ${salaryData.length} employees!`);
      setPreview(false);
      setExcelData([]);
      
    } catch (error) {
      console.error("Error generating salary slips:", error);
      alert("Failed to generate salary slips. Please try again.");
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
        employeeEmail: "employee1@email.com",
        employeeName: "John Doe",
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
                    const earnings = (row.basic || 0) + (row.hra || 0) + (row.da || 0) + 
                                   (row.conveyance || 0) + (row.medical || 0) + (row.bonus || 0);
                    const deductions = (row.pf || 0) + (row.professionalTax || 0) + (row.incomeTax || 0);
                    const net = earnings - deductions;
                    
                    return (
                      <tr key={index}>
                        <td style={styles.tableCell}>
                          <div>{row.employeeName}</div>
                          <div style={{ fontSize: "11px", color: "#6b7280" }}>{row.employeeEmail}</div>
                        </td>
                        <td style={styles.tableCell}>₹{row.basic || 0}</td>
                        <td style={styles.tableCell}>₹{row.hra || 0}</td>
                        <td style={styles.tableCell}>₹{row.da || 0}</td>
                        <td style={styles.tableCell}>₹{row.conveyance || 0}</td>
                        <td style={styles.tableCell}>₹{row.medical || 0}</td>
                        <td style={styles.tableCell}>₹{row.bonus || 0}</td>
                        <td style={styles.tableCell}>₹{row.pf || 0}</td>
                        <td style={styles.tableCell}>₹{row.professionalTax || 0}</td>
                        <td style={styles.tableCell}>₹{row.incomeTax || 0}</td>
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
                {generating ? 'Generating...' : 'Generate All Salary Slips'}
              </button>
            </div>
          </div>
        )}

        {generating && (
          <div style={styles.loadingOverlay}>
            <div style={styles.loadingBox}>
              <div style={styles.spinner}></div>
              <p>Generating salary slips... Please wait.</p>
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

export default SalaryUpload;