import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { ShoppingBag, Sun, Moon, Map, Activity, Home, Utensils, Shield, Store, PlusCircle, LogOut } from 'lucide-react';

const Navbar = () => {
  const { theme, toggleTheme, getCartCount, role, logout } = useContext(AppContext);
  const location = useLocation();
  const cartCount = getCartCount();

  const getNavLinkClass = (path) => {
    const baseClass = "flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg transition-all duration-200 no-underline";
    const activeClass = "text-zomato-red bg-zomato-light/60 dark:bg-zomato-light/10 font-bold border-b border-zomato-red/20";
    const inactiveClass = "text-slate-650 hover:text-zomato-red hover:bg-zomato-light/30 dark:text-slate-350 dark:hover:text-white dark:hover:bg-zomato-light/5";
    return `${baseClass} ${location.pathname === path ? activeClass : inactiveClass}`;
  };

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5 bg-white/90 dark:bg-brandDark/90 backdrop-blur-md border-b border-slate-150 dark:border-white/5 shadow-sm transition-all duration-300">
      
      {/* Brand Logo */}
      <Link to={role === 'admin' ? '/admin/dashboard' : '/'} className="flex items-center gap-2.5 no-underline group">
        <div className="bg-gradient-to-br from-zomato-red to-blinkit-yellow w-9.5 h-9.5 rounded-xl flex items-center justify-center text-white shadow-md shadow-zomato-red/15 group-hover:scale-105 transition-transform duration-300">
          <ShoppingBag size={18} />
        </div>
        <span className="font-display text-xl font-extrabold tracking-tight bg-gradient-to-r from-zomato-red to-zomato-hover bg-clip-text text-transparent">
          SmartFood Route
        </span>
      </Link>

      {/* Nav Links based on Role */}
      <div className="flex items-center gap-1.5">
        {role === 'admin' ? (
          <>
            <Link to="/admin/dashboard" className={getNavLinkClass('/admin/dashboard')}>
              <Shield size={15} /> Dashboard
            </Link>
            <Link to="/admin/restaurants" className={getNavLinkClass('/admin/restaurants')}>
              <Store size={15} /> Outlets
            </Link>
            <Link to="/admin/menus" className={getNavLinkClass('/admin/menus')}>
              <PlusCircle size={15} /> Menus
            </Link>
            <Link to="/optimizer" className={getNavLinkClass('/optimizer')}>
              <Map size={15} /> Dijkstra Sandbox
            </Link>
            <Link to="/analytics" className={getNavLinkClass('/analytics')}>
              <Activity size={15} /> Analytics
            </Link>
          </>
        ) : (
          <>
            <Link to="/" className={getNavLinkClass('/')}>
              <Home size={15} /> Home
            </Link>
            <Link to="/orders" className={getNavLinkClass('/orders')}>
              <Utensils size={15} /> Track Orders
            </Link>
            <Link to="/optimizer" className={getNavLinkClass('/optimizer')}>
              <Map size={15} /> Route Optimizer
            </Link>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-800 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200"
          title="Toggle Light/Dark Theme"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-red-500 dark:bg-slate-900 dark:border-white/10 dark:text-red-500 dark:hover:bg-red-950/20 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200"
          title="Log Out"
        >
          <LogOut size={15} />
        </button>

        {/* Cart Icon Link */}
        {role !== 'admin' && (
          <Link to="/cart" className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-800 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer relative no-underline transition-all duration-200">
            <ShoppingBag size={17} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-zomato-red text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm shadow-zomato-red/30 border-2 border-white">
                {cartCount}
              </span>
            )}
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
