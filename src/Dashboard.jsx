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

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('purevote-theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
    }
  }, [user, db]);

  useEffect(() => {
    // Apply dark mode to the body element
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    
    // Save theme preference
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
          
          <button
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <svg viewBox="0 0 24 24" className="nav-icon">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {!isSidebarCollapsed && <span>Profile</span>}
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
            {activeTab === 'profile' && <h1>User Profile</h1>}
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
                  <button className="dropdown-item" onClick={() => setActiveTab('profile')}>
                    <svg viewBox="0 0 24 24" className="dropdown-icon">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    View Profile
                  </button>
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

// Tab Components
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
                <button className="connect-wallet-btn secondary" onClick={() => {}}>Connect Wallet</button>
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
                <h4>City Council Election</h4>
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
              <button className="view-details-btn">
                <span>View Details</span>
                <svg viewBox="0 0 24 24" className="arrow-icon">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
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

function ElectionsTab({ walletConnected, networkButtons }) {
  return (
    <div className="tab-container">
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
                  <button className="connect-wallet-btn secondary">Connect Wallet</button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="column elections-column">
          <div className="panel elections-panel">
          <div className="panel-header">
              <svg viewBox="0 0 24 24" className="panel-icon">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <h3>Available Elections</h3>
            </div>
            <div className="panel-content">
              <div className="election-card">
                <div className="election-card-header">
                  <div className="election-badge national">National</div>
                  <div className="election-status">
                    <span className="status-dot upcoming"></span>
                    <span>Upcoming</span>
                  </div>
                </div>
                <h4>National Election 2025</h4>
                <div className="election-details">
                  <div className="election-detail">
                    <svg viewBox="0 0 24 24" className="detail-icon">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>Registration opens: January 1, 2025</span>
                  </div>
                  <div className="election-detail">
                    <svg viewBox="0 0 24 24" className="detail-icon">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>Election date: November 4, 2025</span>
                  </div>
                </div>
                <div className="timeline">
                  <div className="timeline-track">
                    <div className="timeline-point active">
                      <div className="point-marker"></div>
                      <div className="point-label">Announced</div>
                    </div>
                    <div className="timeline-point">
                      <div className="point-marker"></div>
                      <div className="point-label">Registration</div>
                    </div>
                    <div className="timeline-point">
                      <div className="point-marker"></div>
                      <div className="point-label">Voting</div>
                    </div>
                    <div className="timeline-point">
                      <div className="point-marker"></div>
                      <div className="point-label">Results</div>
                    </div>
                  </div>
                </div>
                <div className="election-actions">
                  <button className="register-btn">
                    Pre-Register
                    <svg viewBox="0 0 24 24" className="btn-icon">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                  <button className="info-btn">
                    <svg viewBox="0 0 24 24" className="info-icon">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12" y2="8" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="election-card">
                <div className="election-card-header">
                  <div className="election-badge local">Local</div>
                  <div className="election-status">
                    <span className="status-dot active"></span>
                    <span>Registration Open</span>
                  </div>
                </div>
                <h4>City Council Election</h4>
                <div className="election-details">
                  <div className="election-detail">
                    <svg viewBox="0 0 24 24" className="detail-icon">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>Registration closes: April 15, 2025</span>
                  </div>
                  <div className="election-detail">
                    <svg viewBox="0 0 24 24" className="detail-icon">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>Election date: May 15, 2025</span>
                  </div>
                </div>
                <div className="timeline">
                  <div className="timeline-track">
                    <div className="timeline-point completed">
                      <div className="point-marker"></div>
                      <div className="point-label">Announced</div>
                    </div>
                    <div className="timeline-point active">
                      <div className="point-marker"></div>
                      <div className="point-label">Registration</div>
                    </div>
                    <div className="timeline-point">
                      <div className="point-marker"></div>
                      <div className="point-label">Voting</div>
                    </div>
                    <div className="timeline-point">
                      <div className="point-marker"></div>
                      <div className="point-label">Results</div>
                    </div>
                  </div>
                </div>
                <div className="election-actions">
                  <button className="register-btn primary">
                    Register Now
                    <svg viewBox="0 0 24 24" className="btn-icon">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                  <button className="info-btn">
                    <svg viewBox="0 0 24 24" className="info-icon">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12" y2="8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ user, userData, walletConnected, walletAddress, currentNetwork }) {
  return (
    <div className="tab-container">
      <div className="profile-header">
        <div className="profile-avatar large">
          {userData?.firstName?.charAt(0) || user?.displayName?.charAt(0) || 'U'}
        </div>
        <div className="profile-title">
          <h2>{userData?.firstName} {userData?.lastName || user?.displayName || 'Voter'}</h2>
          <p>{user?.email}</p>
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-card personal-info">
          <div className="card-header">
            <svg viewBox="0 0 24 24" className="card-icon">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <h3>Personal Information</h3>
            <button className="edit-btn">
              <svg viewBox="0 0 24 24" className="edit-icon">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
          <div className="card-content">
            <div className="info-grid">
              <div className="info-item">
                <label>Full Name</label>
                <p>{userData?.firstName} {userData?.lastName || user?.displayName || 'Not provided'}</p>
              </div>
              <div className="info-item">
                <label>Email Address</label>
                <p>{user?.email}</p>
              </div>
              <div className="info-item">
                <label>Phone Number</label>
                <p>{userData?.phone || 'Not provided'}</p>
              </div>
              <div className="info-item">
                <label>Date of Birth</label>
                <p>{userData?.dob || 'Not provided'}</p>
              </div>
              <div className="info-item">
                <label>Address</label>
                <p>{userData?.address || 'Not provided'}</p>
              </div>
              <div className="info-item">
                <label>Registered Voter ID</label>
                <p>{userData?.voterID || 'Not linked'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-card wallet-info">
          <div className="card-header">
            <svg viewBox="0 0 24 24" className="card-icon">
              <path d="M19 7h-1V6a3 3 0 00-3-3H5a3 3 0 00-3 3v12a3 3 0 003 3h14a3 3 0 003-3v-8a3 3 0 00-3-3z" />
              <circle cx="16" cy="12" r="1" />
            </svg>
            <h3>Wallet Information</h3>
          </div>
          <div className="card-content">
            {walletConnected ? (
              <div className="wallet-details">
                <div className="wallet-item">
                  <label>Wallet Address</label>
                  <div className="address-container">
                    <p className="wallet-address">{walletAddress}</p>
                    <button className="copy-btn">
                      <svg viewBox="0 0 24 24" className="copy-icon">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="wallet-item">
                  <label>Connected Network</label>
                  <p>{currentNetwork}</p>
                </div>
                <div className="wallet-item">
                  <label>Connection Status</label>
                  <div className="status-badge connected">
                    <span className="status-dot"></span>
                    <span>Connected</span>
                  </div>
                </div>
                <button className="disconnect-wallet-btn">
                  <svg viewBox="0 0 24 24" className="disconnect-icon">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                  Disconnect Wallet
                </button>
              </div>
            ) : (
              <div className="wallet-connect-prompt">
                <div className="prompt-graphic">
                  <svg viewBox="0 0 24 24" className="wallet-prompt-icon">
                    <path d="M19 7h-1V6a3 3 0 00-3-3H5a3 3 0 00-3 3v12a3 3 0 003 3h14a3 3 0 003-3v-8a3 3 0 00-3-3z" />
                    <circle cx="16" cy="12" r="1" />
                  </svg>
                </div>
                <p>Connect your wallet to participate in blockchain-based voting and secure your identity.</p>
                <button className="connect-wallet-btn primary">Connect Wallet</button>
              </div>
            )}
          </div>
        </div>

        <div className="profile-card security">
          <div className="card-header">
            <svg viewBox="0 0 24 24" className="card-icon">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <h3>Security Settings</h3>
          </div>
          <div className="card-content">
            <div className="security-options">
              <div className="security-item">
                <div className="security-item-content">
                  <div className="security-item-icon">
                    <svg viewBox="0 0 24 24">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                  </div>
                  <div className="security-item-details">
                    <h4>Password</h4>
                    <p>Last changed on {userData?.passwordUpdated || 'N/A'}</p>
                  </div>
                </div>
                <button className="change-btn">Change</button>
              </div>
              
              <div className="security-item">
                <div className="security-item-content">
                  <div className="security-item-icon">
                    <svg viewBox="0 0 24 24">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <div className="security-item-details">
                    <h4>Two-Factor Authentication</h4>
                    <p>{userData?.twoFactorEnabled ? 'Enabled' : 'Disabled'}</p>
                  </div>
                </div>
                <button className="change-btn">Enable</button>
              </div>
              
              <div className="security-item">
                <div className="security-item-content">
                  <div className="security-item-icon">
                    <svg viewBox="0 0 24 24">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div className="security-item-details">
                    <h4>Verification Status</h4>
                    <p>{user?.emailVerified ? 'Verified' : 'Not Verified'}</p>
                  </div>
                </div>
                {!user?.emailVerified && <button className="change-btn">Verify</button>}
              </div>
            </div>
          </div>
        </div>

        <div className="profile-card danger-zone">
          <div className="card-header danger">
            <svg viewBox="0 0 24 24" className="card-icon">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <h3>Account Management</h3>
          </div>
          <div className="card-content">
            <div className="danger-options">
              <button className="danger-btn">
                <svg viewBox="0 0 24 24" className="danger-icon">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                </svg>
                Delete Account
              </button>
              <p className="danger-note">This action permanently removes all your data. It cannot be undone.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
