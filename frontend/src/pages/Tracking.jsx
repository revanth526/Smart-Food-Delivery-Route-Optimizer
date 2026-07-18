import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AppContext } from '../context/AppContext';
import RouteMap from '../components/RouteMap';
import { ShieldCheck, Truck, Clock, Compass, MapPin, ArrowRight, X } from 'lucide-react';
import supabase from '../services/supabaseClient';

const STATUS_STEPS = [
  { label: 'Order Confirmed', description: 'Restaurant accepted order', icon: '✅' },
  { label: 'Preparing Food', description: 'Chef is preparing your meal', icon: '🍳' },
  { label: 'Delivery Partner Picked', description: 'Rider picked up package', icon: '🛵' },
  { label: 'On the Way', description: 'Rider is driving to you', icon: '🛣️' },
  { label: 'Delivered', description: 'Food delivered successfully', icon: '🎁' }
];

const Tracking = () => {
  const { activeOrder, setActiveOrder } = useContext(AppContext);
  const [delivery, setDelivery] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Payment Receipt State variables
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // 1. Poll the order status and fetch delivery info
  useEffect(() => {
    if (!activeOrder) return;

    const fetchStatusAndDelivery = async () => {
      try {
        const orderRes = await api.get(`/orders/${activeOrder.orderId || activeOrder.id}`);
        const updatedOrder = orderRes.data.order;
        
        setActiveOrder({
          ...updatedOrder,
          id: updatedOrder.orderId,
          status: updatedOrder.orderStatus,
          customerLocation: activeOrder.customerLocation
        });

        const index = STATUS_STEPS.findIndex(step => step.label === updatedOrder.orderStatus);
        if (index > -1) {
          setCurrentStepIndex(index);
        }

        const deliveryRes = await api.get(`/api/delivery/order/${updatedOrder.orderId}`);
        setDelivery(deliveryRes.data);

        // Fetch corresponding payment information
        try {
          const payRes = await api.get(`/payments/order/${updatedOrder.orderId}`);
          if (payRes.data.payment) {
            setPaymentDetails(payRes.data.payment);
          }
        } catch (payErr) {
          const local = localStorage.getItem(`simulated_payment_${updatedOrder.orderId}`);
          if (local) {
            setPaymentDetails(JSON.parse(local));
          }
        }
      } catch (err) {
        console.warn('Backend server connection failed. Running simulated tracking offline.');
        const index = STATUS_STEPS.findIndex(step => step.label === activeOrder.status);
        if (index > -1) {
          setCurrentStepIndex(index);
        }

        setDelivery({
          riderName: 'Rider Amit',
          routeDistance: 4.5,
          estimatedTime: 15
        });

        // Load offline simulated payment details
        const local = localStorage.getItem(`simulated_payment_${activeOrder.id}`);
        if (local) {
          setPaymentDetails(JSON.parse(local));
        }
      }
    };

    fetchStatusAndDelivery();
    const interval = setInterval(fetchStatusAndDelivery, 4000); // Poll every 4 seconds

    return () => clearInterval(interval);
  }, [activeOrder, setActiveOrder]);

  // Supabase Real-time broadcast listener
  useEffect(() => {
    if (!activeOrder || !supabase) return;

    const orderId = activeOrder.orderId || activeOrder.id;
    console.log(`🔌 Subscribing to Supabase Real-time channel for Order #${orderId}`);
    
    const channel = supabase.channel(`order-tracker:${orderId}`);
    
    channel.on('broadcast', { event: 'status-update' }, (response) => {
      const payload = response.payload;
      console.log('📡 Realtime update received via Supabase:', payload);
      
      if (payload.orderStatus) {
        // Instantly update stepper index
        const index = STATUS_STEPS.findIndex(step => step.label === payload.orderStatus);
        if (index > -1) {
          setCurrentStepIndex(index);
        }
        
        // Update order status in context state
        setActiveOrder(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            status: payload.orderStatus
          };
        });
      }
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✓ Successfully joined live broadcast channel.');
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeOrder, setActiveOrder]);

  // 2. Fetch Dijkstra route path from backend for the map
  useEffect(() => {
    if (!activeOrder) return;

    const fetchRoutePath = async () => {
      try {
        const payload = {
          restaurantId: activeOrder.orderedItems && activeOrder.orderedItems.length > 0 ? activeOrder.restaurantId : null,
          customerLocation: activeOrder.customerLocation
        };
        const res = await api.post('/api/route/calculate', payload);
        setRoutePath(res.data.path);
      } catch (err) {
        console.warn('Backend routing calculate failed. Simulating path offline.');
        const mockPath = ['Pizza Hub', 'Road B', 'Road D', activeOrder.customerLocation];
        setRoutePath(mockPath);
      }
    };

    fetchRoutePath();
  }, [activeOrder]);

  if (!activeOrder) {
    return (
      <div className="fade-in max-w-lg mx-auto px-6 py-16 text-center flex flex-col items-center gap-4 justify-center min-h-[60vh]">
        <div className="bg-slate-100 dark:bg-[#243038] text-slate-450 w-16 h-16 rounded-full flex items-center justify-center shadow-inner border dark:border-white/5 transition-colors duration-300">
          <Truck size={28} />
        </div>
        <h2 className="font-display text-xl font-bold text-slate-800 dark:text-white mt-2">No Active Order</h2>
        <p className="text-xs text-slate-450 max-w-xs leading-relaxed">
          You don't have an active order being tracked right now. Place a new order or select one from the history page!
        </p>
        <div className="flex gap-3 mt-2">
          <Link to="/" className="no-underline bg-zomato-red hover:bg-zomato-hover active:bg-zomato-hover/95 text-white font-semibold py-2 px-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer text-xs">
            Browse Food
          </Link>
          <Link to="/orders" className="no-underline bg-white dark:bg-brandDark border border-slate-200 dark:border-white/10 hover:border-slate-350 dark:hover:border-white/20 text-slate-600 dark:text-slate-300 font-semibold py-2 px-5 rounded-xl transition-all duration-200 cursor-pointer text-xs">
            View History
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in max-w-6xl mx-auto px-6 py-10 flex flex-col gap-6">
      
      {/* Header bar */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-150 dark:border-white/5 pb-5">
        <div>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider font-sans">Live Delivery Tracking</span>
          <h1 className="font-display text-2.5xl font-extrabold text-slate-800 dark:text-white mt-1">
            Order #{activeOrder.id}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {paymentDetails && (
            <button
              onClick={() => setShowReceiptModal(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-sm shadow-emerald-500/10 border-0"
            >
              💳 View Receipt
            </button>
          )}

          <Link to="/orders" className="no-underline bg-zomato-light/40 hover:bg-zomato-light/75 dark:bg-zomato-red/10 dark:border-zomato-red/30 text-zomato-red py-2 px-4 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1">
            Manage Status <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left column: Status, Rider, ETA Info */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Live Progress Card */}
          <div className="bg-white dark:bg-[#243038] border border-slate-150 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col gap-5 transition-colors duration-300">
            <h3 className="font-display text-[15px] font-bold text-slate-800 dark:text-white">Delivery Progress</h3>

            {/* Stepper Visualizer */}
            <div className="flex flex-col gap-6 relative">
              {/* Vertical connecting line */}
              <div className="absolute left-[17px] top-4 bottom-4 w-0.5 bg-slate-105 dark:bg-slate-700 z-10" />
              {/* Highlighted vertical line */}
              <div 
                className="absolute left-[17px] top-4 w-0.5 bg-zomato-red z-20 transition-all duration-500" 
                style={{ height: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 90}%` }}
              />

              {STATUS_STEPS.map((step, idx) => {
                const isCompleted = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div key={idx} className="flex gap-4 items-start z-35 relative">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] transition-all duration-200 border-2 ${
                      isCompleted 
                        ? 'bg-zomato-red text-white border-zomato-red shadow-sm shadow-zomato-red/20' 
                        : 'bg-slate-50 dark:bg-brandDark text-slate-400 border-slate-200 dark:border-white/10'
                    } ${isCurrent ? 'ring-4 ring-zomato-light dark:ring-zomato-red/20 border-zomato-red' : ''}`}>
                      {step.icon}
                    </div>
                    <div className="flex flex-col gap-0.5 pt-1.5">
                      <span className={`text-xs font-bold transition-all duration-200 ${
                        isCompleted ? 'text-slate-800 dark:text-slate-100' : 'text-slate-450 dark:text-slate-500'
                      } ${isCurrent ? 'text-zomato-red font-extrabold' : ''}`}>
                        {step.label}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-550">
                        {step.description}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery Rider ETA card */}
          {delivery && (
            <div className="bg-gradient-to-br from-zomato-light/20 to-blinkit-light/20 dark:from-zomato-red/5 dark:to-blinkit-yellow/5 border border-slate-150 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col gap-4 transition-colors duration-300">
              <h3 className="font-display text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Rider Information
              </h3>
              
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-zomato-light dark:bg-zomato-red/10 border border-zomato-red/20 flex items-center justify-center text-xl text-zomato-red shadow-sm shadow-zomato-red/5">
                  🏍️
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {delivery.riderName}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                    Delivery Partner
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-white/5 pt-4 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-slate-400" />
                  <div>
                    <span className="block text-[10px] text-slate-400 dark:text-slate-500">ETA</span>
                    <strong className="text-zomato-red">{delivery.estimatedTime} mins</strong>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Compass size={15} className="text-slate-400" />
                  <div>
                    <span className="block text-[10px] text-slate-400 dark:text-slate-500">Distance</span>
                    <strong className="text-slate-700 dark:text-slate-300">{delivery.routeDistance} km</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Dijkstra Route Map Visualizer */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white dark:bg-[#243038] border border-slate-150 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm transition-colors duration-300">
            <RouteMap path={routePath} />
          </div>
          
          <div className="relative overflow-hidden bg-white dark:bg-[#243038] border border-slate-150 dark:border-white/5 rounded-2xl pl-5 pr-4.5 py-4 flex items-center gap-2 shadow-sm text-xs font-semibold text-slate-650 dark:text-slate-300 transition-colors duration-300">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-zomato-red" />
            <MapPin size={16} className="text-zomato-red flex-shrink-0" />
            <span className="truncate">
              Optimized Path: {routePath.length > 0 ? routePath.join(' ➔ ') : 'Calculating shortest route...'}
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Payment Receipt Modal (super.money design) */}
      {showReceiptModal && paymentDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto fade-in">
          <div className="relative bg-gradient-to-b from-[#4d48ef] to-[#3a35d9] w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border-[6px] border-slate-900 dark:border-slate-800 flex flex-col items-center overflow-hidden my-8">
            
            {/* Phone Speaker/Camera notch */}
            <div className="w-20 h-4 bg-slate-900 absolute top-0 rounded-b-xl" />

            {/* Header / Dismiss */}
            <div className="w-full flex justify-between items-center mt-2 text-white/90">
              <span className="text-[10px] font-bold tracking-widest uppercase opacity-75">Transaction Details</span>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-white/90 border-0 bg-transparent flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {/* Receipt Card Body */}
            <div className="relative bg-white w-full rounded-2xl p-5 mt-6 mb-4 flex flex-col gap-4 shadow-xl pb-7">
              
              {/* Receipt Header logo & check circle */}
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <div className="text-sm font-black text-slate-905 tracking-tight flex items-center gap-0.5">
                    <span className="bg-[#4d48ef] text-white px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase">s</span>
                    <span className="font-sans font-black tracking-tight text-xs text-slate-900">super.<span className="text-[#4d48ef]">money</span></span>
                  </div>
                </div>
                
                {paymentDetails.paymentStatus === 'Paid' ? (
                  <div className="bg-emerald-500 rounded-full w-9 h-9 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/30">
                    ✓
                  </div>
                ) : paymentDetails.paymentStatus === 'Rejected' ? (
                  <div className="bg-red-500 rounded-full w-9 h-9 flex items-center justify-center text-white font-bold shadow-md shadow-red-500/30">
                    ✗
                  </div>
                ) : (
                  <div className="bg-orange-500 rounded-full w-9 h-9 flex items-center justify-center text-white font-bold shadow-md shadow-orange-500/30 animate-pulse text-xs">
                    ⏳
                  </div>
                )}
              </div>

              {/* Status & Amount */}
              <div className="flex flex-col gap-0.5 text-left">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {paymentDetails.paymentStatus === 'Paid' 
                    ? 'Payment Successful' 
                    : paymentDetails.paymentStatus === 'Rejected' 
                    ? 'Payment Rejected' 
                    : 'Verification Pending'}
                </span>
                <span className="text-3xl font-black text-slate-900 tracking-tight flex items-baseline">
                  ₹{activeOrder.total || paymentDetails.amount || 0}
                </span>
                <span className="text-[9px] text-slate-450 font-medium">
                  {new Date(paymentDetails.createdAt || activeOrder.createdAt || Date.now()).toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </span>
              </div>

              <div className="border-t border-dashed border-slate-200 my-0.5" />

              {/* Payee Info */}
              <div className="flex flex-col gap-1 text-left">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">To</span>
                <div className="flex justify-between items-center">
                  <div>
                    <strong className="block text-xs text-slate-800">B Revanth Kumar</strong>
                    <span className="text-[9px] text-slate-450 font-mono">9398685259-ff71-2@ybl</span>
                  </div>
                  <span className="text-[10px] bg-slate-105 text-slate-600 px-2 py-0.5 rounded-md font-semibold tracking-wide">YBL</span>
                </div>
                <div className="text-[9px] text-slate-400 italic mt-0.5 flex items-center gap-1">
                  🏛️ South Indian Bank
                </div>
              </div>

              <div className="border-t border-dashed border-slate-200 my-0.5" />

              {/* Payer Info */}
              <div className="flex flex-col gap-1 text-left">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">From</span>
                <div>
                  <strong className="block text-xs text-slate-800">{activeOrder.customerName || 'Customer'}</strong>
                  <span className="text-[9px] text-slate-450 font-mono">UPI ID: user@okhdfcbank</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-200 my-0.5" />

              {/* UPI Reference */}
              <div className="flex flex-col gap-1 text-left">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">UPI reference ID</span>
                <span className="text-xs text-slate-850 font-mono tracking-wider font-semibold text-slate-900">
                  {paymentDetails.transactionId}
                </span>
              </div>

              {/* Jagged border bottom edge */}
              <div className="absolute left-0 right-0 -bottom-2.5 h-3 overflow-hidden">
                <svg className="w-full h-full fill-white" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <polygon points="0,0 2,10 4,0 6,10 8,0 10,10 12,0 14,10 16,0 18,10 20,0 22,10 24,0 26,10 28,0 30,10 32,0 34,10 36,0 38,10 40,0 42,10 44,0 46,10 48,0 50,10 52,0 54,10 56,0 58,10 60,0 62,10 64,0 66,10 68,0 70,10 72,0 74,10 76,0 78,10 80,0 82,10 84,0 86,10 88,0 90,10 92,0 94,10 96,0 98,10 100,0 100,10 0,10" />
                </svg>
              </div>

            </div>

            {/* Purple backdrop bottom message */}
            <div className="text-center text-[10px] text-white/95 leading-normal max-w-xs mt-3 flex flex-col items-center gap-1.5 px-4 font-medium italic">
              <span>"Sent you payment via UPI using super.money. Let me know when you get it"</span>
              <span className="text-[8px] tracking-wide text-white/50 lowercase font-mono">link.super.money/t8aUWfJLyMb</span>
            </div>

            {/* Assured Cashback Graphic bar */}
            <div className="w-full bg-[#342ecc] border border-white/10 rounded-2xl p-2.5 mt-5 flex items-center justify-between text-white gap-2">
              <span className="text-lg">💵</span>
              <span className="text-[8px] font-bold uppercase tracking-wider flex-1 text-left text-white/90">
                Get assured cashback on UPI spends
              </span>
              <span className="text-[8px] bg-yellow-400 text-slate-900 px-2 py-0.5 rounded-full font-bold">
                CLAIM
              </span>
            </div>

            {/* Back button */}
            <button
              type="button"
              onClick={() => setShowReceiptModal(false)}
              className="mt-6 w-full bg-white hover:bg-slate-100 text-[#4d48ef] font-bold py-2.5 rounded-2xl shadow-md transition-all duration-150 cursor-pointer text-xs uppercase tracking-wider border-0"
            >
              Close Receipt
            </button>

          </div>
        </div>
      )}
    </div>
  );
};

export default Tracking;
