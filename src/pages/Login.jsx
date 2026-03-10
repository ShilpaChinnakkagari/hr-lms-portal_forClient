import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../firebase/config';
import { checkUserExists, checkUserIsHR } from '../utils/hrAuth';

function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // CHECK: Does this user exist in your employees list?
      const userExists = await checkUserExists(user.email);
      
      if (!userExists) {
        // User not in database - sign them out and show error
        await auth.signOut();
        setError('Access Denied: You are not an employee. Please contact HR.');
        setLoading(false);
        return;
      }
      
      // User exists - let them in (App.js will handle HR/Employee routing)
      // No need to redirect here, App.js will handle based on role
      
    } catch (error) {
      setError('Login failed: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <h1 style={styles.title}>HR LMS Portal</h1>
        <p style={styles.subtitle}>Sign in with Google</p>
        
        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}
        
        <button onClick={handleGoogleLogin} disabled={loading} style={styles.googleButton}>
          <img src="https://www.google.com/favicon.ico" alt="Google" style={styles.googleIcon} />
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    fontFamily: "sans-serif"
  },
  loginBox: {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "16px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    textAlign: "center",
    width: "400px",
    maxWidth: "90%"
  },
  title: {
    fontSize: "28px",
    fontWeight: "600",
    margin: "0 0 10px 0",
    color: "#111827"
  },
  subtitle: {
    fontSize: "16px",
    color: "#6b7280",
    margin: "0 0 30px 0"
  },
  errorBox: {
    backgroundColor: "#fee2e2",
    border: "1px solid #ef4444",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "20px"
  },
  errorText: {
    color: "#b91c1c",
    fontSize: "14px",
    margin: 0
  },
  googleButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    padding: "14px",
    backgroundColor: "white",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer",
    gap: "12px"
  },
  googleIcon: {
    width: "20px",
    height: "20px"
  }
};

export default Login;