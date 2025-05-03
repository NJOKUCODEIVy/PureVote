import { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import './Dashboard.css';

export default function Dashboard({ user, onSignOut }) {
  const [activeTab, setActiveTab] = useState('home');
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [currentNetwork, setCurrentNetwork] = useState('');
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const db = getFirestore();
  const supportedNetworks = {
    1: 'Ethereum Mainnet',
    8453: 'Base',
    84531: 'Base Goerli Testnet',
    84532: 'Base Sepolia Testnet',
    5: 'Goerli Testnet',
    11155111: 'Sepolia Testnet'
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
    const savedTheme = localStorage.getItem('purevote-theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
    }
  }, [user, db]);

  useEffect(() => {
  
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    
    localStorage.setItem('purevote-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const connectWallet = async () => {
    if (walletConnected) return;

    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
      }

      const accounts = await window.ethereum.request({ 
        method: "eth_requestAccounts" 
      });
      
      const chainIdHex = await window.ethereum.request({ 
        method: "eth_chainId" 
      });
      const chainId = parseInt(chainIdHex, 16);

      setWalletConnected(true);
      setWalletAddress(`${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
      setCurrentNetwork(supportedNetworks[chainId] || 'Unknown Network');

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

    } catch (error) {
      console.error('Wallet connection failed:', error);
      alert(`Connection failed: ${error.message}`);
    }
  };

  const disconnectWallet = () => {
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    }
    setWalletConnected(false);
    setWalletAddress('');
    setCurrentNetwork('');
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) disconnectWallet();
    else setWalletAddress(`${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
  };

  const handleChainChanged = (chainId) => {
    const decimalChainId = parseInt(chainId, 16);
    setCurrentNetwork(supportedNetworks[decimalChainId] || 'Unknown Network');
  };

  const switchNetwork = async (chainId) => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        alert("This network needs to be added to your MetaMask first.");
      } else {
        console.error('Network switch failed:', switchError);
        alert(`Failed to switch network: ${switchError.message}`);
      }
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  const getNetworkButtons = () => {
    return Object.entries(supportedNetworks).map(([chainId, name]) => (
      <button
        key={chainId}
        className={`network-button ${currentNetwork === name ? 'active' : ''}`}
        onClick={() => switchNetwork(parseInt(chainId))}
      >
        <span className="network-indicator"></span>
        {name}
      </button>
    ));
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loader">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" className="loader-track" />
            <circle cx="50" cy="50" r="45" className="loader-circle" />
          </svg>
        </div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className={`dashboard ${darkMode ? 'dark' : 'light'}`}>
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            {!isSidebarCollapsed && <h1 className="logo">PureVote</h1>}
            {isSidebarCollapsed && <h1 className="logo-icon">PV</h1>}
          </div>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {isSidebarCollapsed ? (
              <svg viewBox="0 0 24 24" className="icon">
                <path d="M8 3v18l8-9z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="icon">
                <path d="M16 3v18l-8-9z" />
              </svg>
            )}
          </button>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <svg viewBox="0 0 24 24" className="nav-icon">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            {!isSidebarCollapsed && <span>Home</span>}
          </button>
          
          <button
            className={`nav-item ${activeTab === 'votes' ? 'active' : ''}`}
            onClick={() => setActiveTab('votes')}
          >
            <svg viewBox="0 0 24 24" className="nav-icon">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {!isSidebarCollapsed && <span>My Votes</span>}
          </button>
          
          <button
            className={`nav-item ${activeTab === 'elections' ? 'active' : ''}`}
            onClick={() => setActiveTab('elections')}
          >
            <svg viewBox="0 0 24 24" className="nav-icon">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {!isSidebarCollapsed && <span>Elections</span>}
          </button>
          
          
        </nav>

        <div className="sidebar-footer">
          {!isSidebarCollapsed && (
            <div className="wallet-section">
              {walletConnected ? (
                <div className="connected-wallet">
                  <div className="wallet-info">
                    <div className="wallet-address">
                      <svg viewBox="0 0 24 24" className="wallet-icon">
                        <path d="M19 7h-1V6a3 3 0 00-3-3H5a3 3 0 00-3 3v12a3 3 0 003 3h14a3 3 0 003-3v-8a3 3 0 00-3-3z" />
                        <circle cx="16" cy="12" r="1" />
                      </svg>
                      <span>{walletAddress}</span>
                    </div>
                    <div className="network-badge">
                      <span className="network-dot"></span>
                      <span>{currentNetwork}</span>
                    </div>
                  </div>
                  <button className="disconnect-btn" onClick={disconnectWallet}>
                    Disconnect
                  </button>
                </div>
              ) : (
                <button className="connect-wallet-btn" onClick={connectWallet}>
                  <svg viewBox="0 0 24 24" className="btn-icon">
                    <path d="M19 7h-1V6a3 3 0 00-3-3H5a3 3 0 00-3 3v12a3 3 0 003 3h14a3 3 0 003-3v-8a3 3 0 00-3-3z" />
                    <circle cx="16" cy="12" r="1" />
                  </svg>
                  Connect Wallet
                </button>
              )}
            </div>
          )}

          <div className="footer-buttons">
            <button 
              className="theme-toggle" 
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? (
                <svg viewBox="0 0 24 24" className="theme-icon">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="theme-icon">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              )}
              {!isSidebarCollapsed && (darkMode ? "Light Mode" : "Dark Mode")}
            </button>
            {!isSidebarCollapsed && (
              <button className="signout-btn" onClick={onSignOut}>
                <svg viewBox="0 0 24 24" className="signout-icon">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign Out
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="content-header">
          <div className="page-title">
            {activeTab === 'home' && <h1>Home Dashboard</h1>}
            {activeTab === 'votes' && <h1>My Voting History</h1>}
            {activeTab === 'elections' && <h1>Election Center</h1>}

          </div>

          <div className="header-actions">
            {walletConnected && isSidebarCollapsed && (
              <div className="mini-wallet-info">
                <span className="network-badge-mini">
                  <span className="network-dot"></span>
                  {currentNetwork}
                </span>
                <span className="wallet-address-mini">{walletAddress}</span>
              </div>
            )}

            <div className="user-profile" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
              <div className="user-avatar">
                {userData?.firstName?.charAt(0) || user?.displayName?.charAt(0) || 'U'}
              </div>
              <div className="user-details">
                <span className="user-name">{userData?.firstName || user?.displayName?.split(' ')[0] || 'User'}</span>
                <span className="user-email">{user?.email}</span>
              </div>
              <svg viewBox="0 0 24 24" className="dropdown-arrow">
                <polyline points="6 9 12 15 18 9" />
              </svg>

              {showProfileDropdown && (
                <div className="profile-dropdown">
                 
                  <button className="dropdown-item" onClick={() => setDarkMode(!darkMode)}>
                    {darkMode ? (
                      <>
                        <svg viewBox="0 0 24 24" className="dropdown-icon">
                          <circle cx="12" cy="12" r="5" />
                          <line x1="12" y1="1" x2="12" y2="3" />
                          <line x1="12" y1="21" x2="12" y2="23" />
                          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                          <line x1="1" y1="12" x2="3" y2="12" />
                          <line x1="21" y1="12" x2="23" y2="12" />
                          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                        </svg>
                        Light Mode
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" className="dropdown-icon">
                          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                        </svg>
                        Dark Mode
                      </>
                    )}
                  </button>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout" onClick={onSignOut}>
                    <svg viewBox="0 0 24 24" className="dropdown-icon">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="content-container">
          {activeTab === 'home' && (
            <HomeTab
              user={user}
              userData={userData}
              walletConnected={walletConnected}
              currentNetwork={currentNetwork}
            />
          )}

          {activeTab === 'votes' && <VotesTab userData={userData} />}

          {activeTab === 'elections' && (
            <ElectionsTab
              walletConnected={walletConnected}
              currentNetwork={currentNetwork}
              networkButtons={getNetworkButtons()}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileTab
              user={user}
              userData={userData}
              walletConnected={walletConnected}
              walletAddress={walletAddress}
              currentNetwork={currentNetwork}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function HomeTab({ user, userData, walletConnected, currentNetwork }) {
  return (
    <div className="tab-container">
      <div className="welcome-banner">
        <div className="welcome-content">
          <h2>Welcome Back, {userData?.firstName || user?.displayName?.split(' ')[0] || 'Voter'}!</h2>
          <p>Your voice matters. Keep track of your voting journey.</p>
        </div>
        <div className="welcome-graphic">
          <svg viewBox="0 0 200 200" className="voting-graphic">
            <rect x="40" y="60" width="120" height="100" rx="10" />
            <rect x="60" y="80" width="80" height="10" rx="5" />
            <rect x="60" y="100" width="80" height="10" rx="5" />
            <rect x="60" y="120" width="40" height="10" rx="5" />
            <circle cx="100" cy="150" r="10" />
            <path d="M90 40 L100 30 L110 40 L100 20 Z" />
          </svg>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card status-card">
          <div className="card-header">
            <svg viewBox="0 0 24 24" className="card-icon">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <h3>Account Status</h3>
          </div>
          <div className="card-content">
            <div className="status-badge verified">
              <svg viewBox="0 0 24 24" className="status-icon">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>{user?.emailVerified ? 'Verified' : 'Needs Verification'}</span>
            </div>
            <p>Your account is active and ready for voting.</p>
          </div>
        </div>

        <div className="dashboard-card wallet-status-card">
          <div className="card-header">
            <svg viewBox="0 0 24 24" className="card-icon">
              <path d="M19 7h-1V6a3 3 0 00-3-3H5a3 3 0 00-3 3v12a3 3 0 003 3h14a3 3 0 003-3v-8a3 3 0 00-3-3z" />
              <circle cx="16" cy="12" r="1" />
            </svg>
            <h3>Wallet Status</h3>
          </div>
          <div className="card-content">
            {walletConnected ? (
              <div className="wallet-status connected">
                <div className="connection-info">
                  <div className="network-badge large">
                    <span className="network-dot"></span>
                    <span>{currentNetwork}</span>
                  </div>
                </div>
                <p>Your wallet is connected and ready for blockchain-based voting.</p>
              </div>
            ) : (
              <div className="wallet-status disconnected">
                <div className="connection-info">
                  <span className="status-badge disconnected">Not Connected</span>
                </div>
                <p>Connect your wallet to participate in blockchain-based voting.</p>
               
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-card upcoming-card">
          <div className="card-header">
            <svg viewBox="0 0 24 24" className="card-icon">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <h3>Upcoming Elections</h3>
          </div>
          <div className="card-content">
            <div className="election-item">
              <div className="election-details">
                <h4> Enugu State Election</h4>
                <div className="election-meta">
                  <div className="election-date">
                    <svg viewBox="0 0 24 24" className="meta-icon">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>May 15, 2025</span>
                  </div>
                  <div className="election-type">
                    <svg viewBox="0 0 24 24" className="meta-icon">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                    <span>Local Election</span>
                  </div>
                </div>
                <div className="progress-container">
                  <div className="progress-label">
                    <span>Registration Open</span>
                    <span>32 days left</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress" style={{width: '60%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-card activity-card">
          <div className="card-header">
            <svg viewBox="0 0 24 24" className="card-icon">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <h3>Recent Activity</h3>
          </div>
          <div className="card-content">
            <div className="activity-timeline">
              <div className="activity-item">
                <div className="activity-icon">
                  <svg viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div className="activity-content">
                  <div className="activity-header">
                    <h4>Account Created</h4>
                    <span className="activity-time">2 days ago</span>
                  </div>
                  <p>Welcome to PureVote! Your account is now active.</p>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M19 7h-1V6a3 3 0 00-3-3H5a3 3 0 00-3 3v12a3 3 0 003 3h14a3 3 0 003-3v-8a3 3 0 00-3-3z" />
                    <circle cx="16" cy="12" r="1" />
                  </svg>
                </div>
                <div className="activity-content">
                  <div className="activity-header">
                    <h4>Wallet Connected</h4>
                    <span className="activity-time">1 day ago</span>
                  </div>
                  <p>Your wallet was connected to Base Sepolia Testnet.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VotesTab() {
  return (
    <div className="tab-container">
      <div className="section-header">
        <h2>My Voting History</h2>
        <div className="section-actions">
          <div className="search-bar">
            <svg viewBox="0 0 24 24" className="search-icon">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" placeholder="Search votes..." />
          </div>
          <select className="filter-select">
            <option value="all">All Elections</option>
            <option value="local">Local</option>
            <option value="national">National</option>
          </select>
        </div>
      </div>

      <div className="votes-container">
        <div className="empty-state">
          <div className="empty-graphic">
            <svg viewBox="0 0 24 24" className="empty-icon">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 15h8M9 9h.01M15 9h.01" />
            </svg>
          </div>
          <h3>No Voting History Yet</h3>
          <p>Your completed votes will appear here. Participate in an upcoming election to get started.</p>
          <button className="primary-btn">View Upcoming Elections</button>
        </div>
      </div>
    </div>
  );
}

function ElectionsTab({ walletConnected, currentNetwork, user, networkButtons }) {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    role: '',
    email: '',
    verificationCode: new Array(6).fill('')
  });

  const organizations = {
    academic: [
      {
        id: 'babcock',
        name: 'Babcock University',
        type: 'Academic',
        elections: 3,
        members: 5708,
        description: "Join Babcock University's electoral community."
      },
      {
        id: 'UNILAG',
        name: 'University of Lagos ',
        type: 'Academic',
        elections: 15,
        members: 9000,
        description: "Participate in UNILAG student government elections."
      },
      {
        id: 'Landmark',
        name: 'Landmark University',
        type: 'Academic',
        elections: 10,
        members: 578,
        description: "Join Landmark University's electoral community."
      },
      {
        id: 'RSU',
        name: 'Rivers State University ',
        type: 'Academic',
        elections: 10,
        members: 7008,
        description: "Join Rivers State University's SUG community."
      },
      {
        id: 'LeadCity',
        name: 'Lead City University',
        type: 'Academic',
        elections: 2,
        members: 400,
        description: "Join Lead City University's electoral community."
      },
      {
        id: 'ESUT',
        name: 'Enugu State University of Science and Technology  ',
        type: 'Academic',
        elections: 15,
        members: 9278,
        description: "Join ESUT's electoral community."
      },
      {
        id: 'uniben',
        name: 'University of Benin',
        type: 'Academic',
        elections: 8,
        members: 12000,
        description: "Join UNIBEN's vibrant student electoral community."
      },
      {
        id: 'unilorin',
        name: 'University of Ilorin',
        type: 'Academic',
        elections: 10,
        members: 15000,
        description: "Participate in UNILORIN's student government elections."
      },
      {
        id: 'oau',
        name: 'Obafemi Awolowo University',
        type: 'Academic',
        elections: 12,
        members: 18000,
        description: "Be part of OAU's active electoral community."
      },
      {
        id: 'ui',
        name: 'University of Ibadan',
        type: 'Academic',
        elections: 15,
        members: 20000,
        description: "Join UI's prestigious student electoral system."
      },
      {
        id: 'abu',
        name: 'Ahmadu Bello University',
        type: 'Academic',
        elections: 9,
        members: 17000,
        description: "Participate in ABU's dynamic student elections."
      },
      {
        id: 'lasu',
        name: 'Lagos State University',
        type: 'Academic',
        elections: 7,
        members: 14000,
        description: "Join LASU's student government electoral process."
      },
      {
        id: 'futa',
        name: 'Federal University of Technology Akure',
        type: 'Academic',
        elections: 6,
        members: 10000,
        description: "Be part of FUTA's innovative student elections."
      },
      {
        id: 'unizik',
        name: 'Nnamdi Azikiwe University',
        type: 'Academic',
        elections: 11,
        members: 16000,
        description: "Join UNIZIK's active student electoral community."
      },
      {
        id: 'buk',
        name: 'Bayero University Kano',
        type: 'Academic',
        elections: 5,
        members: 9000,
        description: "Participate in BUK's student government elections."
      },
      {
        id: 'unn',
        name: 'University of Nigeria Nsukka',
        type: 'Academic',
        elections: 13,
        members: 19000,
        description: "Join UNN's vibrant student electoral system."
      },
      {
        id: 'futminna',
        name: 'Federal University of Technology Minna',
        type: 'Academic',
        elections: 4,
        members: 8000,
        description: "Be part of FUTMINNA's innovative student elections."
      },
      {
        id: 'covenant',
        name: 'Covenant University',
        type: 'Academic',
        elections: 3,
        members: 6000,
        description: "Join Covenant University's student electoral community."
      },
      {
        id: 'unical',
        name: 'University of Calabar',
        type: 'Academic',
        elections: 8,
        members: 11000,
        description: "Participate in UNICAL's student government elections."
      },
      {
        id: 'funaab',
        name: 'Federal University of Agriculture Abeokuta',
        type: 'Academic',
        elections: 6,
        members: 9500,
        description: "Be part of FUNAAB's agricultural student elections."
      },
      {
        id: 'eksu',
        name: 'Ekiti State University',
        type: 'Academic',
        elections: 5,
        members: 7000,
        description: "Join EKSU's student government electoral process."
      }
    ],
    corporate: [
      {
        id: 'paystack123',
        name: 'Paystack',
        type: 'Corporate',
        elections: 3,
        members: 1200,
        description: "Vote for the most innovative team at Paystack."
      },
      {
        id: 'andela456',
        name: 'Andela',
        type: 'Corporate',
        elections: 5,
        members: 800,
        description: "Recognize outstanding developers at Andela."
      },
      {
        id: 'konga789',
        name: 'Konga',
        type: 'Corporate',
        elections: 2,
        members: 1500,
        description: "Celebrate excellence in e-commerce at Konga."
      },
      {
        id: 'flutterwave001',
        name: 'Flutterwave',
        type: 'Corporate',
        elections: 4,
        members: 2000,
        description: "Empowering innovation through Flutterwave's community."
      },
      {
        id: 'interswitch002',
        name: 'Interswitch',
        type: 'Corporate',
        elections: 3,
        members: 1800,
        description: "Recognize top-performing teams at Interswitch."
      },
      {
        id: 'jumia003',
        name: 'Jumia',
        type: 'Corporate',
        elections: 6,
        members: 2500,
        description: "Celebrate e-commerce excellence at Jumia."
      },
      {
        id: 'opay004',
        name: 'OPay',
        type: 'Corporate',
        elections: 2,
        members: 1000,
        description: "Vote for the best innovations at OPay."
      },
      {
        id: 'cowrywise005',
        name: 'Cowrywise',
        type: 'Corporate',
        elections: 3,
        members: 700,
        description: "Recognize financial innovation at Cowrywise."
      },
      {
        id: 'piggyvest006',
        name: 'PiggyVest',
        type: 'Corporate',
        elections: 4,
        members: 1200,
        description: "Celebrate savings and investment excellence at PiggyVest."
      },
      {
        id: 'hotelsng007',
        name: 'Hotels.ng',
        type: 'Corporate',
        elections: 2,
        members: 900,
        description: "Vote for the best travel innovations at Hotels.ng."
      },
      {
        id: 'kudi008',
        name: 'Kudi',
        type: 'Corporate',
        elections: 3,
        members: 1100,
        description: "Empowering financial inclusion through Kudi's community."
      },
      {
        id: 'maxng009',
        name: 'MAX.ng',
        type: 'Corporate',
        elections: 2,
        members: 800,
        description: "Recognize top-performing teams at MAX.ng."
      },
      {
        id: 'gokada010',
        name: 'Gokada',
        type: 'Corporate',
        elections: 3,
        members: 950,
        description: "Celebrate innovation in transportation at Gokada."
      },
      {
        id: 'paga011',
        name: 'Paga',
        type: 'Corporate',
        elections: 4,
        members: 1500,
        description: "Vote for the best financial solutions at Paga."
      },
      {
        id: 'teamapt012',
        name: 'TeamApt',
        type: 'Corporate',
        elections: 3,
        members: 1300,
        description: "Recognize excellence in fintech at TeamApt."
      },
      {
        id: 'mono013',
        name: 'Mono',
        type: 'Corporate',
        elections: 2,
        members: 600,
        description: "Celebrate data-driven innovation at Mono."
      },
      {
        id: 'paylater014',
        name: 'Paylater',
        type: 'Corporate',
        elections: 3,
        members: 850,
        description: "Vote for the best lending solutions at Paylater."
      },
      {
        id: 'carbon015',
        name: 'Carbon',
        type: 'Corporate',
        elections: 4,
        members: 1400,
        description: "Recognize top-performing teams at Carbon."
      },
      {
        id: 'thriveagric016',
        name: 'Thrive Agric',
        type: 'Corporate',
        elections: 2,
        members: 700,
        description: "Celebrate agricultural innovation at Thrive Agric."
      }
    ]
  };

  const handleJoinOrg = (orgId) => {
    setSelectedOrg(orgId);
    setShowJoinModal(true);
  };

  const handleVerification = () => {
    setShowJoinModal(false);
    setShowVerificationModal(true);
  };

  const handleCodeChange = (index, value) => {
    const newCode = [...formData.verificationCode];
    newCode[index] = value;
    setFormData({ ...formData, verificationCode: newCode });
  };

  return (
    <div className="election-center">
      <div className="two-column-layout">
        <div className="column network-column">
          <div className="panel network-panel">
            <div className="panel-header">
              <svg viewBox="0 0 24 24" className="panel-icon">
                <path d="M18 10h-4v-4h4v4zm-6 0H8v-4h4v4zm-6 6h4v-4H6v4zm6 0h4v-4h-4v4zm6 0h4v-4h-4v4zm6-10v14H2V6h22z" />
              </svg>
              <h3>Networks</h3>
            </div>
            <div className="panel-content">
              {walletConnected ? (
                <div className="network-grid">{networkButtons}</div>
              ) : (
                <div className="network-placeholder">
                  <svg viewBox="0 0 24 24" className="placeholder-icon">
                    <path d="M19 7h-1V6a3 3 0 00-3-3H5a3 3 0 00-3 3v12a3 3 0 003 3h14a3 3 0 003-3v-8a3 3 0 00-3-3z" />
                    <circle cx="16" cy="12" r="1" />
                  </svg>
                  <p>Connect your wallet to access networks</p>

                </div>
              )}
            </div>
          </div>
        </div>

        <div className="column elections-column">
          <div className="election-content">
           
            <div className="org-sections">
              <section className="org-category">
                <h2 className="section-title">
                  <span className="section-title-icon">🏫</span>
                  Educational Institutions
                </h2>
                <div className="org-directory">
                  {organizations.academic.map(org => (
                    <OrgCard key={org.id} org={org} onJoin={() => handleJoinOrg(org.id)} />
                  ))}
                </div>
              </section>

              <section className="org-category">
                <h2 className="section-title">
                  <span className="section-title-icon">🏢</span>
                  Corporate Organizations
                </h2>
                <div className="org-directory">
                  {organizations.corporate.map(org => (
                    <OrgCard key={org.id} org={org} onJoin={() => handleJoinOrg(org.id)} />
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      {showJoinModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Join {organizations.academic.find(o => o.id === selectedOrg)?.name}</h3>
              <button className="close-btn" onClick={() => setShowJoinModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-select"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="" disabled>Select your role</option>
                  <option value="student">Student</option>
                  <option value="employee">Employee</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <div className="verify-field">
                  <input
                    type="email"
                    className="form-input verify-input"
                    placeholder="your.email@organization.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                  <button className="verify-btn" onClick={handleVerification}>Verify</button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowJoinModal(false)}>Cancel</button>
              <button className="submit-btn" disabled={!formData.fullName || !formData.role || !formData.email}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {showVerificationModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Email Verification</h3>
              <button className="close-btn" onClick={() => setShowVerificationModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Verification code sent to <strong>{formData.email}</strong></p>
              <div className="verification-code">
                {formData.verificationCode.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    className="code-input"
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                  />
                ))}
              </div>
              <p className="info-text">Didn't receive code? <a href="#">Resend</a></p>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowVerificationModal(false)}>Cancel</button>
              <button className="submit-btn" onClick={() => {
                setShowVerificationModal(false);
                setShowSuccessModal(true);
              }}>Verify</button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="success-message">
              <div className="success-icon">✓</div>
              <h3 className="success-title">Successfully Joined!</h3>
              <p className="success-text">You now have access to all active elections.</p>
              <button className="continue-btn" onClick={() => window.location.reload()}>
                View Organization Elections
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrgCard({ org, onJoin }) {
  return (
    <div className="org-card">
      <div className="org-header">
        <div className="org-logo">{org.type === 'Academic' ? '🏫' : '🏢'}</div>
        <div className="org-details">
          <h3 className="org-name">{org.name}</h3>
          <span className="org-type">{org.type}</span>
        </div>
      </div>
      <div className="org-body">
        <p className="org-description">{org.description}</p>
        <div className="org-stats">
          <div className="stat">
            <div className="stat-value">{org.elections}</div>
            <div className="stat-label">Active Elections</div>
          </div>
          <div className="stat">
            <div className="stat-value">{org.members}</div>
            <div className="stat-label">Members</div>
          </div>
        </div>
        <button className="join-btn" onClick={onJoin}>Join Organization</button>
      </div>
    </div>
  );
}

