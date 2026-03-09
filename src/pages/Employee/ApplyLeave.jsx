import React from 'react';
import { useNavigate } from 'react-router-dom';

function ApplyLeave() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Apply for Leave</h1>
        <button onClick={() => navigate('/employee/dashboard')} style={styles.back}>← Back</button>
      </div>
      <div style={styles.content}>
        <p>Leave application form will appear here</p>
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
  back: {
    padding: "10px 20px",
    backgroundColor: "#6b7280",
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

export default ApplyLeave;