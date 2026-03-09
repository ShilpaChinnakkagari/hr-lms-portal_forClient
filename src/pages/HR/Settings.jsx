import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

function HRSettings() {
  const navigate = useNavigate();
  const [hrEmail, setHrEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchHREmail();
  }, []);

  const fetchHREmail = async () => {
    try {
      const settingsRef = doc(db, "settings", "hr");
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists()) {
        setHrEmail(settingsSnap.data().email);
      } else {
        setHrEmail('shilpa.btech.aws@gmail.com'); // Default
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching HR email:", error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!hrEmail) {
      setMessage('Please enter an email address');
      return;
    }

    setSaving(true);
    try {
      const settingsRef = doc(db, "settings", "hr");
      await setDoc(settingsRef, {
        email: hrEmail,
        updatedBy: auth.currentUser?.email,
        updatedAt: new Date()
      });
      setMessage('HR email updated successfully!');
    } catch (error) {
      console.error("Error saving HR email:", error);
      setMessage('Failed to update HR email');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div>Loading settings...</div>
      </div>
    );
  }

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
          <div style={{...styles.menuItem, ...styles.activeMenuItem}} onClick={() => handleNavigation('/hr/settings')}>
            Settings
          </div>
        </div>

        <button onClick={handleLogout} style={styles.logoutButton}>
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        <h1 style={styles.pageTitle}>Settings</h1>
        <p style={styles.pageSubtitle}>
          Configure HR portal settings
        </p>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>HR Email Configuration</h2>
          <p style={styles.cardDescription}>
            Set the email address that will have HR access. Only this email can access the HR portal.
          </p>

          <div style={styles.formGroup}>
            <label style={styles.label}>HR Email Address</label>
            <input
              type="email"
              value={hrEmail}
              onChange={(e) => setHrEmail(e.target.value)}
              style={styles.input}
              placeholder="Enter HR email address"
            />
          </div>

          {message && (
            <div style={message.includes('success') ? styles.successMessage : styles.errorMessage}>
              {message}
            </div>
          )}

          <button 
            onClick={handleSave} 
            disabled={saving}
            style={saving ? {...styles.saveButton, opacity: 0.6} : styles.saveButton}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

          <div style={styles.note}>
            <strong>Note:</strong> After changing the HR email, the new email will need to log in again.
          </div>
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
    margin: 0,
    padding: 0,
    overflow: "hidden",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  loadingContainer: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6"
  },
  sidebar: {
    width: "260px",
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
  mainContent: {
    flex: 1,
    backgroundColor: "#f9fafb",
    padding: "32px",
    overflowY: "auto",
    height: "100vh"
  },
  pageTitle: {
    fontSize: "28px",
    fontWeight: "600",
    margin: "0 0 8px 0",
    color: "#111827"
  },
  pageSubtitle: {
    fontSize: "16px",
    color: "#6b7280",
    margin: "0 0 32px 0"
  },
  card: {
    backgroundColor: "white",
    padding: "32px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    maxWidth: "600px"
  },
  cardTitle: {
    fontSize: "20px",
    fontWeight: "600",
    margin: "0 0 8px 0",
    color: "#111827"
  },
  cardDescription: {
    fontSize: "14px",
    color: "#6b7280",
    margin: "0 0 24px 0"
  },
  formGroup: {
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
  saveButton: {
    padding: "12px 24px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    marginBottom: "16px"
  },
  successMessage: {
    backgroundColor: "#d1fae5",
    color: "#065f46",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "16px",
    fontSize: "14px"
  },
  errorMessage: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "16px",
    fontSize: "14px"
  },
  note: {
    backgroundColor: "#f3f4f6",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#4b5563"
  }
};

export default HRSettings;