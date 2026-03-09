import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import { collection, getDocs, query, orderBy, updateDoc, doc } from 'firebase/firestore';

function LeaveManagement() {
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [customDate, setCustomDate] = useState('');

  useEffect(() => {
    fetchLeaves();
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterLeaves();
  }, [leaves, statusFilter, dateFilter, searchTerm, customDate]);

  const fetchLeaves = async () => {
    try {
      const leavesQuery = query(collection(db, "leaves"), orderBy("appliedOn", "desc"));
      const leavesSnap = await getDocs(leavesQuery);
      const leavesData = leavesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLeaves(leavesData);
      setFilteredLeaves(leavesData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching leaves:", error);
      setLoading(false);
    }
  };

  const filterLeaves = () => {
    let filtered = [...leaves];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(leave => leave.status === statusFilter);
    }

    // Date filter
    const today = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear();

    if (dateFilter === 'today') {
      filtered = filtered.filter(leave => leave.fromDate === today || leave.toDate === today);
    } else if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];
      filtered = filtered.filter(leave => leave.fromDate >= weekAgoStr);
    } else if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const monthAgoStr = monthAgo.toISOString().split('T')[0];
      filtered = filtered.filter(leave => leave.fromDate >= monthAgoStr);
    } else if (dateFilter === 'year') {
      filtered = filtered.filter(leave => {
        const leaveYear = new Date(leave.fromDate).getFullYear();
        return leaveYear === currentYear;
      });
    } else if (dateFilter === 'custom' && customDate) {
      filtered = filtered.filter(leave => leave.fromDate === customDate);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(leave => 
        leave.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        leave.employeeEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        leave.type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLeaves(filtered);
  };

  const handleApprove = async (leaveId) => {
    if (window.confirm('Are you sure you want to approve this leave?')) {
      try {
        await updateDoc(doc(db, "leaves", leaveId), {
          status: 'approved',
          approvedBy: auth.currentUser?.email,
          approvedOn: new Date(),
          comments: 'Approved by HR'
        });
        
        setLeaves(leaves.map(leave => 
          leave.id === leaveId ? {...leave, status: 'approved'} : leave
        ));
        alert('Leave approved successfully!');
      } catch (error) {
        console.error("Error approving leave:", error);
        alert('Failed to approve leave');
      }
    }
  };

  const openRejectModal = (leave) => {
    setSelectedLeave(leave);
    setRejectModal(true);
    setRejectReason('');
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      await updateDoc(doc(db, "leaves", selectedLeave.id), {
        status: 'rejected',
        approvedBy: auth.currentUser?.email,
        approvedOn: new Date(),
        comments: rejectReason,
        rejectionReason: rejectReason
      });
      
      setLeaves(leaves.map(leave => 
        leave.id === selectedLeave.id ? {...leave, status: 'rejected', comments: rejectReason} : leave
      ));
      
      setRejectModal(false);
      setSelectedLeave(null);
      setRejectReason('');
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

  const handleNavigation = (path) => {
    navigate(path);
  };

  const stats = {
    pending: leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
    total: leaves.length,
    today: leaves.filter(l => l.fromDate === new Date().toISOString().split('T')[0]).length
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('en-IN');
    }
    return timestamp;
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { backgroundColor: "#fef3c7", color: "#92400e" },
      approved: { backgroundColor: "#d1fae5", color: "#065f46" },
      rejected: { backgroundColor: "#fee2e2", color: "#991b1b" }
    };
    return styles[status] || styles.pending;
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
          <div style={styles.menuItem} onClick={() => handleNavigation('/hr/dashboard')}>Dashboard</div>
          <div style={styles.menuItem} onClick={() => handleNavigation('/hr/employees')}>Employees</div>
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
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📅</div>
            <div>
              <div style={styles.statLabel}>Today</div>
              <div style={styles.statValue}>{stats.today}</div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div style={styles.filtersContainer}>
          {/* Search */}
          <div style={styles.searchBox}>
            <input
              type="text"
              placeholder="Search by employee or leave type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          {/* Status Filter */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Status:</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Date Filter */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Date:</label>
            <select 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Date</option>
            </select>
          </div>

          {/* Custom Date Picker */}
          {dateFilter === 'custom' && (
            <div style={styles.filterGroup}>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                style={styles.dateInput}
              />
            </div>
          )}

          {/* Clear Filters */}
          <button 
            onClick={() => {
              setStatusFilter('all');
              setDateFilter('all');
              setSearchTerm('');
              setCustomDate('');
            }}
            style={styles.clearButton}
          >
            Clear Filters
          </button>
        </div>

        {/* Results Count */}
        <div style={styles.resultsCount}>
          Showing {filteredLeaves.length} of {leaves.length} requests
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
                  <th style={styles.tableHeader}>Comments</th>
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
                        ...getStatusBadge(leave.status)
                      }}>
                        {leave.status}
                      </span>
                    </td>
                    <td style={styles.tableCell}>
                      {leave.comments && (
                        <span style={styles.commentText}>{leave.comments}</span>
                      )}
                    </td>
                    <td style={styles.tableCell}>
                      {leave.status === 'pending' && (
                        <div style={styles.actionButtons}>
                          <button
                            onClick={() => handleApprove(leave.id)}
                            style={styles.approveBtn}
                            title="Approve leave"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => openRejectModal(leave)}
                            style={styles.rejectBtn}
                            title="Reject leave with reason"
                          >
                            ✗
                          </button>
                        </div>
                      )}
                      {leave.status !== 'pending' && (
                        <span style={styles.processedText}>Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Reject Leave Request</h3>
            <p style={styles.modalSubtitle}>
              Rejecting leave for: <strong>{selectedLeave?.employeeName}</strong>
            </p>
            <p style={styles.modalSubtitle}>
              Leave Type: {selectedLeave?.type} ({selectedLeave?.days} days)
            </p>
            
            <div style={styles.modalForm}>
              <label style={styles.modalLabel}>Reason for Rejection *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={styles.modalTextarea}
                placeholder="Please provide reason for rejecting this leave request..."
                rows="4"
                autoFocus
              />
            </div>

            <div style={styles.modalActions}>
              <button 
                onClick={() => setRejectModal(false)} 
                style={styles.modalCancelButton}
              >
                Cancel
              </button>
              <button 
                onClick={handleReject} 
                style={styles.modalRejectButton}
              >
                Reject Leave
              </button>
            </div>
          </div>
        </div>
      )}
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
    gridTemplateColumns: "repeat(4, 1fr)",
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
  filtersContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "15px",
    marginBottom: "20px",
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px",
    alignItems: "center"
  },
  searchBox: {
    flex: 2,
    minWidth: "250px"
  },
  searchInput: {
    width: "100%",
    padding: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px"
  },
  filterGroup: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: "150px"
  },
  filterLabel: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151"
  },
  filterSelect: {
    padding: "8px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    backgroundColor: "white",
    flex: 1
  },
  dateInput: {
    padding: "8px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    width: "150px"
  },
  clearButton: {
    padding: "8px 16px",
    backgroundColor: "#f3f4f6",
    color: "#4b5563",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    cursor: "pointer"
  },
  resultsCount: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "10px"
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
    minWidth: "1200px"
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
    fontWeight: "500",
    display: "inline-block"
  },
  commentText: {
    fontSize: "12px",
    color: "#6b7280",
    maxWidth: "200px",
    display: "block",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  actionButtons: {
    display: "flex",
    gap: "8px"
  },
  approveBtn: {
    width: "32px",
    height: "32px",
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  rejectBtn: {
    width: "32px",
    height: "32px",
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  processedText: {
    fontSize: "12px",
    color: "#9ca3af"
  },
  modalOverlay: {
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
    maxWidth: "90%"
  },
  modalTitle: {
    fontSize: "20px",
    fontWeight: "600",
    margin: "0 0 10px 0"
  },
  modalSubtitle: {
    fontSize: "14px",
    color: "#4b5563",
    margin: "5px 0"
  },
  modalForm: {
    marginTop: "20px"
  },
  modalLabel: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    marginBottom: "8px"
  },
  modalTextarea: {
    width: "100%",
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical",
    boxSizing: "border-box"
  },
  modalActions: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
    marginTop: "24px"
  },
  modalCancelButton: {
    padding: "10px 20px",
    backgroundColor: "#f3f4f6",
    color: "#4b5563",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  },
  modalRejectButton: {
    padding: "10px 20px",
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  }
};

export default LeaveManagement;