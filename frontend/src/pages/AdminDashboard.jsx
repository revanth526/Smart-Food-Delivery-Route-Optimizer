import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { RefreshCw, Clipboard, CheckCircle, Package, ArrowRight, Shield, Search, DollarSign, ListCollapse } from 'lucide-react';

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    todayOrders: 0,
    todayRevenue: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.warn('Failed to load dashboard metrics from backend.');
    }
  };

  const fetchOrders = async (showLoader = false, search = '') => {
    try {
      if (showLoader) setRefreshing(true);
      const url = search.trim() !== '' ? `/orders?search=${encodeURIComponent(search.trim())}` : '/orders';
      const res = await api.get(url);
      setOrders(res.data.orders || []);
    } catch (err) {
      console.warn('Backend offline. Falling back to local tracking storage.');
      const saved = localStorage.getItem('activeOrder');
      setOrders(saved ? [JSON.parse(saved)] : []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadData = async (showLoader = false) => {
    await Promise.all([fetchStats(), fetchOrders(showLoader, searchQuery)]);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders(true, searchQuery);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}`, { orderStatus: newStatus });
      loadData(false);
    } catch (err) {
      setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, orderStatus: newStatus } : o));
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Order Confirmed': return '#E23744'; // Zomato Red
      case 'Preparing Food': return '#E5B51A'; // Blinkit Yellow
      case 'Delivery Partner Picked': return '#318639'; // Blinkit Green
      case 'On the Way': return '#8b5cf6';
      case 'Delivered': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <div className="fade-in max-w-6xl mx-auto px-6 py-10 flex flex-col gap-8">
      
      {/* Header Banner */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-150 dark:border-white/5 pb-5">
        <div className="flex items-center gap-3">
          <div className="bg-zomato-light text-zomato-red w-11 h-11 rounded-xl flex items-center justify-center shadow-sm border border-zomato-red/10">
            <Shield size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-450 dark:text-slate-550 font-semibold uppercase tracking-wider">System Control Center</span>
            <h1 className="font-display text-2.5xl font-extrabold text-slate-800 dark:text-white mt-0.5">
              Admin Order Desk
            </h1>
          </div>
        </div>

        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-white/10 dark:text-slate-350 dark:hover:bg-slate-800 py-2 px-4 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh Feed'}
        </button>
      </div>

      {/* Aggregate Statistics Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#243038] border border-slate-150 dark:border-white/5 rounded-3xl p-6 shadow-sm flex items-center gap-4 transition-colors duration-300">
          <div className="text-2xl bg-zomato-light w-12 h-12 rounded-full flex items-center justify-center shadow-inner">📋</div>
          <div>
            <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Active Deliveries</span>
            <strong className="text-xl font-extrabold text-slate-800 dark:text-white">{stats.activeOrders}</strong>
          </div>
        </div>

        <div className="bg-white dark:bg-[#243038] border border-slate-150 dark:border-white/5 rounded-3xl p-6 shadow-sm flex items-center gap-4 transition-colors duration-300">
          <div className="text-2xl bg-blinkit-light w-12 h-12 rounded-full flex items-center justify-center shadow-inner">💰</div>
          <div>
            <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Sales</span>
            <strong className="text-xl font-extrabold text-blinkit-green">₹{stats.totalRevenue}</strong>
          </div>
        </div>

        <div className="bg-white dark:bg-[#243038] border border-slate-150 dark:border-white/5 rounded-3xl p-6 shadow-sm flex items-center gap-4 transition-colors duration-300">
          <div className="text-2xl bg-slate-50 dark:bg-brandDark w-12 h-12 rounded-full flex items-center justify-center shadow-inner">🍽️</div>
          <div>
            <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Today's Orders</span>
            <strong className="text-xl font-extrabold text-slate-800 dark:text-white">{stats.todayOrders}</strong>
          </div>
        </div>
      </div>

      {/* Live Order List & Search bar */}
      <div>
        <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
          <h2 className="font-display text-xl font-bold text-slate-800 dark:text-white">
            Incoming Orders Feed
          </h2>

          {/* Search Bar Form */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2.5 max-w-sm w-full relative">
            <div className="relative flex-1 flex items-center">
              <Search size={14} className="absolute left-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search Name, Phone, or Order ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-brandDark border border-slate-200 dark:border-white/10 focus:border-zomato-red focus:ring-4 focus:ring-zomato-red/10 rounded-full text-slate-800 dark:text-white pl-9 pr-4 py-2 text-xs outline-none transition-all duration-200 placeholder:text-slate-400"
              />
            </div>
            <button type="submit" className="bg-zomato-red hover:bg-zomato-hover text-white font-semibold py-2 px-4 rounded-full text-xs shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
              Search
            </button>
          </form>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            Loading live orders...
          </div>
        ) : orders.length > 0 ? (
          <div className="flex flex-col gap-4">
            {orders.map((order) => (
              <div key={order.orderId} className="bg-white dark:bg-[#243038] border border-slate-150 dark:border-white/5 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row justify-between lg:items-center gap-4 hover:border-slate-350 dark:hover:border-white/10 hover:shadow-md transition-all duration-200 transition-colors duration-300">
                
                {/* Details */}
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-300 font-mono tracking-tight bg-slate-50 dark:bg-brandDark border border-slate-200/50 dark:border-white/10 px-2 py-0.5 rounded">
                      {order.orderId}
                    </span>
                    <span 
                      className="text-[9px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider"
                      style={{
                        backgroundColor: getStatusBadgeColor(order.orderStatus) + '10',
                        color: getStatusBadgeColor(order.orderStatus),
                        borderColor: getStatusBadgeColor(order.orderStatus) + '20'
                      }}
                    >
                      {order.orderStatus}
                    </span>
                  </div>

                  <div className="text-[11.5px] text-slate-500 dark:text-slate-400 flex flex-wrap gap-4 mt-1">
                    <span>Customer: <strong className="text-slate-750 dark:text-slate-200">{order.customerName}</strong></span>
                    <span>Phone: <strong className="text-slate-750 dark:text-slate-200">{order.phoneNumber}</strong></span>
                    <span>Items Qty: <strong className="text-slate-750 dark:text-slate-200">{order.quantity}</strong></span>
                    <span>Total: <strong className="text-slate-850 dark:text-slate-105 font-bold">₹{order.totalPrice}</strong></span>
                    <span>Method: <strong className="text-slate-750 dark:text-slate-200">{order.paymentMethod} ({order.paymentStatus})</strong></span>
                  </div>
                  
                  {order.orderedItems && (
                    <div className="text-[10px] text-slate-400 dark:text-slate-450 mt-2 border-t border-slate-100 dark:border-white/5 pt-2 flex items-center gap-1.5">
                      <span className="font-semibold uppercase tracking-wider text-[8.5px] bg-slate-100 dark:bg-brandDark text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">Dishes</span>
                      <span>{order.orderedItems.map(item => `${item.itemName} (x${item.quantity})`).join(', ')}</span>
                    </div>
                  )}
                </div>

                {/* Operations Control buttons */}
                <div className="flex gap-2 items-center lg:justify-end">
                  {order.orderStatus !== 'Delivered' ? (
                    <div className="flex gap-2">
                      {order.orderStatus === 'Order Confirmed' && (
                        <button
                          onClick={() => handleUpdateStatus(order.orderId, 'Preparing Food')}
                          className="bg-zomato-red hover:bg-zomato-hover text-white font-semibold py-1.5 px-3.5 rounded-xl text-xs shadow-sm hover:shadow-md cursor-pointer transition-all duration-200"
                        >
                          🍳 Cook Meal
                        </button>
                      )}
                      {order.orderStatus === 'Preparing Food' && (
                        <button
                          onClick={() => handleUpdateStatus(order.orderId, 'Delivery Partner Picked')}
                          className="bg-blinkit-green hover:bg-blinkit-green/90 text-white font-semibold py-1.5 px-3.5 rounded-xl text-xs shadow-sm hover:shadow-md cursor-pointer transition-all duration-200"
                        >
                          🛵 Hand to Rider
                        </button>
                      )}
                      {order.orderStatus === 'Delivery Partner Picked' && (
                        <button
                          onClick={() => handleUpdateStatus(order.orderId, 'On the Way')}
                          className="bg-brandDark dark:bg-slate-900 hover:bg-slate-805 dark:hover:bg-slate-800 text-white font-semibold py-1.5 px-3.5 rounded-xl text-xs shadow-sm hover:shadow-md cursor-pointer transition-all duration-200"
                        >
                          🛣️ Send Out
                        </button>
                      )}
                      {order.orderStatus === 'On the Way' && (
                        <button
                          onClick={() => handleUpdateStatus(order.orderId, 'Delivered')}
                          className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold py-1.5 px-3.5 rounded-xl text-xs shadow-sm hover:shadow-md cursor-pointer transition-all duration-200"
                        >
                          ✅ Complete Order
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                      Archived ✓
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center gap-1.5">
            <Clipboard size={24} className="text-slate-350" />
            <p className="text-sm font-semibold">No matching orders found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
