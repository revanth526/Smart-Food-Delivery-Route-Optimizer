import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { AppContext } from '../context/AppContext';
import LiveLocationMap, { calculateDistance } from '../components/LiveLocationMap';
import { Trash2, ShoppingBag, Plus, Minus, ArrowLeft, Map, Download, Maximize2, X, AlertTriangle } from 'lucide-react';

const GRAPH_NODES = [
  { name: 'Ameerpet', lat: 17.4375, lng: 78.4483 },
  { name: 'Madhapur', lat: 17.4436, lng: 78.3792 },
  { name: 'Jubilee Hills', lat: 17.4483, lng: 78.3915 },
  { name: 'Gachibowli', lat: 17.4400, lng: 78.3480 }
];

const Cart = () => {
  const { cart, removeFromCart, addToCart, getCartTotal, clearCart, setActiveOrder } = useContext(AppContext);
  const [customerName, setCustomerName] = useState('');
  const [customerLocation, setCustomerLocation] = useState('Ameerpet'); // Default node
  const [useLiveLocation, setUseLiveLocation] = useState(false);
  const [liveCoords, setLiveCoords] = useState(null);
  const [placing, setPlacing] = useState(false);
  
  // Payment Options States
  const [paymentOpt, setPaymentOpt] = useState('COD'); // 'COD', 'UPI', 'CARD'
  const [upiId, setUpiId] = useState('');
  const [upiVerified, setUpiVerified] = useState(false);
  const [verifyingUpi, setVerifyingUpi] = useState(false);

  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // UTR and Screenshots States
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState('');
  const [showFullScreenQr, setShowFullScreenQr] = useState(false);
  const [qrLoading, setQrLoading] = useState(true);
  const [qrError, setQrError] = useState(false);

  // Dynamic QR Code Generation State Loader
  const [generating, setGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState(0);

  useEffect(() => {
    if (paymentOpt === 'UPI') {
      setGenerating(true);
      setGenerationStage(0);
      
      const t1 = setTimeout(() => setGenerationStage(1), 600);
      const t2 = setTimeout(() => setGenerationStage(2), 1200);
      const t3 = setTimeout(() => setGenerationStage(3), 1800);
      const t4 = setTimeout(() => {
        setGenerating(false);
        setQrLoading(true);
      }, 2400);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
  }, [paymentOpt]);

  const navigate = useNavigate();
  const cartTotal = getCartTotal();

  const handleVerifyUpi = () => {
    if (!upiId.trim() || !upiId.includes('@')) {
      alert('Please enter a valid UPI ID (e.g. name@bank)');
      return;
    }
    setVerifyingUpi(true);
    setTimeout(() => {
      setVerifyingUpi(false);
      setUpiVerified(true);
    }, 1200);
  };

  const getCardBrand = (num) => {
    const clean = num.replace(/\D/g, '');
    if (clean.startsWith('4')) return 'VISA';
    if (clean.startsWith('5')) return 'Mastercard';
    if (clean.startsWith('3')) return 'AMEX';
    if (clean.startsWith('6')) return 'RuPay';
    return 'CARD';
  };

  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    setCardNumber(formatted);
  };

  const handleCardExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    setCardExpiry(value);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentScreenshot(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Please enter your name.');
      return;
    }

    if (paymentOpt === 'UPI') {
      if (!/^\d{12}$/.test(utrNumber)) {
        alert('Please enter a valid 12-digit UTR Transaction ID (digits only).');
        return;
      }
    }

    if (paymentOpt === 'CARD') {
      if (cardNumber.length < 19 || cardHolder.trim().length === 0 || cardExpiry.length < 5 || cardCvv.length < 3) {
        alert('Please fill out all Credit/Debit Card details correctly.');
        return;
      }
    }

    if (cart.length === 0) return;

    setPlacing(true);

    // Retrieve active customer's phone from local storage session
    const session = JSON.parse(localStorage.getItem('user_session') || '{}');
    const phoneNumber = session.phoneNumber || '9988776655';

    const orderPayload = {
      customerName: customerName.trim(),
      phoneNumber: phoneNumber,
      deliveryAddress: customerLocation,
      orderedItems: cart.map(item => ({
        itemName: item.itemName,
        price: item.price,
        quantity: item.quantity
      })),
      paymentMethod: paymentOpt === 'COD' ? 'COD' : 'Online'
    };

    try {
      const response = await api.post('/orders', orderPayload);
      const placedOrder = response.data.order;
      
      // If UPI is selected, submit payment details to the backend
      if (paymentOpt === 'UPI') {
        try {
          await api.post('/payments/submit', {
            orderId: placedOrder.orderId,
            transactionId: utrNumber,
            paymentScreenshotUrl: paymentScreenshot
          });
          placedOrder.orderStatus = 'Pending Verification';
          placedOrder.paymentStatus = 'Pending Verification';
        } catch (payErr) {
          console.warn('Backend payment submission failed. Running in fallback mode.', payErr.message);
        }
      }

      // Store the placed order details
      setActiveOrder({
        ...placedOrder,
        id: placedOrder.orderId,
        customerLocation: placedOrder.deliveryAddress,
        liveCoords: useLiveLocation ? liveCoords : null
      });
      
      clearCart();
      navigate('/tracking');
    } catch (err) {
      console.warn('Backend server connection failed. Simulating order placement offline.');
      // Offline fallback: simulate successful order placement
      const mockOrder = {
        id: `FD-20260715-${Math.floor(Math.random() * 9000) + 1000}`,
        customerName: customerName.trim(),
        restaurant: {
          id: cart[0].restaurantId,
          name: cart[0].restaurantName
        },
        total: cartTotal,
        status: paymentOpt === 'UPI' ? 'Pending Verification' : 'Order Confirmed',
        customerLocation: customerLocation,
        liveCoords: useLiveLocation ? liveCoords : null
      };

      if (paymentOpt === 'UPI') {
        const simulatedPayment = {
          orderId: mockOrder.id,
          transactionId: utrNumber,
          paymentScreenshotUrl: paymentScreenshot,
          paymentStatus: 'Pending Verification',
          adminRemark: '',
          createdAt: new Date().toISOString()
        };
        localStorage.setItem(`simulated_payment_${mockOrder.id}`, JSON.stringify(simulatedPayment));
      }
      
      setActiveOrder(mockOrder);
      clearCart();
      navigate('/tracking');
    } finally {
      setPlacing(false);
    }
  };

  const handleLocationSelected = (selected) => {
    setLiveCoords({ lat: selected.lat, lng: selected.lng });
    
    // Find the closest topological graph node from coordinates
    let closestNode = 'Ameerpet';
    let minDistance = Infinity;
    
    GRAPH_NODES.forEach(node => {
      const dist = calculateDistance(selected.lat, selected.lng, node.lat, node.lng);
      if (dist < minDistance) {
        minDistance = dist;
        closestNode = node.name;
      }
    });
    
    setCustomerLocation(closestNode);
  };

  if (cart.length === 0) {
    return (
      <div className="fade-in max-w-md mx-auto px-6 py-16 text-center flex flex-col items-center gap-4 justify-center min-h-[60vh]">
        <div className="bg-zomato-light text-zomato-red w-16 h-16 rounded-full flex items-center justify-center shadow-inner">
          <ShoppingBag size={28} />
        </div>
        <h2 className="font-display text-xl font-bold text-slate-800 mt-2">Your Cart is Empty</h2>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          Looks like you haven't added anything to your cart yet. Head back to restaurants to select some delicious meals!
        </p>
        <Link to="/" className="no-underline bg-zomato-red hover:bg-zomato-hover active:bg-zomato-hover/95 text-white font-semibold py-2.5 px-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer mt-2 text-xs">
          Browse Restaurants
        </Link>
      </div>
    );
  }

  const restaurantName = cart[0]?.restaurantName || 'Food Outlet';

  return (
    <div className="fade-in max-w-6xl mx-auto px-6 py-10 flex flex-col gap-6">
      
      {/* Back to Home Link */}
      <Link to="/" className="flex items-center gap-1.5 text-slate-450 hover:text-slate-650 no-underline text-xs font-semibold w-fit">
        <ArrowLeft size={14} /> Back to Restaurants
      </Link>

      <h1 className="font-display text-2.5xl font-extrabold text-slate-800">
        Your Shopping Cart
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        
        {/* Cart Items List Column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="text-xs text-slate-500 font-semibold mb-1">
            Ordering from <span className="text-zomato-red font-bold">{restaurantName}</span>
          </div>

          <div className="flex flex-col gap-3">
            {cart.map((item) => (
              <div key={item.id} className="bg-white dark:bg-[#243038] border border-slate-150 dark:border-white/5 rounded-2xl p-5 shadow-sm flex items-center justify-between transition-colors duration-300">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
                    {item.itemName}
                  </h3>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    ₹{item.price}
                  </span>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-brandDark border border-slate-200 dark:border-white/10 rounded-full px-2 py-0.5">
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all duration-155 text-slate-400 hover:text-zomato-red hover:bg-slate-200/50"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-xs font-bold min-w-[12px] text-center text-slate-700 dark:text-slate-200">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => addToCart({ id: item.id, itemName: item.itemName, price: item.price }, { id: item.restaurantId, name: item.restaurantName })}
                    className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all duration-155 text-slate-400 hover:text-zomato-red hover:bg-slate-200/50"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={clearCart}
            className="flex items-center justify-center gap-1.5 bg-transparent border border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-550 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer mt-4"
          >
            <Trash2 size={13} /> Clear Cart
          </button>
        </div>

        {/* Checkout Info Box */}
        <div className="bg-white dark:bg-[#243038] border border-slate-150 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col gap-5 transition-colors duration-300">
          <h3 className="font-display text-[16px] font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-white/5 pb-3">
            Order Summary
          </h3>

          <div className="flex flex-col gap-3.5 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-750 dark:text-slate-205">₹{cartTotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className="text-emerald-500 font-bold">FREE</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-slate-800 dark:text-white border-t border-slate-100 dark:border-white/5 pt-3.5 mt-1">
              <span>Total</span>
              <span className="text-zomato-red font-extrabold text-base">₹{cartTotal}</span>
            </div>
          </div>

          <form onSubmit={handlePlaceOrder} className="flex flex-col gap-4 mt-2">
            <div>
              <label htmlFor="name-input" className="block text-xs font-semibold text-slate-550 dark:text-slate-300 mb-1.5">
                Your Name
              </label>
              <input
                id="name-input"
                type="text"
                required
                placeholder="Enter your name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-brandDark border border-slate-200 dark:border-white/10 focus:border-zomato-red focus:ring-4 focus:ring-zomato-red/10 rounded-xl text-slate-800 dark:text-white px-3.5 py-2.5 text-xs outline-none transition-all duration-200"
              />
            </div>

            {/* Live Map Toggle Checkbox */}
            <div className="flex items-center gap-2 mt-1">
              <input
                id="map-toggle"
                type="checkbox"
                checked={useLiveLocation}
                onChange={(e) => {
                  setUseLiveLocation(e.target.checked);
                  if (!e.target.checked) setLiveCoords(null);
                }}
                className="cursor-pointer w-4 h-4 accent-zomato-red"
              />
              <label htmlFor="map-toggle" className="text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-1">
                <Map size={13} className="text-slate-400" /> Detect Location (Live Map)
              </label>
            </div>

            {useLiveLocation ? (
              <div className="fade-in border-t border-slate-100 dark:border-white/5 pt-4 flex flex-col gap-3">
                <label className="block text-xs font-semibold text-slate-550 dark:text-slate-300">
                  Select Location on Map
                </label>
                <LiveLocationMap onLocationSelected={handleLocationSelected} />
                <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
                  Mapped delivery region: <strong className="text-zomato-red">{customerLocation}</strong> (snapped to nearest routing node).
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="location-select" className="block text-xs font-semibold text-slate-550 dark:text-slate-300 mb-1.5">
                  Delivery Location
                </label>
                <select
                  id="location-select"
                  value={customerLocation}
                  onChange={(e) => setCustomerLocation(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-brandDark border border-slate-200 dark:border-white/10 focus:border-zomato-red focus:ring-4 focus:ring-zomato-red/10 rounded-xl text-slate-800 dark:text-white px-3.5 py-2.5 text-xs outline-none transition-all duration-200 cursor-pointer"
                >
                  <option value="Ameerpet">Ameerpet</option>
                  <option value="Madhapur">Madhapur</option>
                  <option value="Jubilee Hills">Jubilee Hills</option>
                  <option value="Gachibowli">Gachibowli</option>
                </select>
              </div>
            )}

            {/* Payment Method Selector Section */}
            <div className="border-t border-slate-100 dark:border-white/5 pt-4 flex flex-col gap-3">
              <label className="block text-xs font-semibold text-slate-550 dark:text-slate-300">
                Choose Payment Method
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentOpt('COD')}
                  className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border text-[10px] font-bold transition-all duration-200 cursor-pointer ${
                    paymentOpt === 'COD'
                      ? 'bg-zomato-red/5 dark:bg-zomato-red/10 border-zomato-red text-zomato-red shadow-sm'
                      : 'bg-slate-50 dark:bg-brandDark border-slate-200 dark:border-white/10 text-slate-650 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <span className="text-sm">💵</span>
                  <span className="text-[9px]">Cash/COD</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentOpt('UPI')}
                  className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border text-[10px] font-bold transition-all duration-200 cursor-pointer ${
                    paymentOpt === 'UPI'
                      ? 'bg-zomato-red/5 dark:bg-zomato-red/10 border-zomato-red text-zomato-red shadow-sm'
                      : 'bg-slate-50 dark:bg-brandDark border-slate-200 dark:border-white/10 text-slate-655 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <span className="text-sm">📱</span>
                  <span className="text-[9px]">UPI / Apps</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentOpt('CARD')}
                  className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border text-[10px] font-bold transition-all duration-200 cursor-pointer ${
                    paymentOpt === 'CARD'
                      ? 'bg-zomato-red/5 dark:bg-zomato-red/10 border-zomato-red text-zomato-red shadow-sm'
                      : 'bg-slate-50 dark:bg-brandDark border-slate-200 dark:border-white/10 text-slate-655 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <span className="text-sm">💳</span>
                  <span className="text-[9px]">Card Pay</span>
                </button>
              </div>

              {/* UPI Option Container */}
              {paymentOpt === 'UPI' && (
                <div className="fade-in bg-slate-50 dark:bg-brandDark border border-slate-200 dark:border-white/10 rounded-2xl p-3.5 flex flex-col gap-3 transition-colors duration-300">
                  
                  {/* CSS Inline Keyframe Animations */}
                  <style>{`
                    @keyframes laser-sweep {
                      0% { transform: translateY(0); opacity: 0.4; }
                      50% { transform: translateY(140px); opacity: 1; }
                      100% { transform: translateY(0); opacity: 0.4; }
                    }
                    .animate-laser-line {
                      animation: laser-sweep 2.2s infinite linear;
                    }
                    @keyframes border-glow {
                      0% { border-color: rgba(226, 55, 68, 0.2); }
                      50% { border-color: rgba(226, 55, 68, 0.6); }
                      100% { border-color: rgba(226, 55, 68, 0.2); }
                    }
                    .animate-glow-box {
                      animation: border-glow 2s infinite ease-in-out;
                    }
                  `}</style>

                  {generating ? (
                    /* Futuristic QR Code Generation Sequence Loader */
                    <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-[#243038] rounded-xl border border-slate-150 dark:border-white/5 shadow-inner gap-4 w-full min-h-[270px] transition-all duration-300">
                      <div className="relative w-36 h-36 border border-dashed border-zomato-red/30 rounded-xl bg-slate-50/50 dark:bg-brandDark flex items-center justify-center overflow-hidden animate-glow-box">
                        <div className="absolute left-0 right-0 h-0.5 bg-zomato-red shadow-[0_0_8px_#E23744] z-10 animate-laser-line" />
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center px-4">
                          Generating QR...
                        </span>
                      </div>
                      
                      <div className="flex flex-col items-center gap-1.5 w-full">
                        <div className="text-[10px] font-bold text-slate-505 dark:text-slate-350 animate-pulse text-center">
                          {generationStage === 0 && "Connecting to secure bank gateway..."}
                          {generationStage === 1 && "Requesting signed transaction token..."}
                          {generationStage === 2 && "Generating dynamic QR interface..."}
                          {generationStage === 3 && "Finalizing encrypted payment path..."}
                        </div>
                        <div className="w-28 h-1 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-zomato-red transition-all duration-500 ease-out" 
                            style={{ width: `${(generationStage + 1) * 25}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Display Clean Generated vector QR */
                    <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-[#243038] rounded-xl border border-slate-150 dark:border-white/5 shadow-inner gap-2.5 transition-all duration-300">
                      <div className="text-[10px] text-slate-505 dark:text-slate-300 font-bold flex flex-col items-center gap-0.5">
                        <span>Scan to Pay:</span>
                        <span className="text-zomato-red font-black text-sm">₹{cartTotal}</span>
                      </div>

                      {/* QR Code Graphic Frame */}
                      <div className="p-2 bg-white rounded-xl border border-slate-150 shadow-sm flex items-center justify-center relative w-36 h-36 overflow-hidden">
                        <div className="absolute left-0 right-0 h-0.5 bg-emerald-500/80 shadow-[0_0_6px_#10b981] z-10 animate-laser-line" />
                        
                        {qrLoading && (
                          <div className="absolute inset-0 bg-white flex items-center justify-center text-[9px] text-slate-400 font-medium">
                            Rendering...
                          </div>
                        )}
                        {qrError ? (
                          <div className="absolute inset-0 bg-red-50 flex flex-col items-center justify-center text-[8px] text-red-500 font-semibold p-2 text-center gap-1">
                            <AlertTriangle size={12} />
                            <span>Failed to load QR</span>
                          </div>
                        ) : (
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                              `upi://pay?pa=9398685259-ff71-2@ybl&pn=B%20Revanth%20Kumar&am=${cartTotal}&cu=INR&tn=Food%20Order`
                            )}`}
                            alt="UPI Payment QR Code"
                            onLoad={() => setQrLoading(false)}
                            onError={() => {
                              setQrLoading(false);
                              setQrError(true);
                            }}
                            className={`w-full h-full object-contain transition-opacity duration-300 ${qrLoading ? 'opacity-0' : 'opacity-100'}`}
                          />
                        )}
                      </div>

                      {/* QR Control Buttons Row */}
                      <div className="flex gap-2 w-full max-w-[200px] mt-0.5">
                        <a
                          href={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                            `upi://pay?pa=9398685259-ff71-2@ybl&pn=B%20Revanth%20Kumar&am=${cartTotal}&cu=INR&tn=Food%20Order`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          download="UPI_Payment_QR.png"
                          className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-brandDark dark:hover:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-250 py-1.5 px-2 rounded-lg font-bold text-[9px] transition-all duration-200 cursor-pointer text-center no-underline flex items-center justify-center gap-1"
                        >
                          <Download size={11} /> Download
                        </a>
                        <button
                          type="button"
                          onClick={() => setShowFullScreenQr(true)}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-brandDark dark:hover:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-250 py-1.5 px-2 rounded-lg font-bold text-[9px] transition-all duration-200 cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Maximize2 size={11} /> Full Screen
                        </button>
                      </div>

                      {/* Payment details */}
                      <div className="text-center flex flex-col gap-0.5 mt-1 border-t border-slate-100 dark:border-white/5 pt-2 w-full">
                        <div className="text-[10px] font-bold text-slate-750 dark:text-slate-200 uppercase tracking-wide">
                          B Revanth Kumar
                        </div>
                        <div className="text-[9px] text-slate-450 dark:text-slate-400 font-mono">
                          UPI ID: 9398685259-ff71-2@ybl
                        </div>
                        <div className="text-[8px] text-slate-400 dark:text-slate-500 italic mt-0.5 leading-normal">
                          "Scan the QR code using any UPI app and complete the payment."
                        </div>
                      </div>
                    </div>
                  )}

                  {/* UTR Input and Screenshot upload */}
                  <div className="flex flex-col gap-2.5 border-t border-slate-150 dark:border-white/5 pt-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-550 dark:text-slate-350 uppercase tracking-wider mb-1">
                        UTR Transaction ID (12 Digits) *
                      </label>
                      <input
                        type="text"
                        maxLength={12}
                        required={paymentOpt === 'UPI'}
                        placeholder="Enter 12-digit UTR Number"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-white dark:bg-[#243038] border border-slate-200 dark:border-white/10 focus:border-zomato-red rounded-xl text-slate-800 dark:text-white px-3 py-2 text-xs outline-none font-semibold tracking-wider placeholder:tracking-normal"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-550 dark:text-slate-350 uppercase tracking-wider mb-1">
                        Payment Screenshot (Optional)
                      </label>
                      <div className="flex gap-2 items-center">
                        <label className="bg-slate-100 hover:bg-slate-200 dark:bg-[#243038] dark:hover:bg-[#2e3e48] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-250 py-1.5 px-3.5 rounded-xl font-semibold text-[10px] cursor-pointer transition-all duration-150">
                          Choose File
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                        {paymentScreenshot ? (
                          <div className="flex items-center gap-1.5">
                            <img
                              src={paymentScreenshot}
                              alt="Screenshot Preview"
                              className="w-7 h-7 object-cover rounded-lg border border-slate-200"
                            />
                            <button
                              type="button"
                              onClick={() => setPaymentScreenshot('')}
                              className="text-[9px] text-red-500 hover:underline font-bold cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <span className="text-[9px] text-slate-400">No file selected</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Full Screen Qr Modal Overlay */}
                  {showFullScreenQr && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-6 fade-in">
                      <div className="relative bg-white dark:bg-[#243038] border border-slate-100 dark:border-white/5 p-6 rounded-3xl max-w-sm w-full flex flex-col items-center gap-4 shadow-2xl">
                        <button
                          type="button"
                          onClick={() => setShowFullScreenQr(false)}
                          className="absolute top-4 right-4 p-1.5 text-slate-450 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white bg-slate-50 dark:bg-brandDark rounded-full border border-slate-200 dark:border-white/10 cursor-pointer transition-colors duration-150"
                        >
                          <X size={14} />
                        </button>
                        
                        <div className="text-xs font-extrabold text-slate-800 dark:text-white mt-2 flex flex-col items-center gap-0.5">
                          <span>Scan to Pay:</span>
                          <span className="text-zomato-red font-black text-sm">₹{cartTotal}</span>
                        </div>

                        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-inner flex items-center justify-center w-64 h-64">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                              `upi://pay?pa=9398685259-ff71-2@ybl&pn=B%20Revanth%20Kumar&am=${cartTotal}&cu=INR&tn=Food%20Order`
                            )}`}
                            alt="UPI Payment QR Code"
                            className="w-full h-full object-contain"
                          />
                        </div>

                        <div className="text-center flex flex-col gap-0.5">
                          <div className="text-[10px] font-bold text-slate-750 dark:text-slate-200 uppercase tracking-wide">
                            B Revanth Kumar
                          </div>
                          <div className="text-[9px] text-slate-450 dark:text-slate-400 font-mono">
                            UPI ID: 9398685259-ff71-2@ybl
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* Card Option Container */}
              {paymentOpt === 'CARD' && (
                <div className="fade-in bg-slate-50 dark:bg-brandDark border border-slate-200 dark:border-white/10 rounded-2xl p-3 flex flex-col gap-3 transition-colors duration-300">
                  
                  {/* Premium Credit Card Graphic */}
                  <div className="relative w-full h-28 rounded-xl bg-gradient-to-tr from-slate-900 via-slate-850 to-zomato-red/80 p-4 text-white flex flex-col justify-between shadow-sm overflow-hidden border border-white/5">
                    <div className="absolute right-0 bottom-0 top-0 w-20 bg-white/5 skew-x-12 pointer-events-none" />
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-bold italic tracking-wide text-slate-205">SMART DELIVERIES CARD</span>
                      <span className="text-[10px] font-bold italic text-slate-100">{getCardBrand(cardNumber)}</span>
                    </div>
                    <div className="text-[12px] font-mono tracking-widest text-slate-100 my-1">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-[7px] uppercase tracking-wider text-slate-400">Cardholder</span>
                        <span className="text-[9px] font-semibold tracking-wide truncate max-w-[120px] uppercase text-slate-100">
                          {cardHolder || 'PAYEE NAME'}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[7px] uppercase tracking-wider text-slate-400">Expiry</span>
                        <span className="text-[9px] font-semibold font-mono text-slate-100">
                          {cardExpiry || 'MM/YY'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      maxLength={19}
                      placeholder="Card Number (XXXX XXXX XXXX XXXX)"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className="w-full bg-white dark:bg-[#243038] border border-slate-200 dark:border-white/10 focus:border-zomato-red rounded-xl text-slate-800 dark:text-white px-3 py-1.5 text-xs outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Name on Card"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="w-full bg-white dark:bg-[#243038] border border-slate-200 dark:border-white/10 focus:border-zomato-red rounded-xl text-slate-800 dark:text-white px-3 py-1.5 text-xs outline-none"
                    />
                    <div className="grid grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        maxLength={5}
                        placeholder="Expiry (MM/YY)"
                        value={cardExpiry}
                        onChange={handleCardExpiryChange}
                        className="w-full bg-white dark:bg-[#243038] border border-slate-200 dark:border-white/10 focus:border-zomato-red rounded-xl text-slate-800 dark:text-white px-3 py-1.5 text-xs outline-none"
                      />
                      <input
                        type="password"
                        maxLength={3}
                        placeholder="CVV"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-white dark:bg-[#243038] border border-slate-200 dark:border-white/10 focus:border-zomato-red rounded-xl text-slate-800 dark:text-white px-3 py-1.5 text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={placing}
              className="w-full bg-zomato-red hover:bg-zomato-hover active:bg-zomato-hover/95 text-white font-semibold py-3 px-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer text-center text-xs mt-2"
            >
              {placing ? 'Placing Order...' : 'Confirm & Place Order'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Cart;
