import React, { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { ShoppingBag, Eye, RefreshCw, AlertCircle, AlertTriangle, Download, Image, FileText, Check, X } from 'lucide-react';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Payments and moderation states
  const [payments, setPayments] = useState({}); // orderId -> payment record
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [resubmitOrderId, setResubmitOrderId] = useState('');
  const [resubmitUtr, setResubmitUtr] = useState('');
  const [resubmitScreenshot, setResubmitScreenshot] = useState('');
  const [submittingResubmit, setSubmittingResubmit] = useState(false);
  const [adminRemarks, setAdminRemarks] = useState({}); // orderId -> remark text
  
  const { setActiveOrder } = useContext(AppContext);
  const navigate = useNavigate();

  const fetchAllPayments = async (ordersList) => {
    const paymentsData = {};
    await Promise.all(
      ordersList.map(async (order) => {
        try {
          const res = await api.get(`/payments/order/${order.id}`);
          if (res.data.payment) {
            paymentsData[order.id] = res.data.payment;
          }
        } catch (err) {
          // Offline fallback: load from localStorage
          const local = localStorage.getItem(`simulated_payment_${order.id}`);
          if (local) {
            paymentsData[order.id] = JSON.parse(local);
          }
        }
      })
    );
    setPayments(paymentsData);
  };

  const fetchOrders = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setRefreshing(true);
      
      const session = JSON.parse(localStorage.getItem('user_session') || '{}');
      const role = session.role || 'customer';
      const phone = session.phoneNumber || '';
      
      const url = role === 'customer' && phone ? `/orders?search=${encodeURIComponent(phone)}` : '/orders';
      const response = await api.get(url);
      const backendOrders = response.data.orders || [];
      
      const mapped = backendOrders.map(o => ({
        ...o,
        id: o.orderId,
        status: o.orderStatus,
        total: o.totalPrice
      }));

      setOrders(mapped);
      setError(false);
      
      // Fetch corresponding payments
      if (role === 'admin' || mapped.some(o => o.paymentMethod === 'Online' || o.status === 'Pending Verification')) {
        fetchAllPayments(mapped);
      }
    } catch (err) {
      console.warn('Backend REST API unavailable for fetching orders. Using local storage simulation.');
      const savedOrder = localStorage.getItem('activeOrder');
      if (savedOrder) {
        setOrders([JSON.parse(savedOrder)]);
      } else {
        setOrders([]);
      }
      setError(true);
      
      // Fallback payments load
      const saved = localStorage.getItem('activeOrder');
      if (saved) {
        const orderObj = JSON.parse(saved);
        const localPay = localStorage.getItem(`simulated_payment_${orderObj.id}`);
        if (localPay) {
          setPayments({ [orderObj.id]: JSON.parse(localPay) });
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleTrackOrder = (order) => {
    const trackedOrder = {
      ...order,
      customerLocation: order.customerLocation || 'Ameerpet'
    };
    setActiveOrder(trackedOrder);
    navigate('/tracking');
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}`, { orderStatus: newStatus });
      fetchOrders(false);
    } catch (err) {
      console.warn('Backend connection failed. Simulating status update locally.');
      setOrders(prevOrders => 
        prevOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
      );
      
      const activeOrderStr = localStorage.getItem('activeOrder');
      if (activeOrderStr) {
        const activeOrder = JSON.parse(activeOrderStr);
        if (activeOrder.id === orderId) {
          activeOrder.status = newStatus;
          localStorage.setItem('activeOrder', JSON.stringify(activeOrder));
        }
      }
    }
  };

  const handleModeratePayment = async (orderId, action) => {
    const remark = adminRemarks[orderId] || '';
    try {
      await api.patch(`/payments/moderate/${orderId}`, { action, remark });
      fetchOrders();
    } catch (err) {
      console.warn('Payment moderation failed. Simulating locally.');
      
      // Simulate locally
      setOrders(prev => prev.map(o => {
        if (o.id === orderId) {
          const simulatedStatus = action === 'approve' ? 'Order Confirmed' : 'Rejected';
          const simulatedPay = action === 'approve' ? 'Paid' : 'Rejected';
          
          // Update active order if it is current active tracking order
          const activeOrderStr = localStorage.getItem('activeOrder');
          if (activeOrderStr) {
            const activeObj = JSON.parse(activeOrderStr);
            if (activeObj.id === orderId) {
              activeObj.status = simulatedStatus;
              activeObj.paymentStatus = simulatedPay;
              localStorage.setItem('activeOrder', JSON.stringify(activeObj));
            }
          }

          return {
            ...o,
            status: simulatedStatus,
            paymentStatus: simulatedPay
          };
        }
        return o;
      }));

      // Update local payments map state
      setPayments(prev => {
        const payRecord = prev[orderId] ? { ...prev[orderId] } : { orderId, transactionId: '123456789012' };
        payRecord.paymentStatus = action === 'approve' ? 'Paid' : 'Rejected';
        payRecord.adminRemark = remark;
        return { ...prev, [orderId]: payRecord };
      });

      // Update localStorage record
      const localStr = localStorage.getItem(`simulated_payment_${orderId}`);
      if (localStr) {
        const local = JSON.parse(localStr);
        local.paymentStatus = action === 'approve' ? 'Paid' : 'Rejected';
        local.adminRemark = remark;
        localStorage.setItem(`simulated_payment_${orderId}`, JSON.stringify(local));
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setResubmitScreenshot(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResubmitPayment = async (e) => {
    e.preventDefault();
    if (!/^\d{12}$/.test(resubmitUtr)) {
      alert('Please enter a valid 12-digit UTR Transaction ID (digits only).');
      return;
    }

    setSubmittingResubmit(true);
    try {
      await api.post('/payments/submit', {
        orderId: resubmitOrderId,
        transactionId: resubmitUtr,
        paymentScreenshotUrl: resubmitScreenshot
      });
      setShowResubmitModal(false);
      setResubmitUtr('');
      setResubmitScreenshot('');
      fetchOrders();
    } catch (err) {
      console.warn('Resubmission failed. Simulating locally.');
      
      // Update local orders list status
      setOrders(prev => prev.map(o => {
        if (o.id === resubmitOrderId) {
          const activeOrderStr = localStorage.getItem('activeOrder');
          if (activeOrderStr) {
            const activeObj = JSON.parse(activeOrderStr);
            if (activeObj.id === resubmitOrderId) {
              activeObj.status = 'Pending Verification';
              activeObj.paymentStatus = 'Pending Verification';
              localStorage.setItem('activeOrder', JSON.stringify(activeObj));
            }
          }
          return {
            ...o,
            status: 'Pending Verification',
            paymentStatus: 'Pending Verification'
          };
        }
        return o;
      }));

      // Save in localStorage simulated payment
      const simulatedPayment = {
        orderId: resubmitOrderId,
        transactionId: resubmitUtr,
        paymentScreenshotUrl: resubmitScreenshot,
        paymentStatus: 'Pending Verification',
        adminRemark: '',
        createdAt: new Date().toISOString()
      };
      localStorage.setItem(`simulated_payment_${resubmitOrderId}`, JSON.stringify(simulatedPayment));
      
      setShowResubmitModal(false);
      setResubmitUtr('');
      setResubmitScreenshot('');
      fetchOrders();
    } finally {
      setSubmittingResubmit(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending Verification': return '#ea580c'; // Orange
      case 'Order Confirmed': return '#E23744'; // Zomato Red
      case 'Preparing Food': return '#E5B51A'; // Blinkit Yellow
      case 'Delivery Partner Picked': return '#318639'; // Blinkit Green
      case 'On the Way': return '#8b5cf6';
      case 'Delivered': return '#10b981';
      case 'Rejected': return '#ef4444'; // Bright Red
      default: return '#6b7280';
    }
  };

  return (
    <div className="fade-in max-w-4xl mx-auto px-6 py-10 flex flex-col gap-6">
      
      {/* Header Row */}
      <div className="flex justify-between items-center pb-5 border-b border-slate-150 dark:border-white/5">
        <h1 className="font-display text-2.5xl font-extrabold text-slate-800 dark:text-white">
          Order Management
        </h1>
        
        <button
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
          className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-white/10 dark:text-slate-350 dark:hover:bg-slate-800 py-2 px-4 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-blinkit-light dark:bg-blinkit-green/10 border border-blinkit-yellow/20 dark:border-blinkit-green/20 rounded-xl text-xs text-blinkit-green dark:text-blinkit-yellow leading-relaxed flex items-start gap-2.5 shadow-sm">
          <AlertCircle size={15} className="text-blinkit-green dark:text-blinkit-yellow flex-shrink-0 mt-0.5" />
          <span>Running in Offline Sandbox. Simulated orders are persisted in browser memory.</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          Loading orders...
        </div>
      ) : orders.length > 0 ? (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white dark:bg-[#243038] border border-slate-150 dark:border-white/5 rounded-2xl p-6 shadow-sm flex flex-col gap-4 hover:border-slate-350 dark:hover:border-white/10 hover:shadow-md transition-all duration-250">
              
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                {/* Order Info */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-display text-sm font-bold text-slate-800 dark:text-white">
                      Order #{order.id}
                    </span>
                    <span 
                      className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border"
                      style={{
                        backgroundColor: getStatusColor(order.status) + '10',
                        color: getStatusColor(order.status),
                        borderColor: getStatusColor(order.status) + '20'
                      }}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-550 dark:text-slate-400 flex flex-col gap-1 mt-1">
                    <span>Customer: <strong className="text-slate-705 dark:text-slate-200">{order.customerName}</strong></span>
                    <span>Restaurant: <strong className="text-slate-750 dark:text-slate-200">{order.restaurant?.name || 'Pizza Hub'}</strong></span>
                    <span>Total Amount: <strong className="text-slate-800 dark:text-slate-100">₹{order.total}</strong></span>
                  </div>
                </div>

                {/* Order Actions */}
                <div className="flex flex-col gap-2.5 md:items-end">
                  <button
                    onClick={() => handleTrackOrder(order)}
                    className="flex items-center gap-1 bg-zomato-red hover:bg-zomato-hover text-white font-semibold py-2 px-4.5 rounded-xl text-xs shadow-sm hover:shadow-md cursor-pointer transition-all duration-200"
                  >
                    <Eye size={13} /> Track Delivery
                  </button>                  {/* Simulate Status Updates - ADMIN ONLY */}
                  {JSON.parse(localStorage.getItem('user_session') || '{}').role === 'admin' ? (
                    <div className="flex gap-2 flex-wrap mt-1">
                      {order.status !== 'Delivered' && order.status !== 'Rejected' && order.status !== 'Pending Verification' ? (
                        <>
                          {order.status === 'Order Confirmed' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'Preparing Food')}
                              className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-655 dark:bg-brandDark dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-900 py-1.5 px-3 rounded-full text-[10px] font-bold cursor-pointer transition-all duration-150"
                            >
                              🍳 Start Prep
                            </button>
                          )}
                          {order.status === 'Preparing Food' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'Delivery Partner Picked')}
                              className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-655 dark:bg-brandDark dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-900 py-1.5 px-3 rounded-full text-[10px] font-bold cursor-pointer transition-all duration-150"
                            >
                              🛵 Rider Picked
                            </button>
                          )}
                          {order.status === 'Delivery Partner Picked' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'On the Way')}
                              className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-655 dark:bg-brandDark dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-900 py-1.5 px-3 rounded-full text-[10px] font-bold cursor-pointer transition-all duration-150"
                            >
                              🛣️ Send On Way
                            </button>
                          )}
                          {order.status === 'On the Way' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'Delivered')}
                              className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-655 dark:bg-brandDark dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-900 py-1.5 px-3 rounded-full text-[10px] font-bold cursor-pointer transition-all duration-150"
                            >
                              ✅ Set Delivered
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-[10px] text-slate-400 dark:text-slate-550 font-semibold uppercase tracking-wider">
                          {order.status === 'Delivered' ? 'Completed ✓' : order.status === 'Rejected' ? 'Rejected ❌' : 'Awaiting Review ⏳'}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-[10.5px] text-slate-500 dark:text-slate-450 font-semibold mt-1">
                      Current Status: <span className="text-zomato-red font-bold">{order.status}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Details Section */}
              {payments[order.id] && (
                <div className="border-t border-slate-100 dark:border-white/5 pt-4 flex flex-col gap-3">
                  <div className="text-[10px] text-slate-400 dark:text-slate-550 font-bold uppercase tracking-wider flex items-center gap-1">
                    <FileText size={12} /> Payment Verification Details
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-brandDark/50 p-4 rounded-xl border border-slate-150 dark:border-white/5">
                    <div className="flex flex-col gap-2">
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        UTR Transaction ID: <strong className="text-slate-800 dark:text-white font-mono tracking-wide">{payments[order.id].transactionId}</strong>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        Verification Status: 
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          payments[order.id].paymentStatus === 'Paid'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                            : payments[order.id].paymentStatus === 'Rejected'
                            ? 'bg-red-500/10 border-red-500/20 text-red-500'
                            : 'bg-orange-500/10 border-orange-500/20 text-orange-500'
                        }`}>
                          {payments[order.id].paymentStatus}
                        </span>
                      </div>
                      
                      {payments[order.id].adminRemark && (
                        <div className="text-xs text-slate-500 dark:text-slate-450 italic mt-1 bg-white dark:bg-brandDark/85 p-2 rounded-lg border border-slate-100 dark:border-white/5">
                          Remarks: "{payments[order.id].adminRemark}"
                        </div>
                      )}

                      {/* Customer Actions (Resubmit) */}
                      {JSON.parse(localStorage.getItem('user_session') || '{}').role !== 'admin' && 
                       payments[order.id].paymentStatus === 'Rejected' && (
                        <button
                          type="button"
                          onClick={() => {
                            setResubmitOrderId(order.id);
                            setShowResubmitModal(true);
                          }}
                          className="mt-2 w-fit bg-zomato-red hover:bg-zomato-hover text-white text-[10px] font-bold py-1.5 px-3.5 rounded-lg shadow-sm cursor-pointer transition-all duration-150"
                        >
                          Resubmit Payment Details
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Payment Screenshot:</span>
                      {payments[order.id].paymentScreenshotUrl ? (
                        <div className="relative group w-24 h-24 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm bg-white">
                          <img
                            src={payments[order.id].paymentScreenshotUrl}
                            alt="Payment Proof"
                            className="w-full h-full object-cover"
                          />
                          <a
                            href={payments[order.id].paymentScreenshotUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] text-white font-bold transition-opacity duration-150 no-underline"
                          >
                            View Large
                          </a>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 italic flex items-center gap-1 py-4">
                          <Image size={12} className="text-slate-350" /> No Screenshot Uploaded
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Admin Moderation Panel */}
                  {JSON.parse(localStorage.getItem('user_session') || '{}').role === 'admin' && 
                   payments[order.id].paymentStatus === 'Pending Verification' && (
                    <div className="flex flex-col gap-2 border-t border-dashed border-slate-200 dark:border-white/5 pt-3">
                      <div className="text-[10px] font-bold text-slate-550 dark:text-slate-350">ADMIN DECISION DESK</div>
                      <div className="flex gap-2 items-center flex-wrap">
                        <input
                          type="text"
                          placeholder="Add verification remarks..."
                          value={adminRemarks[order.id] || ''}
                          onChange={(e) => setAdminRemarks(prev => ({ ...prev, [order.id]: e.target.value }))}
                          className="flex-1 bg-slate-550/5 dark:bg-brandDark border border-slate-200 dark:border-white/10 rounded-lg text-slate-800 dark:text-white px-3 py-1.5 text-xs outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleModeratePayment(order.id, 'approve')}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-all duration-150"
                        >
                          <Check size={13} /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleModeratePayment(order.id, 'reject')}
                          className="bg-red-500 hover:bg-red-600 text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-all duration-150"
                        >
                          <X size={13} /> Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-slate-400 dark:text-slate-550 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2">
          <ShoppingBag size={28} className="text-slate-350" />
          <p className="text-sm font-semibold">No orders found.</p>
          <p className="text-xs text-slate-400">Place an order from the Home page first!</p>
        </div>
      )}

      {/* Resubmit Payment Modal */}
      {showResubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-6 fade-in">
          <form onSubmit={handleResubmitPayment} className="relative bg-white dark:bg-[#243038] border border-slate-100 dark:border-white/5 p-6 rounded-3xl max-w-sm w-full flex flex-col gap-4 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowResubmitModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-450 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white bg-slate-50 dark:bg-brandDark rounded-full border border-slate-200 dark:border-white/10 cursor-pointer transition-colors duration-150"
            >
              <X size={14} />
            </button>
            
            <h3 className="font-display text-[15px] font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-white/5 pb-2.5">
              Resubmit Payment Details
            </h3>

            {/* Scan to Pay QR Code */}
            <div className="flex flex-col items-center justify-center p-3.5 bg-slate-50 dark:bg-brandDark rounded-2xl border border-slate-150 dark:border-white/5 gap-2">
              <div className="text-[10px] text-slate-550 dark:text-slate-300 font-bold">
                Scan to Pay: <span className="text-zomato-red font-black text-xs">₹{orders.find(o => o.id === resubmitOrderId)?.total || 0}</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-150 flex items-center justify-center w-32 h-32">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(
                    `upi://pay?pa=9398685259-ff71-2@ybl&pn=B%20Revanth%20Kumar&am=${orders.find(o => o.id === resubmitOrderId)?.total || 0}&cu=INR&tn=Food%20Order`
                  )}`}
                  alt="UPI Payment QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-[8px] text-slate-400 text-center font-medium">
                B Revanth Kumar (9398685259-ff71-2@ybl)
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-550 dark:text-slate-350 uppercase tracking-wider mb-1">
                UTR Transaction ID (12 Digits) *
              </label>
              <input
                type="text"
                maxLength={12}
                required
                placeholder="Enter 12-digit UTR Number"
                value={resubmitUtr}
                onChange={(e) => setResubmitUtr(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-50 dark:bg-[#243038] border border-slate-200 dark:border-white/10 focus:border-zomato-red rounded-xl text-slate-800 dark:text-white px-3 py-2 text-xs outline-none font-semibold tracking-wider placeholder:tracking-normal"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-550 dark:text-slate-350 uppercase tracking-wider mb-1">
                Screenshot Proof (Optional)
              </label>
              <div className="flex gap-2 items-center">
                <label className="bg-slate-100 hover:bg-slate-200 dark:bg-[#243038] dark:hover:bg-[#2e3e48] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-250 py-1.5 px-3 rounded-xl font-semibold text-[10px] cursor-pointer transition-all duration-150">
                  Choose File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {resubmitScreenshot ? (
                  <div className="flex items-center gap-1">
                    <img
                      src={resubmitScreenshot}
                      alt="Preview"
                      className="w-6 h-6 object-cover rounded border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => setResubmitScreenshot('')}
                      className="text-[8px] text-red-500 font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <span className="text-[8px] text-slate-400">No file chosen</span>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingResubmit}
              className="w-full bg-zomato-red hover:bg-zomato-hover active:bg-zomato-hover/95 text-white font-semibold py-2 px-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer text-center text-xs mt-1"
            >
              {submittingResubmit ? 'Submitting...' : 'Submit verification info'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Orders;
