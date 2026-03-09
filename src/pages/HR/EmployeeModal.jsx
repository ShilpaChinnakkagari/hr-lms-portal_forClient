import React, { useState, useRef } from 'react';
import { storage } from '../../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function EmployeeModal({ employee, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: employee?.name || '',
    email: employee?.email || '',
    department: employee?.department || 'Engineering',
    designation: employee?.designation || '',
    phone: employee?.phone || '',
    joinDate: employee?.joinDate || new Date().toISOString().split('T')[0],
    role: employee?.role || 'employee',
    
    fatherName: employee?.fatherName || '',
    motherName: employee?.motherName || '',
    panNumber: employee?.panNumber || '',
    aadhaarNumber: employee?.aadhaarNumber || '',
    dateOfBirth: employee?.dateOfBirth || '',
    bloodGroup: employee?.bloodGroup || '',
    emergencyContact: employee?.emergencyContact || '',
    
    salary: {
      basic: employee?.salary?.basic || 0,
      hra: employee?.salary?.hra || 0,
      da: employee?.salary?.da || 0,
      specialAllowance: employee?.salary?.specialAllowance || 0,
      conveyance: employee?.salary?.conveyance || 0,
      medical: employee?.salary?.medical || 0,
      bonus: employee?.salary?.bonus || 0,
      pf: employee?.salary?.pf || 0,
      professionalTax: employee?.salary?.professionalTax || 0,
      incomeTax: employee?.salary?.incomeTax || 0,
      netSalary: employee?.salary?.netSalary || 0
    },
    
    bankDetails: {
      accountNumber: employee?.bankDetails?.accountNumber || '',
      ifscCode: employee?.bankDetails?.ifscCode || '',
      bankName: employee?.bankDetails?.bankName || '',
      branchName: employee?.bankDetails?.branchName || ''
    },
    
    documents: employee?.documents || {
      panCard: '',
      aadhaarCard: '',
      resume: '',
      offerLetter: ''
    },
    
    leaveLimits: employee?.leaveLimits || {
      cas: 12,
      sic: 10,
      ear: 15,
      mar: 5,
      ber: 3
    },
    useCustomLimits: employee?.useCustomLimits || false
  });

  const fileInputs = {
    panCard: useRef(null),
    aadhaarCard: useRef(null),
    resume: useRef(null),
    offerLetter: useRef(null)
  };

  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSalaryChange = (field, value) => {
    const updatedSalary = {
      ...formData.salary,
      [field]: Number(value) || 0
    };
    
    const earnings = 
      (updatedSalary.basic || 0) +
      (updatedSalary.hra || 0) +
      (updatedSalary.da || 0) +
      (updatedSalary.specialAllowance || 0) +
      (updatedSalary.conveyance || 0) +
      (updatedSalary.medical || 0) +
      (updatedSalary.bonus || 0);
    
    const deductions = 
      (updatedSalary.pf || 0) +
      (updatedSalary.professionalTax || 0) +
      (updatedSalary.incomeTax || 0);
    
    updatedSalary.netSalary = earnings - deductions;
    
    setFormData({
      ...formData,
      salary: updatedSalary
    });
  };

  const handleDocumentUpload = async (type, file) => {
    if (!file) return;
    
    if (uploadingDoc) {
      alert('Please wait for the current upload to complete');
      return;
    }
    
    setUploadingDoc(type);
    setUploadError(null);
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Upload timeout - please check your internet connection')), 30000);
    });
    
    try {
      console.log(`Starting upload for ${type}:`, file.name, file.size);
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size too large. Maximum 5MB allowed.');
      }
      
      const emailKey = formData.email ? formData.email.replace(/[@.]/g, '_') : 'temp';
      const fileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const timestamp = Date.now();
      const storageRef = ref(storage, `documents/${emailKey}/${type}_${timestamp}_${fileName}`);
      
      console.log('Storage ref created:', storageRef.fullPath);
      
      // Race between upload and timeout
      await Promise.race([
        uploadBytes(storageRef, file),
        timeoutPromise
      ]);
      
      console.log('Upload complete, getting URL...');
      
      const downloadURL = await getDownloadURL(storageRef);
      console.log('Download URL received');
      
      setFormData(prev => ({
        ...prev,
        documents: {
          ...prev.documents,
          [type]: downloadURL
        }
      }));
      
      // Reset file input
      if (fileInputs[type]?.current) {
        fileInputs[type].current.value = '';
      }
      
      alert(`${type} uploaded successfully!`);
      setUploadingDoc(null);
      
    } catch (error) {
      console.error("Upload error details:", error);
      
      let errorMessage = 'Failed to upload. ';
      
      if (error.message === 'Upload timeout - please check your internet connection') {
        errorMessage = 'Upload timed out. Please check your internet connection and try again.';
      } else if (error.code === 'storage/unauthorized') {
        errorMessage += 'You do not have permission to upload files.';
      } else if (error.code === 'storage/canceled') {
        errorMessage += 'Upload was canceled.';
      } else if (error.code === 'storage/unknown') {
        errorMessage += 'An unknown error occurred.';
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again.';
      }
      
      setUploadError(errorMessage);
      setUploadingDoc(null);
    }
  };

  const handleViewDocument = (url) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: '👤' },
    { id: 'personal', label: 'Personal Details', icon: '📋' },
    { id: 'salary', label: 'Salary', icon: '💰' },
    { id: 'bank', label: 'Bank Details', icon: '🏦' },
    { id: 'documents', label: 'Documents', icon: '📎' },
    { id: 'leave', label: 'Leave Limits', icon: '✈️' }
  ];

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>
          {employee ? 'Edit Employee' : 'Add New Employee'}
        </h2>

        <div style={styles.tabContainer}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...styles.tab,
                ...(activeTab === tab.id ? styles.activeTab : {})
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {activeTab === 'basic' && (
            <div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    style={styles.input}
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
                  />
                </div>
              </div>

              <div style={styles.formRow}>
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
                    onChange={handleChange}
                    style={styles.input}
                  />
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
              </div>
            </div>
          )}

          {activeTab === 'personal' && (
            <div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Father's Name</label>
                  <input
                    type="text"
                    name="fatherName"
                    value={formData.fatherName}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Mother's Name</label>
                  <input
                    type="text"
                    name="motherName"
                    value={formData.motherName}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>PAN Number</label>
                  <input
                    type="text"
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="ABCDE1234F"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Aadhaar Number</label>
                  <input
                    type="text"
                    name="aadhaarNumber"
                    value={formData.aadhaarNumber}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="1234 5678 9012"
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Blood Group</label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    style={styles.select}
                  >
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Emergency Contact</label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Name: Relationship: Phone"
                />
              </div>
            </div>
          )}

          {activeTab === 'salary' && (
            <div>
              <h3 style={styles.sectionTitle}>Earnings</h3>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Basic Salary</label>
                  <input
                    type="number"
                    value={formData.salary.basic}
                    onChange={(e) => handleSalaryChange('basic', e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>HRA</label>
                  <input
                    type="number"
                    value={formData.salary.hra}
                    onChange={(e) => handleSalaryChange('hra', e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>DA</label>
                  <input
                    type="number"
                    value={formData.salary.da}
                    onChange={(e) => handleSalaryChange('da', e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Special Allowance</label>
                  <input
                    type="number"
                    value={formData.salary.specialAllowance}
                    onChange={(e) => handleSalaryChange('specialAllowance', e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Conveyance</label>
                  <input
                    type="number"
                    value={formData.salary.conveyance}
                    onChange={(e) => handleSalaryChange('conveyance', e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Medical</label>
                  <input
                    type="number"
                    value={formData.salary.medical}
                    onChange={(e) => handleSalaryChange('medical', e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Bonus</label>
                  <input
                    type="number"
                    value={formData.salary.bonus}
                    onChange={(e) => handleSalaryChange('bonus', e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>

              <h3 style={styles.sectionTitle}>Deductions</h3>
              
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>PF</label>
                  <input
                    type="number"
                    value={formData.salary.pf}
                    onChange={(e) => handleSalaryChange('pf', e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Professional Tax</label>
                  <input
                    type="number"
                    value={formData.salary.professionalTax}
                    onChange={(e) => handleSalaryChange('professionalTax', e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Income Tax</label>
                  <input
                    type="number"
                    value={formData.salary.incomeTax}
                    onChange={(e) => handleSalaryChange('incomeTax', e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.netSalaryBox}>
                <span style={styles.netSalaryLabel}>Net Salary</span>
                <span style={styles.netSalaryValue}>
                  ₹{formData.salary.netSalary.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {activeTab === 'bank' && (
            <div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Account Number</label>
                <input
                  type="text"
                  name="bankDetails.accountNumber"
                  value={formData.bankDetails.accountNumber}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>IFSC Code</label>
                  <input
                    type="text"
                    name="bankDetails.ifscCode"
                    value={formData.bankDetails.ifscCode}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Bank Name</label>
                  <input
                    type="text"
                    name="bankDetails.bankName"
                    value={formData.bankDetails.bankName}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Branch Name</label>
                <input
                  type="text"
                  name="bankDetails.branchName"
                  value={formData.bankDetails.branchName}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <p style={styles.uploadNote}>
                Upload documents (PDF, JPG, PNG supported, max 5MB)
              </p>

              {uploadError && (
                <div style={styles.errorMessage}>
                  ❌ {uploadError}
                </div>
              )}

              {[
                { type: 'panCard', label: 'PAN Card' },
                { type: 'aadhaarCard', label: 'Aadhaar Card' },
                { type: 'resume', label: 'Resume' },
                { type: 'offerLetter', label: 'Offer Letter' }
              ].map(({ type, label }) => (
                <div key={type} style={styles.documentGroup}>
                  <label style={styles.label}>{label}</label>
                  <div style={styles.documentRow}>
                    <input
                      ref={fileInputs[type]}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) => handleDocumentUpload(type, e.target.files[0])}
                      style={styles.fileInput}
                      disabled={uploadingDoc === type}
                    />
                    {formData.documents[type] && (
                      <button
                        type="button"
                        onClick={() => handleViewDocument(formData.documents[type])}
                        style={styles.viewButton}
                      >
                        👁️ View
                      </button>
                    )}
                  </div>
                  {uploadingDoc === type && (
                    <div style={styles.uploadingIndicator}>⏳ Uploading... (may take a few seconds)</div>
                  )}
                  {formData.documents[type] && uploadingDoc !== type && (
                    <div style={styles.successIndicator}>✅ Uploaded</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'leave' && (
            <div>
              <div style={styles.formGroup}>
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
                <div style={styles.leaveGrid}>
                  {[
                    { key: 'cas', label: 'Casual Leave' },
                    { key: 'sic', label: 'Sick Leave' },
                    { key: 'ear', label: 'Earned Leave' },
                    { key: 'mar', label: 'Marriage Leave' },
                    { key: 'ber', label: 'Bereavement Leave' }
                  ].map(({ key, label }) => (
                    <div key={key} style={styles.leaveItem}>
                      <label style={styles.label}>{label}</label>
                      <input
                        type="number"
                        value={formData.leaveLimits[key]}
                        onChange={(e) => setFormData({
                          ...formData,
                          leaveLimits: {...formData.leaveLimits, [key]: parseInt(e.target.value) || 0}
                        })}
                        style={styles.input}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={styles.buttonGroup}>
            <button type="button" onClick={onClose} style={styles.cancelButton}>
              Cancel
            </button>
            <button 
              type="submit" 
              style={{
                ...styles.submitButton,
                opacity: uploadingDoc ? 0.6 : 1
              }} 
              disabled={!!uploadingDoc}
            >
              {uploadingDoc ? 'Uploading...' : (employee ? 'Update Employee' : 'Add Employee')}
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
    width: "800px",
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
  tabContainer: {
    display: "flex",
    gap: "10px",
    marginBottom: "24px",
    borderBottom: "2px solid #e5e7eb",
    paddingBottom: "10px",
    overflowX: "auto"
  },
  tab: {
    padding: "10px 20px",
    backgroundColor: "transparent",
    color: "#4b5563",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: "500",
    whiteSpace: "nowrap"
  },
  activeTab: {
    backgroundColor: "#3b82f6",
    color: "white"
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px",
    marginBottom: "15px"
  },
  formGroup: {
    marginBottom: "15px"
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
    marginBottom: "5px"
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
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    margin: "0 0 16px 0"
  },
  netSalaryBox: {
    backgroundColor: "#f3f4f6",
    padding: "16px",
    borderRadius: "8px",
    marginTop: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  netSalaryLabel: {
    fontSize: "16px",
    fontWeight: "500"
  },
  netSalaryValue: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#059669"
  },
  uploadNote: {
    color: "#6b7280",
    marginBottom: "20px",
    fontSize: "14px"
  },
  errorMessage: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    padding: "12px",
    borderRadius: "6px",
    marginBottom: "20px",
    fontSize: "14px"
  },
  documentGroup: {
    marginBottom: "20px"
  },
  documentRow: {
    display: "flex",
    gap: "10px",
    alignItems: "center"
  },
  fileInput: {
    flex: 1,
    padding: "8px",
    border: "1px dashed #d1d5db",
    borderRadius: "6px",
    fontSize: "14px"
  },
  viewButton: {
    padding: "8px 16px",
    backgroundColor: "#f3f4f6",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    whiteSpace: "nowrap"
  },
  uploadingIndicator: {
    marginTop: "5px",
    color: "#3b82f6",
    fontSize: "12px"
  },
  successIndicator: {
    marginTop: "5px",
    color: "#10b981",
    fontSize: "12px"
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    cursor: "pointer"
  },
  leaveGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "15px",
    marginTop: "15px"
  },
  leaveItem: {
    display: "flex",
    flexDirection: "column"
  },
  buttonGroup: {
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
    marginTop: "24px",
    borderTop: "1px solid #e5e7eb",
    paddingTop: "20px"
  },
  cancelButton: {
    padding: "10px 20px",
    backgroundColor: "#f3f4f6",
    color: "#4b5563",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px"
  },
  submitButton: {
    padding: "10px 20px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px"
  }
};

export default EmployeeModal;