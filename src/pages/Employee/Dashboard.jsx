import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

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
        console.log("Current user UID:", currentUser.uid);
        console.log("Current user email:", currentUser.email);
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
      // 1. Get employee's leave limits
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
        console.log("User data:", userData);
        limits = {
          cas: userData.cas || 12,
          sic: userData.sic || 10,
          ear: userData.ear || 15,
          mar: userData.mar || 5,
          ber: userData.ber || 3
        };
      }
      setLeaveLimits(limits);

      // 2. Fetch ALL leave requests for this employee
      const leavesRef = collection(db, "leaves");
      console.log("Querying leaves for employeeId:", currentUser.uid);
      
      const leavesQuery = query(
        leavesRef,
        where("employeeId", "==", currentUser.uid)
      );
      
      const leavesSnap = await getDocs(leavesQuery);
      console.log("Found leaves count:", leavesSnap.size);
      
      const requests = [];
      const used = { cas: 0, sic: 0, ear: 0, mar: 0, ber: 0 };
      
      leavesSnap.forEach(doc => {
        const leave = { id: doc.id, ...doc.data() };
        console.log("Leave found:", leave);
        requests.push(leave);
        
        if (leave.status === 'approved') {
          const typeLabel = leave.type || '';
          const days = leave.days || 0;
          
          if (typeLabel.includes('Casual')) used.cas += days;
          else if (typeLabel.includes('Sick')) used.sic += days;
          else if (typeLabel.includes('Earned')) used.ear += days;
          else if (typeLabel.includes('Marriage')) used.mar += days;
          else if (typeLabel.includes('Bereavement')) used.ber += days;
        }
      });

      console.log("Used leaves:", used);
      console.log("Leave requests:", requests);

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
        width: sidebarCollapsed ? "70px" : "250px",
        backgroundColor: "#111827",
        color: "white",
        height: "100vh",
        transition: "width 0.3s ease",
        display: "flex",
        flexDirection: "column",
        position: "relative"
      }}>
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{
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
          }}
        >
          {sidebarCollapsed ? '→' : '←'}
        </button>

        <div style={{
          padding: sidebarCollapsed ? "20px 0" : "24px 20px",
          borderBottom: "1px solid #1f2937",
          textAlign: sidebarCollapsed ? "center" : "left"
        }}>
          {sidebarCollapsed ? (
            <span style={{ fontSize: "24px" }}>👤</span>
          ) : (
            <h2 style={{ fontSize: "20px", fontWeight: "600", margin: 0 }}>
              Employee Portal
            </h2>
          )}
        </div>

        <div style={{
          flex: 1,
          padding: sidebarCollapsed ? "20px 0" : "20px",
          display: "flex",
          flexDirection: "column",
          gap: "5px"
        }}>
          <div style={{
            padding: sidebarCollapsed ? "12px 0" : "12px 16px",
            backgroundColor: "#374151",
            borderRadius: "6px",
            textAlign: sidebarCollapsed ? "center" : "left",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: sidebarCollapsed ? "center" : "flex-start",
            gap: "12px"
          }}>
            <span style={{ fontSize: "20px" }}>📊</span>
            {!sidebarCollapsed && <span>Dashboard</span>}
          </div>
          
          <div style={{
            padding: sidebarCollapsed ? "12px 0" : "12px 16px",
            borderRadius: "6px",
            textAlign: sidebarCollapsed ? "center" : "left",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: sidebarCollapsed ? "center" : "flex-start",
            gap: "12px",
            color: "#9ca3af"
          }} onClick={() => navigate('/employee/apply-leave')}>
            <span style={{ fontSize: "20px" }}>✈️</span>
            {!sidebarCollapsed && <span>Apply Leave</span>}
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
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
          }}
        >
          <span style={{ fontSize: "20px" }}>🚪</span>
          {!sidebarCollapsed && <span>Logout</span>}
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
          marginBottom: "32px"
        }}>
          <div>
            <h1 style={{
              fontSize: "28px",
              fontWeight: "600",
              margin: "0 0 8px 0",
              color: "#111827"
            }}>
              Welcome, {user?.displayName?.split(' ')[0] || 'Employee'} 👋
            </h1>
            <p style={{
              fontSize: "16px",
              color: "#6b7280",
              margin: 0
            }}>
              Your Leave Summary
            </p>
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            backgroundColor: "white",
            padding: "8px 16px",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <span style={{ fontSize: "14px", color: "#4b5563" }}>
              {user?.email}
            </span>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "#3b82f6",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "600"
            }}>
              {user?.displayName?.charAt(0) || 'U'}
            </div>
          </div>
        </div>

        {/* Leave Balance Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginBottom: "32px"
        }}>
          {activeLeaveTypes.map(({ key, limit }) => {
            const used = usedLeaves[key] || 0;
            const remaining = limit - used;
            const percentage = (used / limit) * 100;
            
            return (
              <div key={key} style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
              }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px"
                }}>
                  <span style={{
                    fontSize: "16px",
                    fontWeight: "600"
                  }}>
                    {getLeaveTypeLabel(key)}
                  </span>
                  <span style={{
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "500",
                    backgroundColor: remaining > 0 ? '#d1fae5' : '#fee2e2',
                    color: remaining > 0 ? '#065f46' : '#991b1b'
                  }}>
                    {remaining} left
                  </span>
                </div>
                <div style={{
                  height: "8px",
                  backgroundColor: "#f3f4f6",
                  borderRadius: "4px",
                  marginBottom: "10px",
                  overflow: "hidden"
                }}>
                  <div style={{
                    height: "100%",
                    width: `${Math.min(percentage, 100)}%`,
                    backgroundColor: percentage > 90 ? '#ef4444' : '#3b82f6',
                    borderRadius: "4px",
                    transition: "width 0.3s ease"
                  }} />
                </div>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13px",
                  color: "#6b7280"
                }}>
                  <span>Used: {used} days</span>
                  <span>Total: {limit} days</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Leave Requests Section */}
        <div style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          marginBottom: "32px"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px"
          }}>
            <h2 style={{
              fontSize: "18px",
              fontWeight: "600",
              margin: 0
            }}>
              Your Leave Requests
            </h2>
            <button
              onClick={() => navigate('/employee/apply-leave')}
              style={{
                padding: "8px 16px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              + Apply Leave
            </button>
          </div>
          
          {leaveRequests.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "48px",
              color: "#9ca3af",
              backgroundColor: "#f9fafb",
              borderRadius: "8px"
            }}>
              <p style={{ marginBottom: "16px" }}>No leave requests yet</p>
              <button
                onClick={() => navigate('/employee/apply-leave')}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                Apply for Leave
              </button>
            </div>
          ) : (
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}>
              {leaveRequests.map(leave => (
                <div key={leave.id} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb"
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px"
                    }}>
                      <span style={{
                        fontSize: "14px",
                        fontWeight: "600"
                      }}>
                        {leave.type}
                      </span>
                      <span style={{
                        fontSize: "12px",
                        color: "#6b7280"
                      }}>
                        {leave.days} days
                      </span>
                    </div>
                    <div style={{
                      fontSize: "13px",
                      color: "#4b5563",
                      marginBottom: "4px"
                    }}>
                      {leave.fromDate} → {leave.toDate}
                    </div>
                    <div style={{
                      fontSize: "13px",
                      color: "#6b7280",
                      marginBottom: "4px"
                    }}>
                      Reason: {leave.reason}
                    </div>
                    <div style={{
                      fontSize: "11px",
                      color: "#9ca3af"
                    }}>
                      Applied: {formatDate(leave.appliedOn)}
                    </div>
                  </div>
                  <span style={{
                    padding: "4px 12px",
                    borderRadius: "16px",
                    fontSize: "12px",
                    fontWeight: "500",
                    marginLeft: "16px",
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
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "20px"
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "16px",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "24px", marginBottom: "5px" }}>📊</div>
            <div style={{ fontSize: "20px", fontWeight: "600" }}>
              {leaveRequests.length}
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>Total Requests</div>
          </div>
          <div style={{
            backgroundColor: "white",
            padding: "16px",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "24px", marginBottom: "5px" }}>✅</div>
            <div style={{ fontSize: "20px", fontWeight: "600" }}>
              {leaveRequests.filter(l => l.status === 'approved').length}
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>Approved</div>
          </div>
          <div style={{
            backgroundColor: "white",
            padding: "16px",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "24px", marginBottom: "5px" }}>⏳</div>
            <div style={{ fontSize: "20px", fontWeight: "600" }}>
              {leaveRequests.filter(l => l.status === 'pending').length}
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>Pending</div>
          </div>
          <div style={{
            backgroundColor: "white",
            padding: "16px",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "24px", marginBottom: "5px" }}>📅</div>
            <div style={{ fontSize: "20px", fontWeight: "600" }}>
              {Object.values(usedLeaves).reduce((a, b) => a + b, 0)}
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>Total Used</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeDashboard;