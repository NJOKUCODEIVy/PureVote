import { useState, useEffect } from 'react';
import { useSpring, animated } from 'react-spring';
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import './App.css';
import Dashboard from './Dashboard';

const firebaseConfig = {
  apiKey: "AIzaSyBahV0ZqL6_ngugvteAwOgs8S64GPmIaeA",
  authDomain: "purevote-cca49.firebaseapp.com",
  projectId: "purevote-cca49",
  storageBucket: "purevote-cca49.firebasestorage.app",
  messagingSenderId: "723825763130",
  appId: "1:723825763130:web:039687475da9421a276603",
  measurementId: "G-D9SJC1STWK"
};

let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase initialization error:", error);
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userMetadata, setUserMetadata] = useState(null);
  const [firebaseInitialized, setFirebaseInitialized] = useState(!!auth);

  const loadingSpring = useSpring({
    from: { opacity: 1 },
    to: { opacity: isLoading ? 1 : 0 },
    config: { tension: 280, friction: 60 },
  });
  
  const contentSpring = useSpring({
    opacity: isLoading ? 0 : 1,
    transform: isLoading ? 'translateY(24px)' : 'translateY(0px)',
    config: { mass: 1, tension: 280, friction: 26 },
  });
  
  const stripeSpring = useSpring({
    from: { backgroundPosition: '0% 0%' },
    to: { backgroundPosition: isLoading ? '0% 0%' : '100% 100%' },
    config: { duration: 1 },
  });
  
  const pageTransition = useSpring({
    opacity: 1,
    transform: 'translateX(0%)',
    from: { opacity: 0, transform: 'translateX(5%)' },
    reset: true,
    key: currentPage,
    config: { tension: 280, friction: 26 },
  });
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    if (!firebaseInitialized) {
      console.warn("Firebase not initialized, auth functionality will be limited");
      return () => clearTimeout(timer);
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        console.log("User is signed in:", user);
      } else {
        setCurrentUser(null);
        setUserMetadata(null);
        console.log("No user signed in");
      }
    });
    
    return () => {
      clearTimeout(timer);
      if (unsubscribe) unsubscribe();
    };
  }, [firebaseInitialized]);
  
  const switchPage = (page) => {
    setIsLoading(true);
    setTimeout(() => {
      setCurrentPage(page);
      setIsLoading(false);
    }, 300);
  };
  
  const handleSignOut = async () => {
    if (!firebaseInitialized) return;
    
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    if (currentUser && (currentPage === 'login' || currentPage === 'signup')) {
      setIsLoading(false);
    }
  }, [currentUser, currentPage]);
  
  return (
    <div className="container">
      {!currentUser && (
        <animated.div 
          className="stripe-pattern"
          style={stripeSpring}
        />
      )}
      
      <div className={currentUser ? "dashboard-container" : "form-container"}>
        {!currentUser ? (
          <div className="form-wrapper">
            <animated.div 
              className="loading-overlay"
              style={loadingSpring}
            >
              <div className="loading-content">
                <div className="logo"><i>PureVote</i></div>
                <div className="loading-bar">
                  <div className="loading-progress" />
                </div>
              </div>
            </animated.div>
            
            <animated.div style={contentSpring}>
              <animated.div style={pageTransition}>
                {currentPage === 'login' ? (
                  <LoginForm 
                    onSignUpClick={() => switchPage('signup')}
                    onForgotPasswordClick={() => switchPage('reset')}
                    firebaseInitialized={firebaseInitialized}
                  />
                ) : currentPage === 'signup' ? (
                  <SignUpForm 
                    onSignInClick={() => switchPage('login')} 
                    firebaseInitialized={firebaseInitialized}
                  />
                ) : (
                  <ResetPasswordForm 
                    onBackToLoginClick={() => switchPage('login')}
                    firebaseInitialized={firebaseInitialized}
                  />
                )}
              </animated.div>
            </animated.div>
          </div>
        ) : (
          <Dashboard 
            user={currentUser} 
            userMetadata={userMetadata}
            onSignOut={handleSignOut} 
          />
        )}
      </div>
    </div>
  );
}

function LoginForm({ onSignUpClick, onForgotPasswordClick, firebaseInitialized }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    if (!firebaseInitialized) {
      setMessage(`Demo mode: Would sign in with ${email}`);
      setIsLoading(false);
      return;
    }
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      setMessage(`Welcome back, ${user.email}!`);
      
    } catch (error) {
      switch (error.code) {
        case 'auth/invalid-email':
          setError('Invalid email address format');
          break;
        case 'auth/user-disabled':
          setError('This account has been disabled');
          break;
        case 'auth/user-not-found':
          setError('No account with this email exists');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password');
          break;
        default:
          setError('Failed to sign in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-content">
      <div className="header">
        <div className="header-logo">PureVote</div>
      </div>
      
      <h2 className="title">Welcome back!</h2>
      
      <form className="form" onSubmit={handleSignIn}>
        <div>
          <input 
            type="email" 
            placeholder="name@email.com" 
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        
        <div>
          <input 
            type="password" 
            placeholder="Password" 
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        
        <div className="checkbox-container">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              className="checkbox" 
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>Remember me</span>
          </label>
          <button 
            type="button" 
            className="link" 
            onClick={onForgotPasswordClick}
          >
            Forgot password?
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}
        
        <button 
          type="submit" 
          className={`button ${isLoading ? 'button-loading' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
        
        <div className="text-center">
          <span>Don't have an account? </span>
          <button 
            type="button"
            onClick={onSignUpClick} 
            className="link-button"
          >
            Sign up
          </button>
        </div>
      </form>
    </div>
  );
}

function SignUpForm({ onSignInClick, firebaseInitialized }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  
  useEffect(() => {
    if (!password) {
      setPasswordStrength('');
      return;
    }
    
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    if (strength === 0) setPasswordStrength('');
    else if (strength <= 2) setPasswordStrength('weak');
    else if (strength <= 3) setPasswordStrength('medium');
    else if (strength === 4) setPasswordStrength('good');
    else setPasswordStrength('strong');
  }, [password]);

  const validateForm = () => {
    if (!firstName || !lastName) {
      setError('Please enter your first and last name');
      return false;
    }
    
    if (!email) {
      setError('Please enter your email address');
      return false;
    }
    
    if (!password) {
      setError('Please enter a password');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (password.length < 8) {
      setError('Password should be at least 8 characters long');
      return false;
    }
    
    if (!agreeTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      return false;
    }
    
    return true;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError('');
    
    if (!firebaseInitialized) {
      setMessage(`Demo mode: Would create account for ${email}`);
      setIsLoading(false);
      return;
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`
      });
      
      await setDoc(doc(db, "users", user.uid), {
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        email,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        provider: 'email'
      });
      
      setMessage("Account created successfully!");
      
    } catch (error) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('An account with this email already exists');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address format');
          break;
        case 'auth/weak-password':
          setError('Password is too weak');
          break;
        default:
          setError('Failed to create account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-content">
      <div className="header">
        <div className="header-logo">PureVote</div>
      </div>
      
      <h2 className="title">Create your account</h2>
      
      <form className="form" onSubmit={handleSignUp}>
        <div className="input-row">
          <div className="input-half">
            <input 
              type="text" 
              placeholder="First name" 
              className="input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="input-half">
            <input 
              type="text" 
              placeholder="Last name" 
              className="input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>
        
        <div>
          <input 
            type="email" 
            placeholder="Email address" 
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        
        <div>
          <input 
            type="password" 
            placeholder="Create password" 
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          
          {passwordStrength && (
            <div className="password-strength">
              <div className={`password-strength-bar ${passwordStrength}`}></div>
              <div className="password-strength-text" style={{
                color: 
                  passwordStrength === 'weak' ? '#ef4444' : 
                  passwordStrength === 'medium' ? '#f59e0b' : 
                  passwordStrength === 'good' ? '#10b981' : 
                  '#047857'
              }}>
                {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)} password
              </div>
            </div>
          )}
        </div>
        
        <div>
          <input 
            type="password" 
            placeholder="Confirm password" 
            className="input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        
        <div className="terms-container">
          <input 
            type="checkbox" 
            id="terms" 
            className="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
          />
          <label htmlFor="terms" className="terms-text">
            I agree to the <a href="#" className="link">Terms of Service</a> and <a href="#" className="link">Privacy Policy</a>
          </label>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}
        
        <button 
          type="submit" 
          className={`button ${isLoading ? 'button-loading' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? 'Creating account...' : 'Sign up'}
        </button>
        
        <div className="text-center">
          <span>Already have an account? </span>
          <button 
            type="button"
            onClick={onSignInClick} 
            className="link-button"
          >
            Sign in
          </button>
        </div>
      </form>
    </div>
  );
}

function ResetPasswordForm({ onBackToLoginClick, firebaseInitialized }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    if (!firebaseInitialized) {
      setMessage(`Demo mode: Would send password reset to ${email}`);
      setIsLoading(false);
      return;
    }
    
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent. Check your inbox.');
    } catch (error) {
      switch (error.code) {
        case 'auth/invalid-email':
          setError('Invalid email address format');
          break;
        case 'auth/user-not-found':
          setError('No account found with this email');
          break;
        default:
          setError('Failed to send reset email. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-content">
      <div className="header">
        <div className="header-logo">PureVote</div>
      </div>
      
      <h2 className="title">Reset your password</h2>
      <p style={{ marginTop: '-16px', marginBottom: '24px', color: '#6b7280' }}>
        Enter your email address and we'll send you instructions to reset your password.
      </p>
      
      <form className="form" onSubmit={handleResetPassword}>
        <div>
          <input 
            type="email" 
            placeholder="Email address" 
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}
        
        <button 
          type="submit" 
          className={`button ${isLoading ? 'button-loading' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? 'Sending email...' : 'Send reset instructions'}
        </button>
        
        <div className="text-center">
          <button 
            type="button"
            onClick={onBackToLoginClick} 
            className="link-button"
          >
            Back to sign in
          </button>
        </div>
      </form>
    </div>
  );
}