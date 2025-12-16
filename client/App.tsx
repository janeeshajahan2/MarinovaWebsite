import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard,
  Globe2,
  Menu,
  LogIn,
  LogOut,
  Lock,
  MessageSquare,
  FlaskConical,
  Sparkles,
  Map as MapIcon, 
  Navigation,
  BrainCircuit,
  Loader2,
  Search,
  Thermometer
} from 'lucide-react';

import { FIVE_OCEANS } from './constants';
import { OceanLocation, WeatherResponse, WeatherDataPoint, DailyForecast, DashboardOceanData } from './types';
import { fetchWeatherData, transformToChartData, transformToDailyForecast } from './services/weatherService';
import { analyzeWeather } from './services/geminiService';
import { getGlobalOceanSnapshot } from './services/dashboardService';
import { checkAndIncrementUsage, isLimitReached } from './services/usageService';
import { useAuth } from './context/AuthContext';

import WeatherChart from './components/WeatherChart';
import OceanCard from './components/OceanCard';
import CurrentConditions from './components/CurrentConditions';
import DailyForecastList from './components/DailyForecast';
import OceanStatusCard from './components/OceanStatusCard';
import LoginModal from './components/LoginModal';
import ChatPage from './components/ChatPage';
import ReportPage from './components/ReportPage';
import InsightPage from './components/InsightPage';
import SubscriptionPage from './components/SubscriptionPage';
import EmailVerificationBanner from './components/EmailVerificationBanner';
import CreditCounter from './components/CreditCounter';

type ViewMode = 'dashboard' | 'intelligence' | 'chat' | 'report' | 'insights';

