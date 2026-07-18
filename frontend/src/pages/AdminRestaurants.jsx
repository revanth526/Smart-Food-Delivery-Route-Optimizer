import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Trash2, MapPin, Star, AlertTriangle } from 'lucide-react';

const AdminRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [rating, setRating] = useState('4.0');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/restaurants');
      const mapped = res.data.map(r => ({
        ...r,
        id: r._id // Map _id to id
      }));
      setRestaurants(mapped);
      setError(false);
    } catch (err) {
      console.warn('Backend REST API offline. Using fallback restaurant list.');
      const fallback = [
        { id: '1', name: 'Pizza Hub', address: 'Road No 36, Jubilee Hills', rating: 4.5, latitude: 17.4483, longitude: 78.3915 },
        { id: '2', name: 'Burger King', address: 'Ameerpet Road', rating: 4.2, latitude: 17.4375, longitude: 78.4483 },
        { id: '3', name: 'Noodles Point', address: 'Kavuri Hills, Madhapur', rating: 4.0, latitude: 17.4436, longitude: 78.3792 },
        { id: '4', name: 'KFC', address: 'Ameerpet X Roads', rating: 4.3, latitude: 17.4380, longitude: 78.4490 },
        { id: '5', name: 'Biryani Zone', address: 'Gachibowli Ring Road', rating: 4.7, latitude: 17.4450, longitude: 78.3800 },
        { id: '6', name: 'Chili\'s Grill', address: 'PG Road, Secunderabad', rating: 4.4, latitude: 17.4485, longitude: 78.3920 },
        { id: '7', name: 'Pista House', address: 'Jubilee Hills Checkpost', rating: 4.6, latitude: 17.4480, longitude: 78.3910 }
      ];
      setRestaurants(fallback);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleAddRestaurant = async (e) => {
    e.preventDefault();
    if (!name.trim() || !address.trim() || !latitude || !longitude) {
      alert('Please fill out all fields.');
      return;
    }

    setAdding(true);
    const newRest = {
      name: name.trim(),
      address: address.trim(),
      rating: parseFloat(rating),
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    };

    try {
      await api.post('/api/restaurants', newRest);
      setName('');
      setAddress('');
      setRating('4.0');
      setLatitude('');
      setLongitude('');
      fetchRestaurants();
    } catch (err) {
      console.warn('Backend offline or failed. Simulating local addition.');
      const simulated = {
        ...newRest,
        id: Math.floor(Math.random() * 1000) + 10
      };
      setRestaurants(prev => [...prev, simulated]);
      setName('');
      setAddress('');
      setRating('4.0');
      setLatitude('');
      setLongitude('');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteRestaurant = async (id) => {
    if (!window.confirm('Are you sure you want to delete this restaurant? This will also remove its menu!')) {
      return;
    }

    try {
      await api.delete(`/api/restaurants/${id}`);
      fetchRestaurants();
    } catch (err) {
      console.warn('Backend offline or failed. Simulating local deletion.');
      setRestaurants(prev => prev.filter(r => r.id !== id && r._id !== id));
    }
  };

  return (
    <div className="fade-in max-w-6xl mx-auto px-6 py-10 flex flex-col gap-8">
      
      <div>
        <span className="text-xs text-slate-400 dark:text-slate-550 font-semibold uppercase tracking-wider font-sans">Resource Control</span>
        <h1 className="font-display text-2.5xl font-extrabold text-slate-800 dark:text-white mt-1">
          Manage Food Outlets
        </h1>
      </div>

      {error && (
        <div className="p-3.5 bg-blinkit-light dark:bg-blinkit-green/10 border border-blinkit-yellow/20 dark:border-blinkit-green/20 rounded-xl text-xs text-blinkit-green dark:text-blinkit-yellow leading-relaxed flex items-center gap-2.5 shadow-sm">
          <AlertTriangle size={15} className="text-blinkit-green dark:text-blinkit-yellow flex-shrink-0" />
          <span>Running in Offline Sandbox. Additions and deletions will work locally but will not persist in DB.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left column: Restaurants List */}
        <div className="lg:col-span-2">
          <h2 className="font-display text-lg font-bold text-slate-800 dark:text-white mb-4">
            Seeded Outlets ({restaurants.length})
          </h2>

          {loading ? (
            <div className="text-slate-400 text-xs py-4">Loading list...</div>
          ) : (
            <div className="flex flex-col gap-3">
              {restaurants.map(rest => (
                <div key={rest.id || rest._id} className="bg-white dark:bg-[#243038] border border-slate-150 dark:border-white/5 rounded-2xl p-5 shadow-sm flex justify-between items-center hover:border-zomato-red/35 dark:hover:border-zomato-red/30 hover:shadow-sm transition-all duration-200 transition-colors duration-300">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-white text-sm">
                        {rest.name}
                      </span>
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-zomato-red bg-zomato-light dark:bg-zomato-red/10 px-2 py-0.5 rounded-lg border border-zomato-red/10">
                        <Star size={10} fill="currentColor" /> {rest.rating}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-col gap-1">
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-slate-400" /> {rest.address}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        Coordinates: ({rest.latitude.toFixed(4)}, {rest.longitude.toFixed(4)})
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteRestaurant(rest.id || rest._id)}
                    className="p-2 text-red-500 bg-transparent hover:bg-red-550/10 border border-slate-200 dark:border-white/10 hover:border-red-200 rounded-full flex items-center justify-center cursor-pointer transition-all duration-155"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Add Restaurant Form */}
        <div className="lg:col-span-1 bg-white dark:bg-[#243038] border border-slate-150 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col gap-5 transition-colors duration-300">
          <h3 className="font-display text-[15px] font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-white/5 pb-3">
            Add New Outlet
          </h3>

          <form onSubmit={handleAddRestaurant} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-505 dark:text-slate-300 mb-1.5">Restaurant Name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. KFC Ameerpet" className="w-full bg-slate-50 dark:bg-brandDark border border-slate-200 dark:border-white/10 focus:border-zomato-red focus:ring-4 focus:ring-zomato-red/10 rounded-xl text-slate-800 dark:text-white px-3.5 py-2.5 text-xs outline-none transition-all duration-200" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-505 dark:text-slate-300 mb-1.5">Physical Address</label>
              <input type="text" required value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. Ameerpet Circle" className="w-full bg-slate-50 dark:bg-brandDark border border-slate-200 dark:border-white/10 focus:border-zomato-red focus:ring-4 focus:ring-zomato-red/10 rounded-xl text-slate-800 dark:text-white px-3.5 py-2.5 text-xs outline-none transition-all duration-200" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-505 dark:text-slate-300 mb-1.5">Rating</label>
              <select value={rating} onChange={e => setRating(e.target.value)} className="w-full bg-slate-50 dark:bg-brandDark border border-slate-200 dark:border-white/10 focus:border-zomato-red focus:ring-4 focus:ring-zomato-red/10 rounded-xl text-slate-800 dark:text-white px-3.5 py-2.5 text-xs outline-none transition-all duration-200 cursor-pointer">
                <option value="5.0">5.0 (Excellent)</option>
                <option value="4.5">4.5 (Very Good)</option>
                <option value="4.0">4.0 (Good)</option>
                <option value="3.5">3.5 (Average)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-505 dark:text-slate-300 mb-1.5">Latitude</label>
                <input type="number" step="any" required value={latitude} onChange={e => setLatitude(e.target.value)} placeholder="17.4375" className="w-full bg-slate-50 dark:bg-brandDark border border-slate-200 dark:border-white/10 focus:border-zomato-red focus:ring-4 focus:ring-zomato-red/10 rounded-xl text-slate-800 dark:text-white px-3.5 py-2.5 text-xs outline-none transition-all duration-200" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-505 dark:text-slate-300 mb-1.5">Longitude</label>
                <input type="number" step="any" required value={longitude} onChange={e => setLongitude(e.target.value)} placeholder="78.4483" className="w-full bg-slate-50 dark:bg-brandDark border border-slate-200 dark:border-white/10 focus:border-zomato-red focus:ring-4 focus:ring-zomato-red/10 rounded-xl text-slate-800 dark:text-white px-3.5 py-2.5 text-xs outline-none transition-all duration-200" />
              </div>
            </div>

            <button
              type="submit"
              disabled={adding}
              className="w-full bg-zomato-red hover:bg-zomato-hover active:bg-zomato-hover/95 text-white font-semibold py-2.5 px-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer text-center text-xs mt-3 flex items-center justify-center gap-1.5"
            >
              <Plus size={15} />
              {adding ? 'Adding...' : 'Add Restaurant'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminRestaurants;
