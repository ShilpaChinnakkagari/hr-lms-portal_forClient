import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/config';
import { signOut } from 'firebase/auth';

function HRDashboard() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h2 style={styles.logo}>HR Portal</h2>
        <div style={styles.menu}>
          <div style={styles.menuItemActive}>Dashboard</div>
          <div style={styles.menuItem} onClick={() => handleNavigation('/hr/employees')}>
            Employees
          </div>
          <div style={styles.menuItem} onClick={() => handleNavigation('/hr/leave-management')}>
            Leave Management
          </div>
          <div style={styles.menuItem} onClick={() => handleNavigation('/hr/salary-upload')}>
            Salary Upload
          </div>
          <div style={styles.menuItem} onClick={() => handleNavigation('/hr/salary-reports')}>
  Salary Reports
</div>
        </div>
        <button onClick={handleLogout} style={styles.logout}>Logout</button>
      </div>
      <div style={styles.content}>
        <h1>HR Dashboard</h1>
        <p>Welcome to HR Portal</p>
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
    backgroundColor: "#f3f4f6"
  }
};

export default HRDashboard;