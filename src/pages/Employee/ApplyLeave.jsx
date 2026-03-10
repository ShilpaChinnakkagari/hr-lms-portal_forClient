import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase/config';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { getLeaveLimits } from '../../services/leaveLimitsService';

function ApplyLeave() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userDocId, setUserDocId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [leaveLimits, setLeaveLimits] = useState({});
  const [usedLeaves, setUsedLeaves] = useState({});
  const [formData, setFormData] = useState({
    type: '',
    fromDate: '',
    toDate: '',
    reason: ''
  });

  const leaveTypes = [
    { id: 'cas', label: 'Casual Leave' },
    { id: 'sic', label: 'Sick Leave' },
    { id: 'ear', label: 'Earned Leave' },
    { id: 'mar', label: 'Marriage Leave' },
    { id: 'ber', label: 'Bereavement Leave' }
  ];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        console.log("Current user:", currentUser);
        setUser(currentUser);
        await fetchUserData(currentUser);
      } else {
        navigate('/login');
      }
    });
    return unsubscribe;
  }, [navigate]);

  const fetchUserData = async (currentUser) => {
    try {
      // Get global leave limits from Firebase first
      const globalLimits = await getLeaveLimits();
      
      // Get the user's document from Firestore
      const usersRef = collection(db, "users");
      const userQuery = query(usersRef, where("email", "==", currentUser.email));
      const userSnap = await getDocs(userQuery);
      
      if (!userSnap.empty) {
        const userDoc = userSnap.docs[0];
        setUserDocId(userDoc.id);
        const userData = userDoc.data();
        console.log("User document ID:", userDoc.id);
        console.log("User data:", userData);
        
        // Set leave limits: user-specific overrides global, global overrides defaults
        setLeaveLimits({
          cas: userData.cas || globalLimits.cas || 12,
          sic: userData.sic || globalLimits.sic || 10,
          ear: userData.ear || globalLimits.ear || 15,
          mar: userData.mar || globalLimits.mar || 5,
          ber: userData.ber || globalLimits.ber || 3
        });
      } else {
        // If user not found in database, use global limits only
        setLeaveLimits({
          cas: globalLimits.cas || 12,
          sic: globalLimits.sic || 10,
          ear: globalLimits.ear || 15,
          mar: globalLimits.mar || 5,
          ber: globalLimits.ber || 3
        });
      }

      // Get used leaves (approved leaves only)
      const leavesRef = collection(db, "leaves");
      const leavesQuery = query(
        leavesRef,
        where("employeeId", "==", currentUser.uid),
        where("status", "==", "approved")
      );
      const leavesSnap = await getDocs(leavesQuery);
      
      const used = {};
      leavesSnap.forEach(doc => {
        const leave = doc.data();
        const typeLabel = leave.type || '';
        const days = leave.days || 0;
        
        if (typeLabel.includes('Casual')) used['cas'] = (used['cas'] || 0) + days;
        else if (typeLabel.includes('Sick')) used['sic'] = (used['sic'] || 0) + days;
        else if (typeLabel.includes('Earned')) used['ear'] = (used['ear'] || 0) + days;
        else if (typeLabel.includes('Marriage')) used['mar'] = (used['mar'] || 0) + days;
        else if (typeLabel.includes('Bereavement')) used['ber'] = (used['ber'] || 0) + days;
      });
      
      setUsedLeaves(used);
      setFetching(false);
    } catch (error) {
      console.error("Error:", error);
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const calculateDays = (from, to) => {
    if (!from || !to) return 0;
    const start = new Date(from);
    const end = new Date(to);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const getRemainingLeaves = (type) => {
    const limit = leaveLimits[type] || 0;
    const used = usedLeaves[type] || 0;
    return limit - used;
  };

  const getLeaveTypeLabel = (typeKey) => {
    const type = leaveTypes.find(t => t.id === typeKey);
    return type ? type.label : typeKey;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const days = calculateDays(formData.fromDate, formData.toDate);
      const remaining = getRemainingLeaves(formData.type);
      
      if (remaining < days) {
        alert(`Insufficient balance! Available: ${remaining} days, Requested: ${days} days`);
        setLoading(false);
        return;
      }

      // Get user data for correct name
      const usersRef = collection(db, "users");
      const userQuery = query(usersRef, where("email", "==", user.email));
      const userSnap = await getDocs(userQuery);
      let employeeName = user.displayName || user.email;
      
      if (!userSnap.empty) {
        const userData = userSnap.docs[0].data();
        employeeName = userData.name || employeeName;
      }

      const leaveData = {
        employeeId: user.uid,
        employeeName: employeeName,
        employeeEmail: user.email,
        type: getLeaveTypeLabel(formData.type),
        fromDate: formData.fromDate,
        toDate: formData.toDate,
        days: days,
        reason: formData.reason,
        status: 'pending',
        appliedOn: new Date()
      };

      console.log("Submitting leave with data:", leaveData);
      console.log("User UID:", user.uid);
      console.log("User Doc ID:", userDocId);

      const docRef = await addDoc(collection(db, "leaves"), leaveData);
      console.log("Leave saved with ID:", docRef.id);

      alert('Leave application submitted successfully!');
      navigate('/employee/dashboard');
      
    } catch (error) {
      console.error("Error applying leave:", error);
      alert('Failed to apply for leave. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  const availableLeaveTypes = leaveTypes.filter(type => 
    (leaveLimits[type.id] || 0) > 0
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/employee/dashboard')} style={styles.backButton}>
          ← Back to Dashboard
        </button>
        <h1 style={styles.title}>Apply for Leave</h1>
        <div style={styles.placeholder}></div>
      </div>

      <div style={styles.balanceSummary}>
        <h3 style={styles.summaryTitle}>Your Leave Balance</h3>
        <div style={styles.balanceGrid}>
          {availableLeaveTypes.map(type => {
            const limit = leaveLimits[type.id] || 0;
            const used = usedLeaves[type.id] || 0;
            const remaining = limit - used;
            
            return (
              <div key={type.id} style={styles.balanceCard}>
                <div style={styles.balanceLabel}>{type.label}</div>
                <div style={styles.balanceValues}>
                  <span style={styles.usedValue}>{used}</span>
                  <span style={styles.totalValue}> / {limit}</span>
                </div>
                <div style={{
                  ...styles.remainingBadge,
                  backgroundColor: remaining > 0 ? '#d1fae5' : '#fee2e2',
                  color: remaining > 0 ? '#065f46' : '#991b1b'
                }}>
                  {remaining > 0 ? `${remaining} remaining` : 'No balance left'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={styles.formContainer}>
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Leave Type *</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              style={styles.select}
            >
              <option value="">Select Leave Type</option>
              {availableLeaveTypes.map(type => {
                const remaining = getRemainingLeaves(type.id);
                return (
                  <option key={type.id} value={type.id}>
                    {type.label} ({remaining} days left)
                  </option>
                );
              })}
            </select>
          </div>

          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>From Date *</label>
              <input
                type="date"
                name="fromDate"
                value={formData.fromDate}
                onChange={handleChange}
                required
                style={styles.input}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>To Date *</label>
              <input
                type="date"
                name="toDate"
                value={formData.toDate}
                onChange={handleChange}
                required
                style={styles.input}
                min={formData.fromDate || new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {formData.fromDate && formData.toDate && (
            <div style={styles.daysInfo}>
              <span style={styles.daysLabel}>Total Days:</span>
              <span style={styles.daysValue}>{calculateDays(formData.fromDate, formData.toDate)} days</span>
              
              {formData.type && (
                <div style={styles.balanceWarning}>
                  {getRemainingLeaves(formData.type) < calculateDays(formData.fromDate, formData.toDate) ? (
                    <span style={styles.warningText}>
                      ⚠️ Exceeds your balance by {calculateDays(formData.fromDate, formData.toDate) - getRemainingLeaves(formData.type)} days
                    </span>
                  ) : (
                    <span style={styles.successText}>
                      ✅ Within balance
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Reason for Leave *</label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
              rows="4"
              style={styles.textarea}
              placeholder="Please provide reason for your leave request..."
            />
          </div>

          <div style={styles.actions}>
            <button 
              type="button" 
              onClick={() => navigate('/employee/dashboard')} 
              style={styles.cancelButton}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              style={{
                ...styles.submitButton,
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Submitting...' : 'Apply for Leave'}
            </button>
          </div>
        </form>
      </div>

      <div style={styles.instructions}>
        <h4 style={styles.instructionsTitle}>📋 Leave Guidelines</h4>
        <ul style={styles.instructionsList}>
          <li>Apply at least 3 days in advance for planned leaves</li>
          <li>Medical emergencies require documentation</li>
          <li>HR will review and respond within 2 working days</li>
        </ul>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f9fafb",
    padding: "32px",
    fontFamily: "sans-serif"
  },
  loadingContainer: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6"
  },
  loading: {
    fontSize: "18px",
    color: "#4b5563"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px"
  },
  backButton: {
    padding: "10px 20px",
    backgroundColor: "#6b7280",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer"
  },
  title: {
    fontSize: "28px",
    fontWeight: "600",
    margin: 0,
    color: "#111827"
  },
  placeholder: {
    width: "100px"
  },
  balanceSummary: {
    backgroundColor: "white",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    marginBottom: "24px"
  },
  summaryTitle: {
    margin: "0 0 16px 0",
    fontSize: "16px",
    fontWeight: "600"
  },
  balanceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px"
  },
  balanceCard: {
    padding: "15px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    border: "1px solid #e5e7eb"
  },
  balanceLabel: {
    fontSize: "14px",
    fontWeight: "500",
    marginBottom: "8px"
  },
  balanceValues: {
    marginBottom: "8px"
  },
  usedValue: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#111827"
  },
  totalValue: {
    fontSize: "14px",
    color: "#6b7280"
  },
  remainingBadge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "500"
  },
  formContainer: {
    backgroundColor: "white",
    padding: "32px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    maxWidth: "800px",
    margin: "0 auto 24px auto"
  },
  formGroup: {
    marginBottom: "20px",
    flex: 1
  },
  row: {
    display: "flex",
    gap: "20px",
    marginBottom: "20px"
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
    marginBottom: "8px"
  },
  input: {
    width: "100%",
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    boxSizing: "border-box"
  },
  select: {
    width: "100%",
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    backgroundColor: "white"
  },
  textarea: {
    width: "100%",
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical",
    boxSizing: "border-box"
  },
  daysInfo: {
    backgroundColor: "#f3f4f6",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "20px"
  },
  daysLabel: {
    fontSize: "14px",
    color: "#4b5563",
    marginRight: "10px"
  },
  daysValue: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#111827"
  },
  balanceWarning: {
    marginTop: "10px"
  },
  warningText: {
    color: "#dc2626",
    fontSize: "13px"
  },
  successText: {
    color: "#059669",
    fontSize: "13px"
  },
  actions: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
    marginTop: "24px"
  },
  cancelButton: {
    padding: "12px 24px",
    backgroundColor: "#f3f4f6",
    color: "#4b5563",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer"
  },
  submitButton: {
    padding: "12px 24px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer"
  },
  instructions: {
    backgroundColor: "#e0f2fe",
    padding: "20px",
    borderRadius: "12px",
    maxWidth: "800px",
    margin: "0 auto"
  },
  instructionsTitle: {
    margin: "0 0 12px 0",
    fontSize: "16px",
    fontWeight: "600",
    color: "#0369a1"
  },
  instructionsList: {
    margin: 0,
    paddingLeft: "20px",
    color: "#0369a1",
    fontSize: "14px",
    lineHeight: "1.6"
  }
};

export default ApplyLeave;