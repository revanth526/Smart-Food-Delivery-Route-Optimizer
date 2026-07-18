import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AppContext } from '../context/AppContext';
import { Shield, Key, Phone, CheckCircle, AlertCircle, ShoppingBag, Database, RefreshCw, Mail, Lock, User } from 'lucide-react';

const Login = () => {
  const { setRole, setIsAuthenticated } = useContext(AppContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('customer'); // 'customer' or 'admin'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [userOtpInput, setUserOtpInput] = useState('');
  
  // Admin credentials
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  
  const [message, setMessage] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Live Database OTP Feed State
  const [dbOtps, setDbOtps] = useState([]);

  // Fetch active OTPs directly from the database
  const fetchDbOtps = async () => {
    try {
      const res = await api.get('/auth/active-otps');
      setDbOtps(res.data);
    } catch (err) {
      setDbOtps([]);
    }
  };

  // Poll database active OTP records every 3 seconds for a seamless demo
  useEffect(() => {
    fetchDbOtps();
    const interval = setInterval(fetchDbOtps, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (phoneNumber.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setErrorMsg(null);
    setMessage('Connecting to database secure gateway...');

    try {
      await api.post('/auth/send-otp', { phone: phoneNumber });
      setOtpSent(true);
      setMessage('💾 OTP dispatched and saved in MongoDB Database! Copy the 6-digit code from the live feed below.');
      fetchDbOtps();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Error connecting to auth service. Ensure Node backend is running.';
      setErrorMsg(errMsg);
      setMessage(null);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setMessage('Verifying with database records...');
    
    try {
      const res = await api.post('/auth/verify-otp', { phone: phoneNumber, otp: userOtpInput });
      setErrorMsg(null);
      setMessage('✅ Verification successful! Loading portal...');
      
      // Store JWT token session
      localStorage.setItem('user_session', JSON.stringify({
        token: res.data.token,
        role: 'customer',
        phoneNumber: res.data.user.phone,
        name: res.data.user.name
      }));
      
      setIsAuthenticated(true);
      setRole('customer');
      
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Verification failed. Try matching the active database OTP.';
      setErrorMsg(errMsg);
      setMessage(null);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setErrorMsg(null);
    setMessage('Authenticating credentials...');

    try {
      const res = await api.post('/admin/login', {
        email: emailInput.trim(),
        password: passwordInput
      });

      setErrorMsg(null);
      setMessage('🔑 Credentials accepted! Opening Admin console...');
      
      // Store admin session details
      localStorage.setItem('user_session', JSON.stringify({
        token: res.data.token,
        role: 'admin',
        email: res.data.admin.email
      }));
      
      setIsAuthenticated(true);
      setRole('admin');
      
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 1000);
    } catch (err) {
      // Offline Sandbox Fallback: allow login using default credentials
      if (emailInput.trim() === 'rkrevanth2456@gmail.com' && passwordInput === 'Salaar@111') {
        setErrorMsg(null);
        setMessage('🔑 Credentials accepted (Offline Sandbox)! Opening Admin console...');
        
        localStorage.setItem('user_session', JSON.stringify({
          token: 'simulated_admin_jwt_token',
          role: 'admin',
          email: 'rkrevanth2456@gmail.com'
        }));
        
        setIsAuthenticated(true);
        setRole('admin');
        
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 1000);
      } else {
        const errMsg = err.response?.data?.message || 'Access denied. Invalid secure admin credentials.';
        setErrorMsg(errMsg);
        setMessage(null);
      }
    }
  };

  return (
    <div className="fade-in max-w-md mx-auto px-6 py-12 flex flex-col gap-6 items-center justify-center min-h-[75vh]">
      
      {/* Login Card */}
      <div className="w-full bg-white dark:bg-[#243038] border border-slate-150 dark:border-white/5 rounded-3xl p-8 shadow-sm flex flex-col gap-6">
        
        {/* Brand header */}
        <div className="text-center flex flex-col items-center gap-2">
          <div className="bg-gradient-to-br from-zomato-red to-blinkit-yellow w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shadow-zomato-red/15">
            <ShoppingBag size={24} />
          </div>
          <h2 className="font-display text-xl font-extrabold text-slate-800 dark:text-white mt-2">
            SmartFood Delivery
          </h2>
          <span className="text-[11px] text-slate-450 dark:text-slate-400 uppercase font-semibold tracking-wider">
            Secure Routing & Ordering Portal
          </span>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-slate-100 dark:bg-brandDark p-1 rounded-full border border-slate-205 dark:border-white/5">
          <button
            onClick={() => {
              setActiveTab('customer');
              setErrorMsg(null);
              setMessage(null);
            }}
            className={`flex-1 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'customer' 
                ? 'bg-zomato-red text-white shadow-sm' 
                : 'text-slate-500 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <User size={14} />
            <span>Customer Login</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('admin');
              setErrorMsg(null);
              setMessage(null);
            }}
            className={`flex-1 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'admin' 
                ? 'bg-brandDark text-white dark:bg-white dark:text-slate-850 shadow-sm' 
                : 'text-slate-500 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Lock size={14} />
            <span>Admin Login</span>
          </button>
        </div>

        {/* Message Banner */}
        {message && (
          <div className="p-3.5 bg-zomato-light/50 dark:bg-zomato-red/10 border border-zomato-red/20 rounded-xl text-xs text-slate-750 dark:text-slate-200 leading-relaxed flex items-start gap-2.5 shadow-sm">
            <CheckCircle size={15} className="text-zomato-red flex-shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        {/* Error Banner */}
        {errorMsg && (
          <div className="p-3.5 bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-500/20 rounded-xl text-xs text-red-650 dark:text-red-300 leading-relaxed flex items-start gap-2.5 shadow-sm">
            <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Portals Forms */}
        {activeTab === 'customer' ? (
          <div className="flex flex-col gap-4">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="phone-number" className="block text-xs font-semibold text-slate-505 dark:text-slate-400 mb-1.5">Phone Number</label>
                  <div className="relative flex items-center">
                    <Phone size={15} className="absolute left-3.5 text-slate-400" />
                    <input
                      id="phone-number"
                      type="tel"
                      required
                      pattern="[0-9]{10}"
                      placeholder="Enter 10-digit number"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, '').substring(0, 10))}
                      className="w-full bg-slate-50 dark:bg-brandDark border border-slate-200 dark:border-white/10 text-slate-850 dark:text-white focus:border-zomato-red focus:ring-4 focus:ring-zomato-red/10 rounded-xl text-sm outline-none transition-all duration-200 pl-10 pr-4 py-2.5"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full bg-zomato-red hover:bg-zomato-hover active:bg-zomato-hover/95 text-white font-semibold py-2.5 px-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer mt-2 text-sm">
                  Send OTP Pin
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="otp-input" className="block text-xs font-semibold text-slate-505 dark:text-slate-400 mb-1.5">Enter 6-Digit OTP Pin</label>
                  <div className="relative flex items-center">
                    <Key size={15} className="absolute left-3.5 text-slate-400" />
                    <input
                      id="otp-input"
                      type="text"
                      required
                      pattern="[0-9]{6}"
                      placeholder="Enter 6-digit code"
                      value={userOtpInput}
                      onChange={e => setUserOtpInput(e.target.value.replace(/\D/g, '').substring(0, 6))}
                      className="w-full bg-slate-50 dark:bg-brandDark border border-slate-200 dark:border-white/10 text-slate-855 dark:text-white focus:border-zomato-red focus:ring-4 focus:ring-zomato-red/10 rounded-xl text-sm outline-none transition-all duration-200 text-center tracking-[4px] font-bold text-[15px] pl-10 pr-4 py-2.5"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full bg-zomato-red hover:bg-zomato-hover active:bg-zomato-hover/95 text-white font-semibold py-2.5 px-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer mt-2 text-sm">
                  Verify & Log In
                </button>
                <button type="button" onClick={() => setOtpSent(false)} className="bg-transparent border-none text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 text-xs cursor-pointer text-center underline mt-1">
                  Change Phone Number
                </button>
              </form>
            )}
          </div>
        ) : (
          /* Admin Form */
          <form onSubmit={handleAdminLogin} className="flex flex-col gap-4">
            <div>
              <label htmlFor="admin-email" className="block text-xs font-semibold text-slate-505 dark:text-slate-400 mb-1.5">Admin Email Address</label>
              <div className="relative flex items-center">
                <Mail size={15} className="absolute left-3.5 text-slate-400" />
                <input
                  id="admin-email"
                  type="email"
                  required
                  placeholder="e.g. admin@example.com"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-brandDark border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:border-zomato-red focus:ring-4 focus:ring-zomato-red/10 rounded-xl text-sm outline-none transition-all duration-200 pl-10 pr-4 py-2.5"
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs font-semibold text-slate-505 dark:text-slate-400 mb-1.5">Secret Password</label>
              <div className="relative flex items-center">
                <Lock size={15} className="absolute left-3.5 text-slate-400" />
                <input
                  id="admin-password"
                  type="password"
                  required
                  placeholder="Enter Password"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-brandDark border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:border-zomato-red focus:ring-4 focus:ring-zomato-red/10 rounded-xl text-sm outline-none transition-all duration-200 pl-10 pr-4 py-2.5"
                />
              </div>
              <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">
                💡 Tip for Demo: Use <strong>rkrevanth2456@gmail.com</strong> / <strong>Salaar@111</strong>
              </span>
            </div>

            <button type="submit" className="w-full bg-brandDark hover:bg-slate-800 text-white font-semibold py-2.5 px-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer mt-2 text-sm">
              Authenticate Admin
            </button>
          </form>
        )}
      </div>

      {/* Database OTP Active Feed panel */}
      <div className="w-full bg-white dark:bg-[#243038] border border-slate-150 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-white/5">
          <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Database size={13} className="text-zomato-red" />
            Live Database OTP Feed (MongoDB)
          </h3>
          <button
            onClick={fetchDbOtps}
            className="bg-transparent border-none text-slate-400 dark:text-slate-500 hover:text-slate-655 dark:hover:text-slate-350 cursor-pointer flex items-center"
            title="Refresh Feed"
          >
            <RefreshCw size={12} />
          </button>
        </div>

        {dbOtps.length > 0 ? (
          <div className="flex flex-col gap-2">
            {dbOtps.map(entry => (
              <div key={entry._id || entry.phone} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-brandDark border border-slate-100 dark:border-white/5 rounded-xl text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  Phone: <strong className="text-slate-700 dark:text-slate-200">{entry.phone}</strong>
                </span>
                <span className="text-zomato-red font-extrabold text-[12px] bg-zomato-light dark:bg-zomato-red/10 border border-zomato-red/20 px-2 py-0.5 rounded-lg tracking-wider">
                  {entry.otp || '******'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-[11px] text-slate-450 dark:text-slate-500 italic text-center py-2">
            No active OTPs stored in database. Click "Send OTP Pin" to generate.
          </span>
        )}
      </div>
    </div>
  );
};

export default Login;
