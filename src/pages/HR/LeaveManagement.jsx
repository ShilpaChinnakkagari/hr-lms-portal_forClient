import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import { collection, getDocs, query, orderBy, updateDoc, doc } from 'firebase/firestore';

function LeaveManagement() {
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const leavesQuery = query(collection(db, "leaves"), orderBy("appliedOn", "desc"));
      const leavesSnap = await getDocs(leavesQuery);
      const leavesData = leavesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLeaves(leavesData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching leaves:", error);
      setLoading(false);
    }
  };

  const handleApprove = async (leaveId) => {
    try {
      await updateDoc(doc(db, "leaves", leaveId), {
        status: 'approved',
        approvedBy: auth.currentUser?.email,
        approvedOn: new Date()
      });
      
      setLeaves(leaves.map(leave => 
        leave.id === leaveId ? {...leave, status: 'approved'} : leave
      ));
      alert('Leave approved successfully!');
    } catch (error) {
      console.error("Error approving leave:", error);
      alert('Failed to approve leave');
    }
  };

  const handleReject = async (leaveId) => {
    try {
      await updateDoc(doc(db, "leaves", leaveId), {
        status: 'rejected',
        approvedBy: auth.currentUser?.email,
        approvedOn: new Date()
      });
      
      setLeaves(leaves.map(leave => 
        leave.id === leaveId ? {...leave, status: 'rejected'} : leave
      ));
      alert('Leave rejected successfully!');
    } catch (error) {
      console.error("Error rejecting leave:", error);
      alert('Failed to reject leave');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const filteredLeaves = filter === 'all' 
    ? leaves 
    : leaves.filter(leave => leave.status === filter);

  const stats = {
    pending: leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('en-IN');
    }
    return timestamp;
  };

  if (loading) {
    return <div style={styles.loading}>Loading leave requests...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <h2 style={styles.logo}>HR Portal</h2>
        <div style={styles.menu}>
          <div style={styles.menuItem} onClick={() => navigate('/hr/dashboard')}>Dashboard</div>
          <div style={styles.menuItem} onClick={() => navigate('/hr/employees')}>Employees</div>
          <div style={styles.menuItemActive}>Leave Management</div>
        </div>
        <button onClick={handleLogout} style={styles.logout}>Logout</button>
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        <h1 style={styles.pageTitle}>Leave Management</h1>
        <p style={styles.pageSubtitle}>Review and manage employee leave requests</p>

        {/* Stats Cards */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>⏳</div>
            <div>
              <div style={styles.statLabel}>Pending</div>
              <div style={styles.statValue}>{stats.pending}</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>✅</div>
            <div>
              <div style={styles.statLabel}>Approved</div>
              <div style={styles.statValue}>{stats.approved}</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>❌</div>
            <div>
              <div style={styles.statLabel}>Rejected</div>
              <div style={styles.statValue}>{stats.rejected}</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={styles.filterTabs}>
          {['all', 'pending', 'approved', 'rejected'].map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              style={{
                ...styles.filterTab,
                ...(filter === type ? styles.activeFilterTab : {})
              }}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Leave Requests Table */}
        <div style={styles.tableContainer}>
          {filteredLeaves.length === 0 ? (
            <div style={styles.emptyState}>No leave requests found</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>Employee</th>
                  <th style={styles.tableHeader}>Leave Type</th>
                  <th style={styles.tableHeader}>Duration</th>
                  <th style={styles.tableHeader}>Days</th>
                  <th style={styles.tableHeader}>Reason</th>
                  <th style={styles.tableHeader}>Applied On</th>
                  <th style={styles.tableHeader}>Status</th>
                  <th style={styles.tableHeader}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.map(leave => (
                  <tr key={leave.id} style={styles.tableRow}>
                    <td style={styles.tableCell}>
                      <div style={styles.employeeName}>{leave.employeeName}</div>
                      <div style={styles.employeeEmail}>{leave.employeeEmail}</div>
                    </td>
                    <td style={styles.tableCell}>
                      <span style={styles.leaveType}>{leave.type}</span>
                    </td>
                    <td style={styles.tableCell}>
                      {leave.fromDate} → {leave.toDate}
                    </td>
                    <td style={styles.tableCell}>{leave.days} days</td>
                    <td style={styles.tableCell}>{leave.reason}</td>
                    <td style={styles.tableCell}>{formatDate(leave.appliedOn)}</td>
                    <td style={styles.tableCell}>
                      <span style={{
                        ...styles.statusBadge,
                        ...(leave.status === 'pending' ? styles.pendingStatus : {}),
                        ...(leave.status === 'approved' ? styles.approvedStatus : {}),
                        ...(leave.status === 'rejected' ? styles.rejectedStatus : {})
                      }}>
                        {leave.status}
                      </span>
                    </td>
                    <td style={styles.tableCell}>
                      {leave.status === 'pending' && (
                        <div style={styles.actionButtons}>
                          <button
                            onClick={() => handleApprove(leave.id)}
                            style={styles.approveBtn}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(leave.id)}
                            style={styles.rejectBtn}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
    alignItems: "center",
    backgroundColor: "#f3f4f6"
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
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
    marginBottom: "32px"
  },
  statCard: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    display: "flex",
    alignItems: "center",
    gap: "16px"
  },
  statIcon: {
    fontSize: "32px",
    backgroundColor: "#f3f4f6",
    width: "60px",
    height: "60px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "12px"
  },
  statLabel: {
    color: "#6b7280",
    fontSize: "14px",
    marginBottom: "4px"
  },
  statValue: {
    fontSize: "28px",
    fontWeight: "600"
  },
  filterTabs: {
    display: "flex",
    gap: "12px",
    marginBottom: "24px"
  },
  filterTab: {
    padding: "8px 16px",
    backgroundColor: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer"
  },
  activeFilterTab: {
    backgroundColor: "#3b82f6",
    color: "white",
    borderColor: "#3b82f6"
  },
  tableContainer: {
    backgroundColor: "white",
    borderRadius: "12px",
    overflow: "auto"
  },
  emptyState: {
    textAlign: "center",
    padding: "48px",
    color: "#9ca3af",
    fontSize: "14px"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1000px"
  },
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
    borderBottom: "1px solid #e5e7eb"
  },
  tableCell: {
    padding: "16px",
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
  leaveType: {
    backgroundColor: "#f3f4f6",
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "12px"
  },
  statusBadge: {
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "500"
  },
  pendingStatus: {
    backgroundColor: "#fef3c7",
    color: "#92400e"
  },
  approvedStatus: {
    backgroundColor: "#d1fae5",
    color: "#065f46"
  },
  rejectedStatus: {
    backgroundColor: "#fee2e2",
    color: "#991b1b"
  },
  actionButtons: {
    display: "flex",
    gap: "8px"
  },
  approveBtn: {
    padding: "6px 12px",
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    cursor: "pointer"
  },
  rejectBtn: {
    padding: "6px 12px",
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    cursor: "pointer"
  }
};

export default LeaveManagement;