import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import EmployeeModal from './EmployeeModal';
import { getLeaveLimits } from '../../services/leaveLimitsService';

function Employees() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Dynamic default leave limits from Firebase
  const [defaultLeaveLimits, setDefaultLeaveLimits] = useState({
    cas: 12,
    sic: 10,
    ear: 15,
    mar: 5,
    ber: 3
  });

  useEffect(() => {
    fetchEmployees();
    fetchLeaveLimits();
  }, []);

  const fetchLeaveLimits = async () => {
    try {
      const limits = await getLeaveLimits();
      setDefaultLeaveLimits(limits);
    } catch (error) {
      console.error("Error fetching limits:", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const employeesData = usersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmployees(employeesData);
      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingId(null);
    setShowForm(true);
  };

  const handleEditClick = (employee) => {
    setEditingId(employee.id);
    setShowForm(true);
  };

  const handleDeleteClick = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await deleteDoc(doc(db, "users", id));
        await fetchEmployees();
        alert('Employee deleted successfully!');
      } catch (error) {
        console.error("Error deleting:", error);
        alert('Failed to delete employee');
      }
    }
  };

  const handleSaveEmployee = async (employeeData) => {
    try {
      // Ensure all required fields are present
      const cleanedData = {
        ...employeeData,
        updatedAt: new Date()
      };

      if (editingId) {
        const employeeRef = doc(db, "users", editingId);
        await updateDoc(employeeRef, cleanedData);
        alert('Employee updated successfully!');
      } else {
        const newEmployee = {
          ...cleanedData,
          createdAt: new Date()
        };
        await addDoc(collection(db, "users"), newEmployee);
        alert('Employee added successfully!');
      }
      
      await fetchEmployees();
      setShowForm(false);
      setEditingId(null);
      
    } catch (error) {
      console.error("Error saving employee:", error);
      alert('Failed to save employee. Check console for details.');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleNavigation = (path) => {
    navigate(path);
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
        Loading...
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      width: "100vw",
      fontFamily: "sans-serif",
      overflow: "hidden"
    }}>
      {/* Sidebar */}
      <div style={{
        width: "250px",
        backgroundColor: "#111827",
        color: "white",
        height: "100vh",
        display: "flex",
        flexDirection: "column"
      }}>
        <div style={{
          padding: "24px 20px",
          borderBottom: "1px solid #1f2937"
        }}>
          <h2 style={{
            fontSize: "20px",
            fontWeight: "600",
            margin: 0
          }}>HR Portal</h2>
        </div>

        <div style={{
          flex: 1,
          padding: "20px"
        }}>
          <div style={{
            padding: "10px",
            marginBottom: "5px",
            borderRadius: "6px",
            cursor: "pointer",
            color: "#9ca3af"
          }} onClick={() => handleNavigation('/hr/dashboard')}>
            Dashboard
          </div>
          <div style={{
            padding: "10px",
            marginBottom: "5px",
            borderRadius: "6px",
            backgroundColor: "#374151",
            color: "white",
            cursor: "pointer"
          }}>
            Employees
          </div>
          <div style={{
            padding: "10px",
            marginBottom: "5px",
            borderRadius: "6px",
            cursor: "pointer",
            color: "#9ca3af"
          }} onClick={() => handleNavigation('/hr/leave-management')}>
            Leave Management
          </div>
          <div style={{
            padding: "10px",
            marginBottom: "5px",
            borderRadius: "6px",
            cursor: "pointer",
            color: "#9ca3af"
          }} onClick={() => handleNavigation('/hr/salary-upload')}>
            Salary Upload
          </div>
          <div style={{
            padding: "10px",
            marginBottom: "5px",
            borderRadius: "6px",
            cursor: "pointer",
            color: "#9ca3af"
          }} onClick={() => handleNavigation('/hr/salary-reports')}>
            Salary Reports
          </div>
          <div style={{
            padding: "10px",
            marginBottom: "5px",
            borderRadius: "6px",
            cursor: "pointer",
            color: "#9ca3af"
          }} onClick={() => handleNavigation('/hr/settings')}>
            Settings
          </div>
        </div>

        <button onClick={handleLogout} style={{
          margin: "20px",
          padding: "12px",
          backgroundColor: "#dc2626",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer"
        }}>
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        backgroundColor: "#f9fafb",
        padding: "32px",
        overflowY: "auto",
        height: "100vh"
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px"
        }}>
          <div>
            <h1 style={{
              fontSize: "28px",
              fontWeight: "600",
              margin: "0 0 8px 0",
              color: "#111827"
            }}>
              Employee Management
            </h1>
            <p style={{
              fontSize: "16px",
              color: "#6b7280",
              margin: 0
            }}>
              {employees.length} total employees
            </p>
          </div>
          <button onClick={handleAddClick} style={{
            padding: "12px 24px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer"
          }}>
            + Add Employee
          </button>
        </div>

        {/* Default Leave Limits Section - NOW DYNAMIC */}
        <div style={{
          backgroundColor: "#e0f2fe",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "24px"
        }}>
          <h3 style={{
            fontSize: "16px",
            fontWeight: "600",
            margin: "0 0 8px 0",
            color: "#0369a1"
          }}>
            Default Leave Limits (For All Employees)
          </h3>
          <p style={{
            fontSize: "14px",
            margin: "0 0 16px 0",
            color: "#0369a1"
          }}>
            These limits apply to all employees by default. Override in individual employee settings.
          </p>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px"
          }}>
            <span style={styles.limitBadge}>Casual: {defaultLeaveLimits.cas}</span>
            <span style={styles.limitBadge}>Sick: {defaultLeaveLimits.sic}</span>
            <span style={styles.limitBadge}>Earned: {defaultLeaveLimits.ear}</span>
            <span style={styles.limitBadge}>Marriage: {defaultLeaveLimits.mar}</span>
            <span style={styles.limitBadge}>Bereavement: {defaultLeaveLimits.ber}</span>
          </div>
        </div>

        {/* Employee Table */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          overflow: "auto",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
        }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "1200px"
          }}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Employee</th>
                <th style={styles.tableHeader}>Department</th>
                <th style={styles.tableHeader}>Designation</th>
                <th style={styles.tableHeader}>Personal Details</th>
                <th style={styles.tableHeader}>Salary</th>
                <th style={styles.tableHeader}>Leave Limits</th>
                <th style={styles.tableHeader}>Role</th>
                <th style={styles.tableHeader}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id} style={styles.tableRow}>
                  <td style={styles.tableCell}>
                    <div style={{ fontWeight: "500" }}>{emp.name}</div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>{emp.email}</div>
                    <div style={{ fontSize: "11px", color: "#9ca3af" }}>{emp.phone}</div>
                  </td>
                  <td style={styles.tableCell}>{emp.department || '—'}</td>
                  <td style={styles.tableCell}>{emp.designation || '—'}</td>
                  <td style={styles.tableCell}>
                    {emp.fatherName && <div style={styles.detailItem}>Father: {emp.fatherName}</div>}
                    {emp.motherName && <div style={styles.detailItem}>Mother: {emp.motherName}</div>}
                    {emp.panNumber && <div style={styles.detailItem}>PAN: {emp.panNumber}</div>}
                    {emp.aadhaarNumber && <div style={styles.detailItem}>Aadhaar: {emp.aadhaarNumber}</div>}
                    {!emp.fatherName && !emp.panNumber && <span style={{ color: "#9ca3af" }}>—</span>}
                  </td>
                  <td style={styles.tableCell}>
                    {emp.salary ? (
                      <>
                        <div style={{ fontWeight: "500", color: "#059669" }}>
                          ₹{(emp.salary.basic || 0).toLocaleString()}
                        </div>
                        <div style={{ fontSize: "11px", color: "#6b7280" }}>
                          Net: ₹{(emp.salary.netSalary || 0).toLocaleString()}
                        </div>
                      </>
                    ) : (
                      <span style={{ color: "#9ca3af" }}>Not set</span>
                    )}
                  </td>
                  <td style={styles.tableCell}>
                    <div style={styles.leaveBadges}>
                      <span style={styles.leaveBadge}>C: {emp.leaveLimits?.cas || defaultLeaveLimits.cas}</span>
                      <span style={styles.leaveBadge}>S: {emp.leaveLimits?.sic || defaultLeaveLimits.sic}</span>
                      <span style={styles.leaveBadge}>E: {emp.leaveLimits?.ear || defaultLeaveLimits.ear}</span>
                      <span style={styles.leaveBadge}>M: {emp.leaveLimits?.mar || defaultLeaveLimits.mar}</span>
                      <span style={styles.leaveBadge}>B: {emp.leaveLimits?.ber || defaultLeaveLimits.ber}</span>
                    </div>
                  </td>
                  <td style={styles.tableCell}>
                    <span style={{
                      ...styles.roleBadge,
                      backgroundColor: emp.role === 'hr' ? '#dbeafe' : '#f3f4f6',
                      color: emp.role === 'hr' ? '#1e40af' : '#4b5563'
                    }}>
                      {emp.role === 'hr' ? 'HR' : 'Employee'}
                    </span>
                  </td>
                  <td style={styles.tableCell}>
                    <button
                      onClick={() => handleEditClick(emp)}
                      style={styles.editButton}
                      title="Edit Employee"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteClick(emp.id, emp.name)}
                      style={styles.deleteButton}
                      title="Delete Employee"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "20px",
          marginTop: "24px"
        }}>
          <div style={styles.summaryCard}>
            <div style={{ fontSize: "14px", color: "#6b7280" }}>Total Employees</div>
            <div style={{ fontSize: "28px", fontWeight: "600" }}>{employees.length}</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={{ fontSize: "14px", color: "#6b7280" }}>HR Admins</div>
            <div style={{ fontSize: "28px", fontWeight: "600" }}>
              {employees.filter(e => e.role === 'hr').length}
            </div>
          </div>
          <div style={styles.summaryCard}>
            <div style={{ fontSize: "14px", color: "#6b7280" }}>Active Employees</div>
            <div style={{ fontSize: "28px", fontWeight: "600" }}>
              {employees.filter(e => e.role === 'employee').length}
            </div>
          </div>
          <div style={styles.summaryCard}>
            <div style={{ fontSize: "14px", color: "#6b7280" }}>Avg Salary</div>
            <div style={{ fontSize: "28px", fontWeight: "600" }}>
              ₹{Math.round(employees.reduce((acc, emp) => acc + (emp.salary?.basic || 0), 0) / (employees.length || 1)).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Employee Modal */}
      {showForm && (
        <EmployeeModal
          employee={editingId ? employees.find(e => e.id === editingId) : null}
          onClose={handleCancel}
          onSave={handleSaveEmployee}
        />
      )}
    </div>
  );
}

const styles = {
  tableHeader: {
    textAlign: "left",
    padding: "16px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#6b7280",
    backgroundColor: "#f9fafb",
    borderBottom: "1px solid #e5e7eb"
  },
  tableRow: {
    borderBottom: "1px solid #e5e7eb",
    ':hover': {
      backgroundColor: "#f9fafb"
    }
  },
  tableCell: {
    padding: "16px",
    fontSize: "14px"
  },
  detailItem: {
    fontSize: "12px",
    marginBottom: "2px",
    color: "#4b5563"
  },
  leaveBadges: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px"
  },
  leaveBadge: {
    backgroundColor: "#f3f4f6",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "11px"
  },
  limitBadge: {
    backgroundColor: "white",
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "500"
  },
  roleBadge: {
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "12px"
  },
  editButton: {
    padding: "6px",
    marginRight: "8px",
    backgroundColor: "#f3f4f6",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px"
  },
  deleteButton: {
    padding: "6px",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px"
  },
  summaryCard: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
  }
};

export default Employees;