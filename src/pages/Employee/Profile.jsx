import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Define styles at the VERY TOP before the component
const styles = {
  loading: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6"
  },
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
    position: "relative"
  },
  toggleButton: {
    position: "absolute",
    right: "-12px",
    top: "20px",
    width: "24px",
    height: "24px",
    backgroundColor: "#374151",
    border: "2px solid #111827",
    borderRadius: "50%",
    color: "white",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    zIndex: 10
  },
  sidebarHeader: {
    padding: "24px 20px",
    borderBottom: "1px solid #1f2937",
    textAlign: "left"
  },
  logo: {
    fontSize: "20px",
    fontWeight: "600",
    margin: 0
  },
  sidebarMenu: {
    flex: 1,
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "5px"
  },
  menuItem: {
    padding: "12px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "#9ca3af"
  },
  activeMenuItem: {
    backgroundColor: "#374151",
    color: "white"
  },
  logoutButton: {
    margin: "20px",
    padding: "12px",
    backgroundColor: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: "12px"
  },
  mainContent: {
    flex: 1,
    backgroundColor: "#f9fafb",
    padding: "32px",
    overflowY: "auto"
  },
  pageTitle: {
    fontSize: "28px",
    fontWeight: "600",
    margin: "0 0 24px 0",
    color: "#111827"
  },
  profileContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "24px"
  },
  section: {
    backgroundColor: "white",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    margin: "0 0 20px 0",
    color: "#111827",
    borderBottom: "2px solid #f3f4f6",
    paddingBottom: "10px"
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px"
  },
  infoItemLabel: {
    fontSize: "12px",
    color: "#6b7280",
    display: "block",
    marginBottom: "4px"
  },
  infoItemValue: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#111827",
    margin: 0
  },
  documentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px",
    marginTop: "15px"
  },
  documentCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px",
    backgroundColor: "#f3f4f6",
    borderRadius: "6px"
  },
  viewBtn: {
    padding: "4px 12px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px"
  },
  salaryCard: {
    backgroundColor: "#f3f4f6",
    padding: "16px",
    borderRadius: "8px"
  },
  salaryRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px solid #e5e7eb"
  },
  salaryRowTotal: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    fontWeight: "600",
    fontSize: "16px"
  }
};

function EmployeeProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchProfile(currentUser);
      } else {
        navigate('/login');
      }
    });
    return unsubscribe;
  }, [navigate]);

  const fetchProfile = async (currentUser) => {
    try {
      const usersRef = collection(db, "users");
      const userQuery = query(usersRef, where("email", "==", currentUser.email));
      const userSnap = await getDocs(userQuery);
      
      if (!userSnap.empty) {
        setProfile(userSnap.docs[0].data());
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleViewDocument = (url) => {
    if (url) window.open(url, '_blank');
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  if (loading) {
    return <div style={styles.loading}>Loading profile...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={styles.toggleButton}
        >
          {sidebarCollapsed ? '→' : '←'}
        </button>

        <div style={styles.sidebarHeader}>
          {sidebarCollapsed ? (
            <span style={{ fontSize: "24px" }}>👤</span>
          ) : (
            <h2 style={styles.logo}>Employee Portal</h2>
          )}
        </div>

        <div style={styles.sidebarMenu}>
          <div style={styles.menuItem} onClick={() => handleNavigation('/employee/dashboard')}>
            <span style={{ fontSize: "20px" }}>📊</span>
            {!sidebarCollapsed && <span>Dashboard</span>}
          </div>
          
          <div style={styles.menuItem} onClick={() => handleNavigation('/employee/apply-leave')}>
            <span style={{ fontSize: "20px" }}>✈️</span>
            {!sidebarCollapsed && <span>Apply Leave</span>}
          </div>

          <div style={{...styles.menuItem, ...styles.activeMenuItem}}>
            <span style={{ fontSize: "20px" }}>👤</span>
            {!sidebarCollapsed && <span>My Profile</span>}
          </div>

          <div style={styles.menuItem} onClick={() => handleNavigation('/employee/salary-slips')}>
            <span style={{ fontSize: "20px" }}>💰</span>
            {!sidebarCollapsed && <span>Salary Slips</span>}
          </div>
        </div>

        <button onClick={handleLogout} style={styles.logoutButton}>
          <span style={{ fontSize: "20px" }}>🚪</span>
          {!sidebarCollapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        <h1 style={styles.pageTitle}>My Profile</h1>

        {profile && (
          <div style={styles.profileContainer}>
            {/* Personal Information */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Personal Information</h2>
              <div style={styles.infoGrid}>
                <div>
                  <label style={styles.infoItemLabel}>Full Name</label>
                  <p style={styles.infoItemValue}>{profile.name}</p>
                </div>
                <div>
                  <label style={styles.infoItemLabel}>Email</label>
                  <p style={styles.infoItemValue}>{profile.email}</p>
                </div>
                <div>
                  <label style={styles.infoItemLabel}>Phone</label>
                  <p style={styles.infoItemValue}>{profile.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label style={styles.infoItemLabel}>Department</label>
                  <p style={styles.infoItemValue}>{profile.department}</p>
                </div>
                <div>
                  <label style={styles.infoItemLabel}>Designation</label>
                  <p style={styles.infoItemValue}>{profile.designation || 'Not provided'}</p>
                </div>
                <div>
                  <label style={styles.infoItemLabel}>Join Date</label>
                  <p style={styles.infoItemValue}>{profile.joinDate}</p>
                </div>
              </div>
            </div>

            {/* Family Details */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Family Details</h2>
              <div style={styles.infoGrid}>
                <div>
                  <label style={styles.infoItemLabel}>Father's Name</label>
                  <p style={styles.infoItemValue}>{profile.fatherName || 'Not provided'}</p>
                </div>
                <div>
                  <label style={styles.infoItemLabel}>Mother's Name</label>
                  <p style={styles.infoItemValue}>{profile.motherName || 'Not provided'}</p>
                </div>
                <div>
                  <label style={styles.infoItemLabel}>Date of Birth</label>
                  <p style={styles.infoItemValue}>{profile.dateOfBirth || 'Not provided'}</p>
                </div>
                <div>
                  <label style={styles.infoItemLabel}>Blood Group</label>
                  <p style={styles.infoItemValue}>{profile.bloodGroup || 'Not provided'}</p>
                </div>
                <div>
                  <label style={styles.infoItemLabel}>Emergency Contact</label>
                  <p style={styles.infoItemValue}>{profile.emergencyContact || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Identity Documents */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Identity Documents</h2>
              <div style={styles.infoGrid}>
                <div>
                  <label style={styles.infoItemLabel}>PAN Number</label>
                  <p style={styles.infoItemValue}>{profile.panNumber || 'Not provided'}</p>
                </div>
                <div>
                  <label style={styles.infoItemLabel}>Aadhaar Number</label>
                  <p style={styles.infoItemValue}>{profile.aadhaarNumber || 'Not provided'}</p>
                </div>
              </div>
              
              <div style={styles.documentGrid}>
                {profile.documents?.panCard && (
                  <div style={styles.documentCard}>
                    <span>📄 PAN Card</span>
                    <button onClick={() => handleViewDocument(profile.documents.panCard)} style={styles.viewBtn}>
                      View
                    </button>
                  </div>
                )}
                {profile.documents?.aadhaarCard && (
                  <div style={styles.documentCard}>
                    <span>📄 Aadhaar Card</span>
                    <button onClick={() => handleViewDocument(profile.documents.aadhaarCard)} style={styles.viewBtn}>
                      View
                    </button>
                  </div>
                )}
                {profile.documents?.resume && (
                  <div style={styles.documentCard}>
                    <span>📄 Resume</span>
                    <button onClick={() => handleViewDocument(profile.documents.resume)} style={styles.viewBtn}>
                      View
                    </button>
                  </div>
                )}
                {profile.documents?.offerLetter && (
                  <div style={styles.documentCard}>
                    <span>📄 Offer Letter</span>
                    <button onClick={() => handleViewDocument(profile.documents.offerLetter)} style={styles.viewBtn}>
                      View
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bank Details */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Bank Details</h2>
              <div style={styles.infoGrid}>
                <div>
                  <label style={styles.infoItemLabel}>Account Number</label>
                  <p style={styles.infoItemValue}>{profile.bankDetails?.accountNumber || 'Not provided'}</p>
                </div>
                <div>
                  <label style={styles.infoItemLabel}>IFSC Code</label>
                  <p style={styles.infoItemValue}>{profile.bankDetails?.ifscCode || 'Not provided'}</p>
                </div>
                <div>
                  <label style={styles.infoItemLabel}>Bank Name</label>
                  <p style={styles.infoItemValue}>{profile.bankDetails?.bankName || 'Not provided'}</p>
                </div>
                <div>
                  <label style={styles.infoItemLabel}>Branch</label>
                  <p style={styles.infoItemValue}>{profile.bankDetails?.branchName || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Salary Details */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Salary Details</h2>
              <div style={styles.salaryCard}>
                <div style={styles.salaryRow}>
                  <span>Basic Salary:</span>
                  <span>₹{profile.salary?.basic?.toLocaleString() || 0}</span>
                </div>
                <div style={styles.salaryRow}>
                  <span>HRA:</span>
                  <span>₹{profile.salary?.hra?.toLocaleString() || 0}</span>
                </div>
                <div style={styles.salaryRow}>
                  <span>DA:</span>
                  <span>₹{profile.salary?.da?.toLocaleString() || 0}</span>
                </div>
                <div style={styles.salaryRow}>
                  <span>Special Allowance:</span>
                  <span>₹{profile.salary?.specialAllowance?.toLocaleString() || 0}</span>
                </div>
                <div style={styles.salaryRowTotal}>
                  <span>Net Salary:</span>
                  <span>₹{profile.salary?.netSalary?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeProfile;