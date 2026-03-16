import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="main-content" style={{ maxWidth: '600px', margin: '0 auto', border: 'none' }}>
      <div style={styles.container}>
        <h1 style={styles.title}>Sign in to Touiteur</h1>
        
        {error && <div style={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email or Username"
            className="input"
            style={styles.input}
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="input"
            style={styles.input}
            required
          />
          <button type="submit" className="btn btn-primary" style={styles.button}>
            Sign in
          </button>
        </form>
        
        <div style={styles.separator}>
          <span style={styles.line}></span>
          <span style={styles.or}>or</span>
          <span style={styles.line}></span>
        </div>

        <button 
          onClick={handleGoogleLogin} 
          className="btn btn-outline" 
          style={{...styles.button, ...styles.googleBtn}}
        >
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google" 
            style={styles.googleIcon} 
          />
          Sign in with Google
        </button>
        
        <p style={styles.footer}>
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '32px',
    maxWidth: '400px',
    margin: '0 auto'
  },
  title: {
    fontSize: '32px',
    fontWeight: '800',
    marginBottom: '32px',
    textAlign: 'center'
  },
  error: {
    background: 'rgba(244, 33, 46, 0.1)',
    color: 'var(--error)',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  input: {
    padding: '16px'
  },
  button: {
    marginTop: '8px',
    padding: '16px'
  },
  separator: {
    display: 'flex',
    alignItems: 'center',
    margin: '24px 0',
    color: 'var(--text-secondary)'
  },
  line: {
    flex: 1,
    height: '1px',
    backgroundColor: 'var(--border)'
  },
  or: {
    padding: '0 16px',
    fontSize: '15px'
  },
  googleBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    width: '100%',
    backgroundColor: 'white',
    color: 'black',
    border: '1px solid #ddd'
  },
  googleIcon: {
    width: '18px',
    height: '18px'
  },
  footer: {
    marginTop: '32px',
    textAlign: 'center',
    color: 'var(--text-secondary)'
  }
};

export default Login;
