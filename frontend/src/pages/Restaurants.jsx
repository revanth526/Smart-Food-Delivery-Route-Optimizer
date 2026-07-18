import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { AppContext } from '../context/AppContext';
import { Star, MapPin, ArrowLeft, Plus, ShoppingBag } from 'lucide-react';
import { FALLBACK_RESTAURANTS, FALLBACK_MENUS } from '../fallbackRestaurants';

// Fallback data is imported from '../fallbackRestaurants'

const Restaurants = () => {
  const { id } = useParams();
  const { addToCart, getCartCount } = useContext(AppContext);
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchRestaurantAndMenu = async () => {
      try {
        setLoading(true);
        // Fetch restaurant details
        const restResponse = await api.get(`/api/restaurants/${id}`);
        setRestaurant({
          ...restResponse.data,
          id: restResponse.data._id
        });

        // Fetch menu details
        const menuResponse = await api.get(`/api/menu/${id}`);
        setMenu(menuResponse.data.map(item => ({
          ...item,
          id: item._id
        })));
        setError(false);
      } catch (err) {
        console.warn('Backend REST API unavailable. Using fallback menu data.');
        const fallbackRest = FALLBACK_RESTAURANTS.find(r => r.id === id) || FALLBACK_RESTAURANTS[0];
        setRestaurant(fallbackRest);
        setMenu(FALLBACK_MENUS[id] || FALLBACK_MENUS['1']);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantAndMenu();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh] text-slate-400 text-sm">
        Loading restaurant details and menu...
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center py-16 text-slate-505 text-sm">
        Restaurant not found. <Link to="/" className="underline text-zomato-red">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="fade-in max-w-4xl mx-auto px-6 py-10 flex flex-col gap-6">
      
      {/* Back Link */}
      <Link to="/" className="flex items-center gap-1.5 text-slate-450 hover:text-slate-650 dark:text-slate-400 dark:hover:text-slate-200 no-underline text-xs font-semibold w-fit">
        <ArrowLeft size={14} /> Back to Restaurants
      </Link>

      {/* Restaurant Header Card */}
      <div className="bg-gradient-to-br from-zomato-light/20 to-blinkit-light/20 dark:from-zomato-red/5 dark:to-blinkit-yellow/5 border border-slate-150 dark:border-white/5 rounded-3xl p-6 md:p-8 flex justify-between items-center flex-wrap gap-4 shadow-sm transition-colors duration-300">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-2.5xl md:text-3.5xl font-extrabold text-slate-800 dark:text-white">
            {restaurant.name}
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <MapPin size={14} className="text-slate-400" />
            {restaurant.address}
          </div>
        </div>

        <div className="flex items-center gap-1 bg-zomato-red text-white px-4 py-1.5 rounded-full text-base font-extrabold shadow-sm shadow-zomato-red/10">
          <Star size={16} fill="currentColor" />
          {restaurant.rating}
        </div>
      </div>

      {/* Menu List */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-xl font-bold text-slate-800 dark:text-white">
            Delicious Dishes
          </h2>
          {getCartCount() > 0 && (
            <Link to="/cart" className="flex items-center gap-1.5 bg-zomato-red hover:bg-zomato-hover active:bg-zomato-hover/95 text-white py-2 px-4 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer no-underline shadow-sm hover:shadow-md">
              <ShoppingBag size={13} /> View Cart ({getCartCount()})
            </Link>
          )}
        </div>

        <div className="flex flex-col gap-3.5">
          {menu.map((item) => (
            <div key={item.id} className="bg-white dark:bg-[#243038] border border-slate-150 dark:border-white/5 rounded-2xl p-5 hover:border-zomato-red/35 dark:hover:border-zomato-red/30 hover:shadow-sm transition-all duration-200 flex justify-between items-center shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
                  {item.itemName}
                </h3>
                <span className="text-[13px] font-extrabold text-zomato-red">
                  ₹{item.price}
                </span>
              </div>

              <button
                onClick={() => addToCart(item, restaurant)}
                className="flex items-center gap-1 bg-white hover:bg-slate-50 border border-slate-200 hover:border-zomato-red/30 text-slate-600 dark:bg-brandDark dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:border-zomato-red/30 py-2 px-4 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer shadow-sm"
              >
                <Plus size={13} /> Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Restaurants;
