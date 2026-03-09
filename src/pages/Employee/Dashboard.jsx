import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/config';
import { signOut } from 'firebase/auth';

function EmployeeDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Welcome, {user?.displayName || 'Employee'} 👋</h1>
        <button onClick={handleLogout} style={styles.logout}>Logout</button>
      </div>
      <div style={styles.content}>
        <p>Employee Dashboard</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    fontFamily: "sans-serif"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
  },
  logout: {
    padding: "10px 20px",
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  },
  content: {
    padding: "20px",
    backgroundColor: "white",
    borderRadius: "8px"
  }
};

export default EmployeeDashboard;