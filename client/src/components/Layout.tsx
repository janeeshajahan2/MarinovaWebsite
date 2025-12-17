import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  LayoutDashboard,
  Globe2,
  Menu,
  LogIn,
  LogOut,
  Lock,
  MessageSquare,
  FlaskConical,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CreditCounter from '../../components/CreditCounter';
import LoginModal from '../../components/LoginModal';
import EmailVerificationBanner from '../../components/EmailVerificationBanner';

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // Handle login query param
  useEffect(() => {
    if (searchParams.get('login') === 'true') {
      setShowLogin(true);
      // Remove the query param
      searchParams.delete('login');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  const handleLoginSuccess = () => {
    setShowLogin(false);
    // Check if there's a redirect path stored
    const redirectPath = sessionStorage.getItem('redirectAfterLogin');
    if (redirectPath) {
      sessionStorage.removeItem('redirectAfterLogin');
      navigate(redirectPath);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  // Helper to determine lock reason and action
  const getFeatureLockInfo = (feature: 'weatherBrief' | 'researchLab' | 'chat' | 'insights') => {
    // Not logged in
    if (!isAuthenticated || !user) {
      return { locked: true, reason: 'login', message: 'Please sign in to access this feature' };
    }

    // Logged in but email not verified
    if (!user.isEmailVerified) {
      return { locked: true, reason: 'verify', message: 'Please verify your email to access features. Check your inbox!' };
    }

    // Free tier: check if has any credits
    if (user.subscriptionStatus === 'free') {
      if (user.usageCredits <= 0) {
        return { locked: true, reason: 'subscribe', message: 'You have used all your credits. Please subscribe to continue.' };
      }
      return { locked: false, reason: null, message: null };
    }

    // Paid tier: check feature-specific credits (-1 means unlimited)
    const featureCredit = user.monthlyCredits[feature];
    if (featureCredit !== -1 && featureCredit <= 0) {
      return { locked: true, reason: 'subscribe', message: 'You have used all your monthly credits for this feature.' };
    }

    return { locked: false, reason: null, message: null };
  };

  // Simple check if feature is locked
  const isFeatureLocked = (feature: 'weatherBrief' | 'researchLab' | 'chat' | 'insights'): boolean => {
    return getFeatureLockInfo(feature).locked;
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, locked: false },
    { path: '/forecast', label: 'Forecast', icon: Globe2, locked: isFeatureLocked('weatherBrief') },
    { path: '/insights', label: 'Insights', icon: Sparkles, locked: isFeatureLocked('insights') },
    { path: '/research', label: 'Research Lab', icon: FlaskConical, locked: isFeatureLocked('researchLab') },
    { path: '/chat', label: 'Captain on Deck', icon: MessageSquare, locked: isFeatureLocked('chat') },
  ];

  const handleNavClick = (path: string, locked: boolean) => {
    if (!locked) {
      navigate(path);
      setIsMobileMenuOpen(false);
      return;
    }

    // Determine which feature this path corresponds to
    let feature: 'weatherBrief' | 'researchLab' | 'chat' | 'insights' = 'weatherBrief';
    if (path === '/research') feature = 'researchLab';
    else if (path === '/chat') feature = 'chat';
    else if (path === '/insights') feature = 'insights';

    const lockInfo = getFeatureLockInfo(feature);

    if (lockInfo.reason === 'login') {
      // Show login popup
      sessionStorage.setItem('intendedDestination', path);
      setShowLogin(true);
    } else if (lockInfo.reason === 'verify') {
      // Show verification reminder
      alert(lockInfo.message + '\n\nA verification email was sent to your inbox when you signed up.');
    } else if (lockInfo.reason === 'subscribe') {
      // Redirect to subscription page
      sessionStorage.setItem('intendedDestination', path);
      navigate('/subscription');
    }

    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-50 font-sans overflow-hidden">
      {showLogin && (
        <LoginModal 
          onClose={() => setShowLogin(false)} 
          onLogin={handleLoginSuccess}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-[#1e293b] border-r border-slate-700/50">
        <div className="p-6 border-b border-slate-700/50">
          <Link to="/" className="block">
            <h1 className="text-2xl font-bold text-white tracking-wider mb-4 hover:text-cyan-400 transition-colors cursor-pointer">MARINOVA</h1>
          </Link>
          <CreditCounter />
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path, item.locked)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive(item.path)
                    ? 'bg-[#334155] text-white border-l-4 border-cyan-400' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium flex-1 text-left">{item.label}</span>
                {item.locked && <Lock className="w-4 h-4 text-slate-600" />}
              </button>
            );
          })}
        </nav>
        
        {/* Auth Button in Sidebar Footer */}
        <div className="p-4 border-t border-slate-700/50">
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg transition-all font-semibold shadow-lg shadow-cyan-500/20"
            >
              <LogIn className="w-5 h-5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
        
        <div className="p-6 border-t border-slate-700/50">
          <div className="text-xs text-slate-500">
            <p>MARINOVA v1.1</p>
            <p>Ocean Data Initiative</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-[#1e293b] border-b border-slate-700/50">
          <Link to="/">
            <h1 className="text-xl font-bold hover:text-cyan-400 transition-colors cursor-pointer">MARINOVA</h1>
          </Link>
          <div className="flex items-center gap-2">
            <CreditCounter />
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <Menu className="w-6 h-6 text-slate-300" />
            </button>
          </div>
        </header>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#1e293b] p-4 border-b border-slate-700/50 space-y-2 absolute top-16 w-full z-50 shadow-2xl">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between ${
                  isActive(item.path) ? 'bg-slate-700 text-white' : 'text-slate-400'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span>{item.label}</span>
                {item.locked && <Lock className="w-4 h-4" />}
              </Link>
            ))}
            
            {/* Mobile Auth Button */}
            <div className="pt-4 border-t border-slate-700">
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowLogin(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg transition-all font-semibold shadow-lg shadow-cyan-500/20"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Email Verification Banner */}
        {isAuthenticated && <EmailVerificationBanner />}

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0f172a] via-[#172554]/20 to-[#0f172a] relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
