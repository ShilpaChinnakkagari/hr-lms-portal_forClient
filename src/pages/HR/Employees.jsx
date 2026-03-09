import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

function Employees() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Default leave limits for ALL employees (set by HR)
  const [defaultLeaveLimits, setDefaultLeaveLimits] = useState({
    casual: 12,
    sick: 10,
    earned: 15,
    maternity: 0,
    paternity: 0,
    marriage: 5,
    bereavement: 3,
    study: 0,
    unpaid: 0,
    compensatory: 0
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'Engineering',
    designation: '',
    phone: '',
    joinDate: new Date().toISOString().split('T')[0],
    role: 'employee',
    customLeaveLimits: {}, // Individual overrides (only if different from default)
    useCustomLimits: false // Flag to use custom limits
  });

  // Available leave types for display
  const leaveTypes = [
    { id: 'casual', label: 'Casual Leave' },
    { id: 'sick', label: 'Sick Leave' },
    { id: 'earned', label: 'Earned Leave' },
    { id: 'maternity', label: 'Maternity Leave' },
    { id: 'paternity', label: 'Paternity Leave' },
    { id: 'marriage', label: 'Marriage Leave' },
    { id: 'bereavement', label: 'Bereavement Leave' },
    { id: 'study', label: 'Study Leave' },
    { id: 'unpaid', label: 'Unpaid Leave' },
    { id: 'compensatory', label: 'Compensatory Off' }
  ];

  useEffect(() => {
    fetchEmployees();
  }, []);

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

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCustomLimitChange = (typeId, value) => {
    setFormData({
      ...formData,
      customLeaveLimits: {
        ...formData.customLeaveLimits,
        [typeId]: parseInt(value) || 0
      }
    });
  };

  const handleDefaultLimitChange = (typeId, value) => {
    setDefaultLeaveLimits({
      ...defaultLeaveLimits,
      [typeId]: parseInt(value) || 0
    });
  };

  const handleAddClick = () => {
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      department: 'Engineering',
      designation: '',
      phone: '',
      joinDate: new Date().toISOString().split('T')[0],
      role: 'employee',
      customLeaveLimits: {},
      useCustomLimits: false
    });
    setShowForm(true);
  };

  const handleEditClick = (emp) => {
    setEditingId(emp.id);
    setFormData({
      name: emp.name || '',
      email: emp.email || '',
      department: emp.department || 'Engineering',
      designation: emp.designation || '',
      phone: emp.phone || '',
      joinDate: emp.joinDate || new Date().toISOString().split('T')[0],
      role: emp.role || 'employee',
      customLeaveLimits: emp.customLeaveLimits || {},
      useCustomLimits: emp.useCustomLimits || false
    });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      alert('Name and Email are required');
      return;
    }

    try {
      // Save default limits to a separate collection (global settings)
      if (!editingId) {
        // Only save defaults when HR explicitly updates them
        await addDoc(collection(db, "settings"), {
          type: 'defaultLeaveLimits',
          limits: defaultLeaveLimits,
          updatedAt: new Date()
        });
      }

      if (editingId) {
        const employeeRef = doc(db, "users", editingId);
        await updateDoc(employeeRef, {
          name: formData.name,
          email: formData.email,
          department: formData.department,
          designation: formData.designation,
          phone: formData.phone,
          joinDate: formData.joinDate,
          role: formData.role,
          customLeaveLimits: formData.customLeaveLimits,
          useCustomLimits: formData.useCustomLimits
        });
        alert('Employee updated successfully!');
      } else {
        const newEmployee = {
          ...formData,
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
      alert('Failed to save employee');
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

  // Get effective leave limits for an employee
  const getEmployeeLimits = (emp) => {
    if (emp.useCustomLimits && emp.customLeaveLimits) {
      return emp.customLeaveLimits;
    }
    return defaultLeaveLimits;
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <h2 style={styles.logo}>HR Portal</h2>
        <div style={styles.menu}>
          <div style={styles.menuItem} onClick={() => navigate('/hr/dashboard')}>Dashboard</div>
          <div style={styles.menuItemActive}>Employees</div>
          <div style={styles.menuItem} onClick={() => navigate('/hr/leave-management')}>Leave Management</div>
        </div>
        <button onClick={handleLogout} style={styles.logout}>Logout</button>
      </div>
      
      {/* Main Content */}
      <div style={styles.content}>
        <div style={styles.header}>
          <h1>Employee Leave Management</h1>
          <button onClick={handleAddClick} style={styles.addButton}>
            + Add Employee
          </button>
        </div>

        {/* Default Leave Limits Section (Global Settings) */}
        <div style={styles.defaultLimitsSection}>
          <h3 style={styles.sectionTitle}>Default Leave Limits (For All Employees)</h3>
          <p style={styles.sectionNote}>These limits apply to all employees by default. You can override for individual employees below.</p>
          
          <div style={styles.defaultLimitsGrid}>
            {leaveTypes.map(type => (
              <div key={type.id} style={styles.defaultLimitItem}>
                <label style={styles.label}>{type.label}</label>
                <input
                  type="number"
                  min="0"
                  value={defaultLeaveLimits[type.id] || 0}
                  onChange={(e) => handleDefaultLimitChange(type.id, e.target.value)}
                  style={styles.defaultLimitInput}
                />
              </div>
            ))}
          </div>
          <p style={styles.hint}>Changes to default limits will apply to all employees who don't have custom overrides.</p>
        </div>

        {/* Add/Edit Employee Form */}
        {showForm && (
          <div style={styles.formContainer}>
            <h3 style={styles.formTitle}>
              {editingId ? 'Edit Employee' : 'Add New Employee'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Department</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    style={styles.select}
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Product">Product</option>
                    <option value="HR">HR</option>
                    <option value="Sales">Sales</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Designation</label>
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Join Date</label>
                  <input
                    type="date"
                    name="joinDate"
                    value={formData.joinDate}
                    onChange={handleInputChange}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    style={styles.select}
                  >
                    <option value="employee">Employee</option>
                    <option value="hr">HR</option>
                  </select>
                </div>
              </div>

              {/* Custom Leave Limits for this Employee */}
              <div style={styles.customLimitsSection}>
                <div style={styles.checkboxGroup}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.useCustomLimits}
                      onChange={(e) => setFormData({...formData, useCustomLimits: e.target.checked})}
                    />
                    Use custom leave limits for this employee (override defaults)
                  </label>
                </div>

                {formData.useCustomLimits && (
                  <div style={styles.customLimitsGrid}>
                    {leaveTypes.map(type => (
                      <div key={type.id} style={styles.customLimitItem}>
                        <label style={styles.label}>{type.label}</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.customLeaveLimits[type.id] || 0}
                          onChange={(e) => handleCustomLimitChange(type.id, e.target.value)}
                          style={styles.customLimitInput}
                          placeholder={`Default: ${defaultLeaveLimits[type.id]}`}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={styles.buttonGroup}>
                <button type="button" onClick={handleCancel} style={styles.cancelButton}>
                  Cancel
                </button>
                <button type="submit" style={styles.submitButton}>
                  {editingId ? 'Update Employee' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Employee List */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Employee</th>
                <th style={styles.tableHeader}>Department</th>
                <th style={styles.tableHeader}>Leave Limits</th>
                <th style={styles.tableHeader}>Type</th>
                <th style={styles.tableHeader}>Role</th>
                <th style={styles.tableHeader}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => {
                const limits = getEmployeeLimits(emp);
                const hasCustom = emp.useCustomLimits;
                
                return (
                  <tr key={emp.id} style={styles.tableRow}>
                    <td style={styles.tableCell}>
                      <div style={styles.employeeName}>{emp.name}</div>
                      <div style={styles.employeeEmail}>{emp.email}</div>
                    </td>
                    <td style={styles.tableCell}>{emp.department}</td>
                    <td style={styles.tableCell}>
                      <div style={styles.leaveBadges}>
                        {Object.entries(limits)
                          .filter(([_, value]) => value > 0)
                          .map(([key, value]) => (
                            <span key={key} style={styles.leaveBadge}>
                              {key.substring(0, 3)}: {value}
                            </span>
                          ))}
                      </div>
                    </td>
                    <td style={styles.tableCell}>
                      {hasCustom ? (
                        <span style={styles.customBadge}>Custom</span>
                      ) : (
                        <span style={styles.defaultBadge}>Default</span>
                      )}
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
                      <button onClick={() => handleEditClick(emp)} style={styles.editButton}>
                        ✏️ Edit
                      </button>
                      <button onClick={() => handleDeleteClick(emp.id, emp.name)} style={styles.deleteButton}>
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
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
    fontFamily: "sans-serif"
  },
  loading: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },
  sidebar: {
    width: "250px",
    backgroundColor: "#111827",
    color: "white",
    padding: "20px",
    display: "flex",
    flexDirection: "column"
  },
  logo: {
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
  menuItemActive: {
    padding: "10px",
    marginBottom: "5px",
    borderRadius: "6px",
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
    padding: "20px",
    backgroundColor: "#f3f4f6",
    overflow: "auto"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
  },
  addButton: {
    padding: "10px 20px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  },
  defaultLimitsSection: {
    backgroundColor: "#e0f2fe",
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "20px"
  },
  sectionTitle: {
    margin: "0 0 10px 0"
  },
  sectionNote: {
    margin: "0 0 15px 0",
    fontSize: "13px",
    color: "#0369a1"
  },
  defaultLimitsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "15px",
    marginBottom: "10px"
  },
  defaultLimitItem: {
    display: "flex",
    flexDirection: "column"
  },
  defaultLimitInput: {
    padding: "8px",
    border: "1px solid #bae6fd",
    borderRadius: "6px",
    fontSize: "14px",
    backgroundColor: "white"
  },
  hint: {
    fontSize: "12px",
    color: "#0369a1",
    margin: 0
  },
  formContainer: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "20px"
  },
  formTitle: {
    margin: "0 0 20px 0"
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "15px",
    marginBottom: "15px"
  },
  formGroup: {
    flex: 1
  },
  label: {
    display: "block",
    marginBottom: "5px",
    fontSize: "14px",
    fontWeight: "500"
  },
  input: {
    width: "100%",
    padding: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    boxSizing: "border-box"
  },
  select: {
    width: "100%",
    padding: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    backgroundColor: "white"
  },
  customLimitsSection: {
    marginTop: "20px",
    marginBottom: "20px",
    padding: "20px",
    backgroundColor: "#fef3c7",
    borderRadius: "8px"
  },
  checkboxGroup: {
    marginBottom: "15px"
  },
  checkboxLabel: {
    fontSize: "14px",
    cursor: "pointer"
  },
  customLimitsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "15px"
  },
  customLimitItem: {
    display: "flex",
    flexDirection: "column"
  },
  customLimitInput: {
    padding: "8px",
    border: "1px solid #fde68a",
    borderRadius: "6px",
    fontSize: "14px",
    backgroundColor: "white"
  },
  buttonGroup: {
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end"
  },
  cancelButton: {
    padding: "10px 20px",
    backgroundColor: "#9ca3af",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  },
  submitButton: {
    padding: "10px 20px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  },
  tableContainer: {
    backgroundColor: "white",
    borderRadius: "8px",
    overflow: "auto"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1000px"
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
  tableRow: {
    borderBottom: "1px solid #e5e7eb"
  },
  tableCell: {
    padding: "12px",
    fontSize: "14px"
  },
  employeeName: {
    fontSize: "14px",
    fontWeight: "500"
  },
  employeeEmail: {
    fontSize: "12px",
    color: "#6b7280"
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
  customBadge: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "11px"
  },
  defaultBadge: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "11px"
  },
  roleBadge: {
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "12px"
  },
  editButton: {
    padding: "4px 8px",
    marginRight: "8px",
    backgroundColor: "#f3f4f6",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer"
  },
  deleteButton: {
    padding: "4px 8px",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer"
  }
};

export default Employees;