const App: React.FC = () => {
  const { isAuthenticated, user, logout, isLoading: authLoading, verifyEmail } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  
  // Intelligence State
  const [selectedLocation, setSelectedLocation] = useState<OceanLocation>(FIVE_OCEANS[0]);
  const [customLat, setCustomLat] = useState<string>('');
  const [customLon, setCustomLon] = useState<string>('');
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [chartData, setChartData] = useState<WeatherDataPoint[]>([]);
  const [dailyData, setDailyData] = useState<DailyForecast[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);

  // Dashboard State
  const [dashboardData, setDashboardData] = useState<DashboardOceanData[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // Auth state is now managed by AuthContext

  // Handle email verification from link
  useEffect(() => {
    const handleEmailVerification = async () => {
      const path = window.location.pathname;
      
      // Check if URL is /verify/:token
      const verifyMatch = path.match(/^\/verify\/(.+)$/);
      if (verifyMatch) {
        const token = verifyMatch[1];
        console.log('Verifying email with token:', token);
        
        // Check if user is logged in
        if (!isAuthenticated) {
          setVerificationMessage('⚠️ Please sign in first, then click the verification link again.');
          setShowLogin(true);
          return;
        }
        
        const result = await verifyEmail(token);
        console.log('Verification result:', result);
        
        if (result.success) {
          setVerificationMessage('✅ Email verified successfully! You now have 3 free credits.');
          // Clear the URL
          window.history.replaceState({}, document.title, '/');
          // Auto-dismiss message after 5 seconds
          setTimeout(() => setVerificationMessage(null), 5000);
        } else {
          setVerificationMessage('❌ Verification failed: ' + result.message);
        }
      }
    };

    handleEmailVerification();
  }, [isAuthenticated, verifyEmail]);

  // Check usage limit on initial load
  useEffect(() => {
    if (isLimitReached()) {
      setIsLocked(true);
    }

    const handleLimitReached = () => setIsLocked(true);
    window.addEventListener('marinovaLimitReached', handleLimitReached);
    return () => window.removeEventListener('marinovaLimitReached', handleLimitReached);
  }, []);

  // Initialize custom inputs
  useEffect(() => {
    setCustomLat(selectedLocation.lat.toString());
    setCustomLon(selectedLocation.lon.toString());
  }, [selectedLocation]);

  // Load Dashboard Data (Snapshot) - Async
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    if (viewMode === 'dashboard') {
      const loadDashboard = async () => {
        setDashboardLoading(true);
        try {
          // Fetch real-time data if authenticated, otherwise delayed by 5 hours
          const data = await getGlobalOceanSnapshot(isAuthenticated);
          setDashboardData(data);
        } catch (e) {
          console.error("Failed to load dashboard data", e);
        } finally {
          setDashboardLoading(false);
        }
      };
      
      // Initial Load
      loadDashboard();

      // Update every 5 hours (5 * 60 * 60 * 1000 ms)
      const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;
      intervalId = setInterval(loadDashboard, FIVE_HOURS_MS);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [viewMode, isAuthenticated]);

  const loadWeatherData = useCallback(async (loc: OceanLocation) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    
    try {
      const data = await fetchWeatherData(loc.lat, loc.lon);
      setWeather(data);
      setChartData(transformToChartData(data));
      setDailyData(transformToDailyForecast(data));
    } catch (err) {
      setError("Failed to fetch weather data. Please check connection.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial Load for Intelligence
  useEffect(() => {
    if (viewMode === 'intelligence') {
        loadWeatherData(selectedLocation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  const handleLocationSelect = (loc: OceanLocation) => {
    if (!checkAndIncrementUsage()) return;
    setSelectedLocation(loc);
    loadWeatherData(loc);
  };

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkAndIncrementUsage()) return;

    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setError("Invalid coordinates.");
      return;
    }

    const customLoc: OceanLocation = {
      id: 'custom',
      name: 'Custom Coordinates',
      lat,
      lon,
      description: 'User specified location'
    };
    setSelectedLocation(customLoc);
    loadWeatherData(customLoc);
  };

  const handleAiAnalysis = async () => {
    if (!weather) return;
    if (!checkAndIncrementUsage()) return;
    
    setAnalyzing(true);
    try {
      const result = await analyzeWeather(
        selectedLocation.name,
        selectedLocation.lat,
        selectedLocation.lon,
        weather
      );
      setAnalysis(result);
    } catch (err) {
      console.error(err);
      setAnalysis("Analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported.");
      return;
    }
    if (!checkAndIncrementUsage()) return;

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLoc: OceanLocation = {
          id: 'user',
          name: 'Your Location',
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          description: 'Current device location'
        };
        setSelectedLocation(userLoc);
        loadWeatherData(userLoc);
      },
      () => {
        setLoading(false);
        setError("Unable to retrieve location.");
      }
    );
  };

  const handleLoginSuccess = () => {
    setShowLogin(false);
    setViewMode('intelligence'); // Auto-redirect to forecast on login
  };

  const handleLogout = () => {
    logout();
    setViewMode('dashboard');
  };

  const handleAuthNavigation = (mode: ViewMode) => {
    // Check if user is authenticated
    if ((mode === 'intelligence' || mode === 'chat' || mode === 'report' || mode === 'insights') && !isAuthenticated) {
        setShowLogin(true);
        return;
    }
    
    // Check if email is verified for protected features
    if ((mode === 'intelligence' || mode === 'insights') && user && !user.isEmailVerified) {
      alert('⚠️ Please verify your email to access this feature. Check your inbox for the verification link.');
      return;
    }
    
    // Check if subscription is required for paid features
    if ((mode === 'chat' || mode === 'report') && user && user.subscriptionStatus === 'free') {
      // Redirect to subscription page
      setViewMode('dashboard');
      setIsLocked(true);
      return;
    }
    
    setViewMode(mode);
    setIsMobileMenuOpen(false);
  };

  if (isLocked) {
      return <SubscriptionPage onSubscribe={() => setIsLocked(false)} />;
  }

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
            <h1 className="text-2xl font-bold text-white tracking-wider mb-4">MARINOVA</h1>
            <CreditCounter />
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
            <button 
                onClick={() => handleAuthNavigation('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    viewMode === 'dashboard' 
                    ? 'bg-[#334155] text-white border-l-4 border-cyan-400' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
                <LayoutDashboard className="w-5 h-5" />
                <span className="font-medium">Dashboard</span>
            </button>

            <button 
                onClick={() => handleAuthNavigation('intelligence')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    viewMode === 'intelligence' 
                    ? 'bg-[#334155] text-white border-l-4 border-cyan-400' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
                <Globe2 className="w-5 h-5" />
                <span className="font-medium flex-1 text-left">Forecast</span>
                {!isAuthenticated && <Lock className="w-4 h-4 text-slate-600" />}
            </button>

            <button 
                onClick={() => handleAuthNavigation('insights')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    viewMode === 'insights' 
                    ? 'bg-[#334155] text-white border-l-4 border-cyan-400' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
                <Sparkles className="w-5 h-5" />
                <span className="font-medium flex-1 text-left">Insights</span>
                {!isAuthenticated && <Lock className="w-4 h-4 text-slate-600" />}
            </button>

            <button 
                onClick={() => handleAuthNavigation('report')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    viewMode === 'report' 
                    ? 'bg-[#334155] text-white border-l-4 border-cyan-400' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
                <FlaskConical className="w-5 h-5" />
                <span className="font-medium flex-1 text-left">Research Lab</span>
                {!isAuthenticated && <Lock className="w-4 h-4 text-slate-600" />}
            </button>

            <button 
                onClick={() => handleAuthNavigation('chat')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    viewMode === 'chat' 
                    ? 'bg-[#334155] text-white border-l-4 border-cyan-400' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
                <MessageSquare className="w-5 h-5" />
                <span className="font-medium flex-1 text-left">Captain on Deck</span>
                {!isAuthenticated && <Lock className="w-4 h-4 text-slate-600" />}
            </button>
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
            <h1 className="text-xl font-bold">MARINOVA</h1>
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
                <button 
                    onClick={() => handleAuthNavigation('dashboard')}
                    className={`w-full text-left px-4 py-3 rounded-lg ${viewMode === 'dashboard' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
                >
                    Dashboard
                </button>
                <button 
                    onClick={() => handleAuthNavigation('intelligence')}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between ${viewMode === 'intelligence' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
                >
                    <span>Forecast</span>
                    {!isAuthenticated && <Lock className="w-4 h-4" />}
                </button>
                <button 
                    onClick={() => handleAuthNavigation('insights')}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between ${viewMode === 'insights' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
                >
                    <span>Insights</span>
                    {!isAuthenticated && <Lock className="w-4 h-4" />}
                </button>
                 <button 
                    onClick={() => handleAuthNavigation('report')}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between ${viewMode === 'report' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
                >
                    <span>Research Lab</span>
                    {!isAuthenticated && <Lock className="w-4 h-4" />}
                </button>
                <button 
                    onClick={() => handleAuthNavigation('chat')}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between ${viewMode === 'chat' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
                >
                    <span>Captain on Deck</span>
                    {!isAuthenticated && <Lock className="w-4 h-4" />}
                </button>
                
                {/* Mobile Auth Button */}
                <div className="pt-4 border-t border-slate-700">
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

        {/* Verification Success/Error Message */}
        {verificationMessage && (
          <div className={`${verificationMessage.includes('✅') ? 'bg-green-600' : 'bg-red-600'} text-white px-6 py-4 text-center font-medium`}>
            {verificationMessage}
          </div>
        )}

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0f172a] via-[#172554]/20 to-[#0f172a] relative">
            
            {viewMode === 'chat' ? (
                <ChatPage />
            ) : viewMode === 'report' ? (
                <ReportPage />
            ) : viewMode === 'insights' ? (
                <InsightPage />
            ) : viewMode === 'dashboard' ? (
                 <div className="animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto p-6 lg:p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-2">MARINOVA</h2>
                            <p className="text-cyan-400 font-medium">Ocean Data Explorer</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full border border-slate-700">
                                <div className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-cyan-400 shadow-cyan-400/50' : 'bg-amber-400 shadow-amber-400/50'} animate-pulse shadow-[0_0_8px_currentColor]`}></div>
                                <span className="text-sm font-medium text-slate-200">
                                    {isAuthenticated ? 'Real-Time Satellite Feed' : 'Data delayed 5h • Sign in for Real-Time'}
                                </span>
                            </div>
                            
                        </div>
                    </div>

                    {dashboardLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-4">
                           <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                           <p className="animate-pulse">Acquiring satellite telemetry...</p>
                        </div>
                     ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {dashboardData.map((ocean) => (
                                <OceanStatusCard key={ocean.oceanId} data={ocean} />
                            ))}
                        </div>
                     )}
                 </div>
            ) : (
                /* Intelligence/Forecast View */
                <div className="animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto p-6 lg:p-8">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-white mb-1">Forecast Intelligence</h2>
                        <p className="text-slate-400 text-sm">Detailed weather analysis and AI predictions.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Column */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-6 shadow-xl">
                                <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                                <MapIcon className="w-5 h-5 text-cyan-400" />
                                Select Region
                                </h2>
                                
                                <div className="space-y-3 mb-6">
                                {FIVE_OCEANS.map(ocean => (
                                    <OceanCard 
                                    key={ocean.id}
                                    ocean={ocean}
                                    isSelected={selectedLocation.id === ocean.id}
                                    onClick={handleLocationSelect}
                                    />
                                ))}
                                </div>

                                <div className="border-t border-slate-700/50 pt-6">
                                    <form onSubmit={handleCustomSearch} className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                        type="number"
                                        step="any"
                                        placeholder="Lat"
                                        value={customLat}
                                        onChange={(e) => setCustomLat(e.target.value)}
                                        className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                        />
                                        <input
                                        type="number"
                                        step="any"
                                        placeholder="Lon"
                                        value={customLon}
                                        onChange={(e) => setCustomLon(e.target.value)}
                                        className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                        type="submit"
                                        className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                                        >
                                        <Search className="w-4 h-4" />
                                        Find
                                        </button>
                                        <button
                                        type="button"
                                        onClick={handleGeolocation}
                                        className="px-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                                        >
                                        <Navigation className="w-4 h-4" />
                                        </button>
                                    </div>
                                    </form>
                                </div>
                            </div>
                            {weather && <DailyForecastList data={dailyData} />}
                        </div>

                        {/* Right Column */}
                        <div className="lg:col-span-8 space-y-6">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                {error}
                                </div>
                            )}

                            {/* Header Card */}
                            <div className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-1">
                                    {selectedLocation.name}
                                    </h2>
                                    <p className="text-slate-400 font-mono text-sm">
                                    {selectedLocation.lat.toFixed(4)}° N, {selectedLocation.lon.toFixed(4)}° E
                                    </p>
                                </div>
                                {weather && (
                                    <div className="flex gap-6">
                                    <div className="text-right">
                                        <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Temp</p>
                                        <div className="flex items-center justify-end gap-2 text-2xl font-bold text-cyan-400">
                                            <Thermometer className="w-6 h-6" />
                                            {weather.current.temperature_2m}°C
                                        </div>
                                    </div>
                                    </div>
                                )}
                                </div>
                            </div>

                            {weather && <CurrentConditions data={weather} />}

                            <div className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-6 shadow-xl">
                                <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-slate-200">48-Hour Deep Dive</h3>
                                {loading && <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />}
                                </div>
                                
                                {loading && !chartData.length ? (
                                <div className="h-[300px] w-full flex items-center justify-center text-slate-500">
                                    Loading weather data...
                                </div>
                                ) : (
                                <WeatherChart data={chartData} />
                                )}
                            </div>

                            <div className="bg-gradient-to-br from-indigo-900/40 to-[#1e293b] border border-indigo-500/30 rounded-2xl p-6 shadow-xl">
                                <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-indigo-200 flex items-center gap-2">
                                    <BrainCircuit className="w-5 h-5" />
                                    Captain’s Intelligence Brief
                                </h3>
                                <button
                                    onClick={handleAiAnalysis}
                                    disabled={analyzing || loading || !weather}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                                >
                                    {analyzing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Analysing...
                                    </>
                                    ) : (
                                    <>
                                        Generate Brief
                                    </>
                                    )}
                                </button>
                                </div>

                                <div className="bg-[#0f172a]/50 rounded-xl p-4 min-h-[120px] border border-indigo-500/10">
                                {analyzing ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-3 text-indigo-300/50 py-8">
                                    <BrainCircuit className="w-8 h-8 animate-pulse" />
                                    <p className="text-sm animate-pulse">Processing barometric pressure and wind patterns...</p>
                                    </div>
                                ) : analysis ? (
                                    <div className="prose prose-invert prose-sm max-w-none">
                                    <div className="whitespace-pre-line text-slate-300 leading-relaxed">
                                        {analysis}
                                    </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-600 py-4">
                                    <p className="text-sm">Tap "Generate Brief" for an AI maritime assessment.</p>
                                    </div>
                                )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
      </div>
    </div>
  );
};

export default App;