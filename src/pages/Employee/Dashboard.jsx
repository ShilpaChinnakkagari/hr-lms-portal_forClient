import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

function EmployeeDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leaveLimits, setLeaveLimits] = useState({});
  const [usedLeaves, setUsedLeaves] = useState({});
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchEmployeeData(currentUser);
      } else {
        navigate('/login');
      }
    });
    return unsubscribe;
  }, [navigate]);

  const fetchEmployeeData = async (currentUser) => {
    try {
      // Get employee's leave limits
      const usersRef = collection(db, "users");
      const userQuery = query(usersRef, where("email", "==", currentUser.email));
      const userSnap = await getDocs(userQuery);
      
      let limits = {
        cas: 12,
        sic: 10,
        ear: 15,
        mar: 5,
        ber: 3
      };
      
      if (!userSnap.empty) {
        const userData = userSnap.docs[0].data();
        limits = {
          cas: userData.leaveLimits?.cas || 12,
          sic: userData.leaveLimits?.sic || 10,
          ear: userData.leaveLimits?.ear || 15,
          mar: userData.leaveLimits?.mar || 5,
          ber: userData.leaveLimits?.ber || 3
        };
      }
      setLeaveLimits(limits);

      // Fetch ALL leave requests for this employee
      const leavesRef = collection(db, "leaves");
      const leavesQuery = query(
        leavesRef,
        where("employeeId", "==", currentUser.uid)
      );
      
      const leavesSnap = await getDocs(leavesQuery);
      
      const requests = [];
      const used = { cas: 0, sic: 0, ear: 0, mar: 0, ber: 0 };
      
      leavesSnap.forEach(doc => {
        const leave = { id: doc.id, ...doc.data() };
        requests.push(leave);
        
        // Only count APPROVED leaves for used balance
        if (leave.status === 'approved') {
          const days = leave.days || 0;
          
          if (leave.type === 'Casual Leave') {
            used.cas += days;
          }
          else if (leave.type === 'Sick Leave') used.sic += days;
          else if (leave.type === 'Earned Leave') used.ear += days;
          else if (leave.type === 'Marriage Leave') used.mar += days;
          else if (leave.type === 'Bereavement Leave') used.ber += days;
        }
      });

      setUsedLeaves(used);
      setLeaveRequests(requests);
      
      setLoading(false);

    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'approved':
        return { backgroundColor: "#d1fae5", color: "#065f46" };
      case 'rejected':
        return { backgroundColor: "#fee2e2", color: "#991b1b" };
      default:
        return { backgroundColor: "#fef3c7", color: "#92400e" };
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('en-IN');
    }
    return timestamp;
  };

  const getLeaveTypeLabel = (key) => {
    const labels = {
      cas: 'Casual Leave',
      sic: 'Sick Leave',
      ear: 'Earned Leave',
      mar: 'Marriage Leave',
      ber: 'Bereavement Leave'
    };
    return labels[key] || key;
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
        Loading your dashboard...
      </div>
    );
  }

  const activeLeaveTypes = Object.entries(leaveLimits)
    .filter(([_, limit]) => limit > 0)
    .map(([key, limit]) => ({ key, limit }));

  const styles = {
    container: {
      display: "flex",
      height: "100vh",
      width: "100vw",
      fontFamily: "sans-serif",
      overflow: "hidden"
    },
    sidebar: {
      width: sidebarCollapsed ? "70px" : "250px",
      backgroundColor: "#111827",
      color: "white",
      height: "100vh",
      transition: "width 0.3s ease",
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
      padding: sidebarCollapsed ? "20px 0" : "24px 20px",
      borderBottom: "1px solid #1f2937",
      textAlign: sidebarCollapsed ? "center" : "left"
    },
    logo: {
      fontSize: "20px",
      fontWeight: "600",
      margin: 0
    },
    sidebarMenu: {
      flex: 1,
      padding: sidebarCollapsed ? "20px 0" : "20px",
      display: "flex",
      flexDirection: "column",
      gap: "5px"
    },
    menuItem: {
      padding: sidebarCollapsed ? "12px 0" : "12px 16px",
      borderRadius: "6px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: sidebarCollapsed ? "center" : "flex-start",
      gap: "12px",
      color: "#9ca3af"
    },
    activeMenuItem: {
      backgroundColor: "#374151",
      color: "white"
    },
    logoutButton: {
      margin: sidebarCollapsed ? "10px" : "20px",
      padding: sidebarCollapsed ? "12px 0" : "12px",
      backgroundColor: "#dc2626",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: sidebarCollapsed ? "center" : "flex-start",
      gap: "12px"
    },
    mainContent: {
      flex: 1,
      backgroundColor: "#f9fafb",
      padding: "32px",
      overflowY: "auto",
      height: "100vh"
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "32px"
    },
    welcome: {
      fontSize: "28px",
      fontWeight: "600",
      margin: "0 0 8px 0",
      color: "#111827"
    },
    subtitle: {
      fontSize: "16px",
      color: "#6b7280",
      margin: 0
    },
    userInfo: {
      display: "flex",
      alignItems: "center",
      gap: "15px",
      backgroundColor: "white",
      padding: "8px 16px",
      borderRadius: "8px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
    },
    userEmail: {
      fontSize: "14px",
      color: "#4b5563"
    },
    userAvatar: {
      width: "32px",
      height: "32px",
      borderRadius: "50%",
      backgroundColor: "#3b82f6",
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: "600"
    },
    balanceContainer: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
      gap: "20px",
      marginBottom: "32px"
    },
    balanceCard: {
      backgroundColor: "white",
      padding: "20px",
      borderRadius: "12px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
    },
    cardHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "15px"
    },
    leaveType: {
      fontSize: "16px",
      fontWeight: "600"
    },
    statusBadge: {
      padding: "4px 8px",
      borderRadius: "12px",
      fontSize: "12px",
      fontWeight: "500"
    },
    progressBar: {
      height: "8px",
      backgroundColor: "#f3f4f6",
      borderRadius: "4px",
      marginBottom: "10px",
      overflow: "hidden"
    },
    progressFill: {
      height: "100%",
      borderRadius: "4px",
      transition: "width 0.3s ease"
    },
    leaveStats: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: "13px",
      color: "#6b7280"
    },
    requestsSection: {
      backgroundColor: "white",
      padding: "24px",
      borderRadius: "12px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      marginBottom: "32px"
    },
    sectionHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px"
    },
    sectionTitle: {
      fontSize: "18px",
      fontWeight: "600",
      margin: 0
    },
    applyButton: {
      padding: "8px 16px",
      backgroundColor: "#3b82f6",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "5px"
    },
    emptyState: {
      textAlign: "center",
      padding: "48px",
      color: "#9ca3af",
      backgroundColor: "#f9fafb",
      borderRadius: "8px"
    },
    emptyStateButton: {
      marginTop: "16px",
      padding: "8px 16px",
      backgroundColor: "#3b82f6",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer"
    },
    requestsList: {
      display: "flex",
      flexDirection: "column",
      gap: "12px"
    },
    requestCard: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px",
      backgroundColor: "#f9fafb",
      borderRadius: "8px",
      border: "1px solid #e5e7eb"
    },
    requestInfo: {
      flex: 1
    },
    requestHeader: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "4px"
    },
    requestType: {
      fontSize: "14px",
      fontWeight: "600"
    },
    requestDays: {
      fontSize: "12px",
      color: "#6b7280"
    },
    requestDates: {
      fontSize: "13px",
      color: "#4b5563",
      marginBottom: "4px"
    },
    requestReason: {
      fontSize: "13px",
      color: "#6b7280",
      marginBottom: "4px"
    },
    requestMeta: {
      fontSize: "11px",
      color: "#9ca3af"
    },
    requestStatus: {
      padding: "4px 12px",
      borderRadius: "16px",
      fontSize: "12px",
      fontWeight: "500",
      marginLeft: "16px"
    },
    quickStats: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "20px"
    },
    statCard: {
      backgroundColor: "white",
      padding: "16px",
      borderRadius: "8px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      textAlign: "center"
    },
    statIcon: {
      fontSize: "24px",
      marginBottom: "5px"
    },
    statValue: {
      fontSize: "20px",
      fontWeight: "600"
    },
    statLabel: {
      fontSize: "12px",
      color: "#6b7280"
    }
  };

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
          <div style={{...styles.menuItem, ...styles.activeMenuItem}} onClick={() => navigate('/employee/dashboard')}>
            <span style={{ fontSize: "20px" }}>📊</span>
            {!sidebarCollapsed && <span>Dashboard</span>}
          </div>
          
          <div style={styles.menuItem} onClick={() => navigate('/employee/apply-leave')}>
            <span style={{ fontSize: "20px" }}>✈️</span>
            {!sidebarCollapsed && <span>Apply Leave</span>}
          </div>

          <div style={styles.menuItem} onClick={() => navigate('/employee/profile')}>
            <span style={{ fontSize: "20px" }}>👤</span>
            {!sidebarCollapsed && <span>My Profile</span>}
          </div>

          <div style={styles.menuItem} onClick={() => navigate('/employee/salary-slips')}>
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
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.welcome}>Welcome, {user?.displayName?.split(' ')[0] || 'Employee'} 👋</h1>
            <p style={styles.subtitle}>Your Leave Summary</p>
          </div>
          <div style={styles.userInfo}>
            <span style={styles.userEmail}>{user?.email}</span>
            <div style={styles.userAvatar}>
              {user?.displayName?.charAt(0) || 'U'}
            </div>
          </div>
        </div>

        {/* Leave Balance Cards */}
        <div style={styles.balanceContainer}>
          {activeLeaveTypes.map(({ key, limit }) => {
            const used = usedLeaves[key] || 0;
            const remaining = limit - used;
            const percentage = (used / limit) * 100;
            
            return (
              <div key={key} style={styles.balanceCard}>
                <div style={styles.cardHeader}>
                  <span style={styles.leaveType}>{getLeaveTypeLabel(key)}</span>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: remaining > 0 ? '#d1fae5' : '#fee2e2',
                    color: remaining > 0 ? '#065f46' : '#991b1b'
                  }}>
                    {remaining} left
                  </span>
                </div>
                <div style={styles.progressBar}>
                  <div style={{
                    ...styles.progressFill,
                    width: `${Math.min(percentage, 100)}%`,
                    backgroundColor: percentage > 90 ? '#ef4444' : '#3b82f6'
                  }} />
                </div>
                <div style={styles.leaveStats}>
                  <span>Used: {used} days</span>
                  <span>Total: {limit} days</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Leave Requests Section */}
        <div style={styles.requestsSection}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Your Leave Requests</h2>
            <button
              onClick={() => navigate('/employee/apply-leave')}
              style={styles.applyButton}
            >
              + Apply Leave
            </button>
          </div>
          
          {leaveRequests.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={{ marginBottom: "16px" }}>No leave requests yet</p>
              <button
                onClick={() => navigate('/employee/apply-leave')}
                style={styles.emptyStateButton}
              >
                Apply for Leave
              </button>
            </div>
          ) : (
            <div style={styles.requestsList}>
              {leaveRequests.map(leave => (
                <div key={leave.id} style={styles.requestCard}>
                  <div style={styles.requestInfo}>
                    <div style={styles.requestHeader}>
                      <span style={styles.requestType}>{leave.type}</span>
                      <span style={styles.requestDays}>{leave.days} days</span>
                    </div>
                    <div style={styles.requestDates}>
                      {leave.fromDate} → {leave.toDate}
                    </div>
                    <div style={styles.requestReason}>
                      Reason: {leave.reason}
                    </div>
                    <div style={styles.requestMeta}>
                      Applied: {formatDate(leave.appliedOn)}
                    </div>
                  </div>
                  <span style={{
                    ...styles.requestStatus,
                    ...getStatusStyle(leave.status)
                  }}>
                    {leave.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div style={styles.quickStats}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📊</div>
            <div style={styles.statValue}>{leaveRequests.length}</div>
            <div style={styles.statLabel}>Total Requests</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>✅</div>
            <div style={styles.statValue}>
              {leaveRequests.filter(l => l.status === 'approved').length}
            </div>
            <div style={styles.statLabel}>Approved</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>⏳</div>
            <div style={styles.statValue}>
              {leaveRequests.filter(l => l.status === 'pending').length}
            </div>
            <div style={styles.statLabel}>Pending</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📅</div>
            <div style={styles.statValue}>
              {Object.values(usedLeaves).reduce((a, b) => a + b, 0)}
            </div>
            <div style={styles.statLabel}>Total Used</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeDashboard;