import React, { useState } from 'react';

function EmployeeModal({ employee, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: employee?.name || '',
    email: employee?.email || '',
    department: employee?.department || 'Engineering',
    designation: employee?.designation || 'Developer',
    role: employee?.role || 'employee',
    phone: employee?.phone || '',
    joinDate: employee?.joinDate || new Date().toISOString().split('T')[0]
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>
          {employee ? 'Edit Employee' : 'Add New Employee'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="Enter full name"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="Enter email address"
            />
          </div>

          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                style={styles.select}
              >
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Product">Product</option>
                <option value="HR">HR</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Designation</label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                style={styles.input}
                placeholder="e.g. Sr. Developer"
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                style={styles.select}
              >
                <option value="employee">Employee</option>
                <option value="hr">HR</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Join Date</label>
            <input
              type="date"
              name="joinDate"
              value={formData.joinDate}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.buttonGroup}>
            <button type="button" onClick={onClose} style={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" style={styles.saveButton}>
              {employee ? 'Update' : 'Save'} Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
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
  modal: {
    backgroundColor: "white",
    padding: "32px",
    borderRadius: "12px",
    width: "500px",
    maxWidth: "90%",
    maxHeight: "90vh",
    overflowY: "auto"
  },
  title: {
    fontSize: "24px",
    fontWeight: "600",
    margin: "0 0 24px 0",
    color: "#111827"
  },
  formGroup: {
    marginBottom: "16px",
    flex: 1
  },
  row: {
    display: "flex",
    gap: "16px",
    marginBottom: "16px"
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
    marginBottom: "6px"
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    boxSizing: "border-box"
  },
  select: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    backgroundColor: "white",
    boxSizing: "border-box"
  },
  buttonGroup: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
    marginTop: "24px"
  },
  cancelButton: {
    padding: "10px 20px",
    backgroundColor: "#f3f4f6",
    color: "#4b5563",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    cursor: "pointer"
  },
  saveButton: {
    padding: "10px 20px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    cursor: "pointer"
  }
};

export default EmployeeModal;