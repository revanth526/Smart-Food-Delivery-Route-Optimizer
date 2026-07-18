import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Trash2, Tag, AlertTriangle } from 'lucide-react';

const AdminMenus = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestId, setSelectedRestId] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(false);

  // Form state
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');

  const FALLBACK_MENUS = {
    '1': [
      { id: '101', itemName: 'Veg Pizza', price: 250 },
      { id: '102', itemName: 'Cheese Pizza', price: 300 },
      { id: '103', itemName: 'Garlic Bread', price: 120 }
    ],
    '2': [
      { id: '201', itemName: 'Whopper Burger', price: 190 },
      { id: '202', itemName: 'French Fries', price: 90 },
      { id: '203', itemName: 'Onion Rings', price: 110 }
    ],
    '3': [
      { id: '301', itemName: 'Hakka Noodles', price: 150 },
      { id: '302', itemName: 'Schezwan Noodles', price: 170 },
      { id: '303', itemName: 'Spring Rolls', price: 100 }
    ],
    '4': [
      { id: '401', itemName: 'Zinger Burger', price: 180 },
      { id: '402', itemName: 'Hot Wings (x4)', price: 150 },
      { id: '403', itemName: 'Popcorn Chicken', price: 160 }
    ],
    '5': [
      { id: '501', itemName: 'Chicken Biryani', price: 320 },
      { id: '502', itemName: 'Mutton Biryani', price: 380 },
      { id: '503', itemName: 'Double Ka Meetha', price: 90 }
    ],
    '6': [
      { id: '601', itemName: 'Margherita Pizza', price: 280 },
      { id: '602', itemName: 'Crispy Chicken Crispers', price: 310 },
      { id: '603', itemName: 'Chocolate Lava Cake', price: 150 }
    ],
    '7': [
      { id: '701', itemName: 'Special Haleem', price: 240 },
      { id: '702', itemName: 'Zafrani Chai', price: 40 },
      { id: '703', itemName: 'Kheer', price: 80 }
    ]
  };

  const fetchRestaurants = async () => {
    try {
      const res = await api.get('/api/restaurants');
      const mapped = res.data.map(r => ({
        ...r,
        id: r._id // Map _id to id
      }));
      setRestaurants(mapped);
      if (mapped.length > 0) {
        setSelectedRestId(mapped[0].id);
      }
      setError(false);
    } catch (err) {
      console.warn('Backend offline. Mocking restaurants.');
      const fallback = [
        { id: '1', name: 'Pizza Hub' },
        { id: '2', name: 'Burger King' },
        { id: '3', name: 'Noodles Point' }
      ];
      setRestaurants(fallback);
      setSelectedRestId('1');
      setError(true);
    }
  };

  const fetchMenu = async (restId) => {
    if (!restId) return;
    setLoadingItems(true);
    try {
      const res = await api.get(`/api/menu/${restId}`);
      const mapped = res.data.map(item => ({
        ...item,
        id: item._id // Map _id to id
      }));
      setMenuItems(mapped);
    } catch (err) {
      console.warn('Backend offline. Loading local menu simulation.');
      setMenuItems(FALLBACK_MENUS[restId] || []);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  useEffect(() => {
    fetchMenu(selectedRestId);
  }, [selectedRestId]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!itemName.trim() || !price || !selectedRestId) {
      alert('Please fill out all fields.');
      return;
    }

    setAdding(true);
    const payload = {
      restaurantId: selectedRestId,
      itemName: itemName.trim(),
      price: parseFloat(price)
    };

    try {
      await api.post('/api/menu', payload);
      setItemName('');
      setPrice('');
      fetchMenu(selectedRestId);
    } catch (err) {
      console.warn('Backend offline. Simulating menu add locally.');
      const simulated = {
        id: Math.floor(Math.random() * 1000) + 1000,
        itemName: itemName.trim(),
        price: parseFloat(price)
      };
      setMenuItems(prev => [...prev, simulated]);
      setItemName('');
      setPrice('');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Delete this menu item?')) {
      return;
    }

    try {
      await api.delete(`/api/menu/${itemId}`);
      fetchMenu(selectedRestId);
    } catch (err) {
      console.warn('Backend offline. Simulating delete locally.');
      setMenuItems(prev => prev.filter(item => item.id !== itemId && item._id !== itemId));
    }
  };

  return (
    <div className="fade-in max-w-6xl mx-auto px-6 py-10 flex flex-col gap-8">
      
      <div>
        <span className="text-xs text-slate-400 dark:text-slate-550 font-semibold uppercase tracking-wider font-sans">Resource Control</span>
        <h1 className="font-display text-2.5xl font-extrabold text-slate-800 dark:text-white mt-1">
          Manage Restaurant Menus
        </h1>
      </div>

      {error && (
        <div className="p-3.5 bg-blinkit-light dark:bg-blinkit-green/10 border border-blinkit-yellow/20 dark:border-blinkit-green/20 rounded-xl text-xs text-blinkit-green dark:text-blinkit-yellow leading-relaxed flex items-center gap-2.5 shadow-sm">
          <AlertTriangle size={15} className="text-blinkit-green dark:text-blinkit-yellow flex-shrink-0" />
          <span>Running in Offline Sandbox. Menu changes are persisted in browser memory.</span>
        </div>
      )}

      {/* Select active restaurant */}
      <div className="bg-white dark:bg-[#243038] border border-slate-150 dark:border-white/5 rounded-2xl p-5 shadow-sm flex gap-3.5 items-center flex-wrap transition-colors duration-300">
        <label className="text-xs font-bold text-slate-705 dark:text-slate-250">Select Restaurant:</label>
        <select
          value={selectedRestId}
          onChange={e => setSelectedRestId(e.target.value)}
          className="min-w-[240px] bg-slate-50 dark:bg-brandDark border border-slate-200 dark:border-white/10 focus:border-zomato-red focus:ring-4 focus:ring-zomato-red/10 rounded-xl text-slate-800 dark:text-white px-3.5 py-2 text-xs outline-none transition-all duration-200 cursor-pointer"
        >
          {restaurants.map(r => (
            <option key={r.id || r._id} value={r.id || r._id}>{r.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left column: Menu Items List */}
        <div className="lg:col-span-2">
          <h2 className="font-display text-lg font-bold text-slate-800 dark:text-white mb-4">
            Dishes Served ({menuItems.length})
          </h2>

          {loadingItems ? (
            <div className="text-slate-400 text-xs py-4">Loading dishes...</div>
          ) : (
            <div className="flex flex-col gap-3">
              {menuItems.map(item => (
                <div key={item.id || item._id} className="bg-white dark:bg-[#243038] border border-slate-150 dark:border-white/5 rounded-2xl p-5 shadow-sm flex justify-between items-center hover:border-zomato-red/35 dark:hover:border-zomato-red/30 hover:shadow-sm transition-all duration-200 transition-colors duration-300">
                  <div className="flex items-center gap-3">
                    <div className="text-zomato-red bg-zomato-light dark:bg-zomato-red/10 w-8 h-8 rounded-lg flex items-center justify-center border border-zomato-red/10">
                      <Tag size={14} />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 dark:text-white text-sm block">
                        {item.itemName}
                      </span>
                      <span className="text-[13px] font-extrabold text-zomato-red">
                        ₹{item.price}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteItem(item.id || item._id)}
                    className="p-2 text-red-500 bg-transparent hover:bg-red-50 dark:hover:bg-red-950/20 border border-slate-200 dark:border-white/10 hover:border-red-200 rounded-full flex items-center justify-center cursor-pointer transition-all duration-155"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              
              {menuItems.length === 0 && (
                <div className="text-center py-10 text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center">
                  <p className="text-xs font-medium">No items listed for this restaurant yet.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column: Add Item Form */}
        <div className="lg:col-span-1 bg-white dark:bg-[#243038] border border-slate-150 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col gap-5 transition-colors duration-300">
          <h3 className="font-display text-[15px] font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-white/5 pb-3">
            Add Dish to Menu
          </h3>

          <form onSubmit={handleAddItem} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-550 dark:text-slate-300 mb-1.5">Dish / Item Name</label>
              <input type="text" required value={itemName} onChange={e => setItemName(e.target.value)} placeholder="e.g. Pepperoni Pizza" className="w-full bg-slate-50 dark:bg-brandDark border border-slate-200 dark:border-white/10 focus:border-zomato-red focus:ring-4 focus:ring-zomato-red/10 rounded-xl text-slate-800 dark:text-white px-3.5 py-2.5 text-xs outline-none transition-all duration-200" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-550 dark:text-slate-300 mb-1.5">Price (₹)</label>
              <input type="number" required value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 350" className="w-full bg-slate-50 dark:bg-brandDark border border-slate-200 dark:border-white/10 focus:border-zomato-red focus:ring-4 focus:ring-zomato-red/10 rounded-xl text-slate-800 dark:text-white px-3.5 py-2.5 text-xs outline-none transition-all duration-200" />
            </div>

            <button
              type="submit"
              disabled={adding}
              className="w-full bg-zomato-red hover:bg-zomato-hover active:bg-zomato-hover/95 text-white font-semibold py-2.5 px-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer text-center text-xs mt-3 flex items-center justify-center gap-1.5"
            >
              <Plus size={15} />
              {adding ? 'Adding...' : 'Add Item'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminMenus;
