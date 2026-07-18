import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Clock } from 'lucide-react';

const RestaurantCard = ({ restaurant }) => {
  // Select matching high-quality Unsplash image based on name keywords
  const getRestaurantImage = (name) => {
    const n = name.toLowerCase();
    
    if (n.includes('pizza') || n.includes('bistro')) {
      return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80';
    }
    if (n.includes('burger') || n.includes('king') || n.includes('kfc') || n.includes('subway') || n.includes('california')) {
      return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80';
    }
    if (n.includes('noodle') || n.includes('chinese') || n.includes('pavilion')) {
      return 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&q=80';
    }
    if (n.includes('biryani') || n.includes('mandi') || n.includes('joint') || n.includes('ghouse') || n.includes('shadab') || n.includes('bahar') || n.includes('bawarchi') || n.includes('house') || n.includes('diwan') || n.includes('alpha') || n.includes('kitchen') || n.includes('curry')) {
      return 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=400&q=80';
    }
    if (n.includes('barbecue') || n.includes('buffet') || n.includes('grill') || n.includes('tikka') || n.includes('tandoori')) {
      return 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80';
    }
    if (n.includes('cream') || n.includes('stone') || n.includes('cafe') || n.includes('feast') || n.includes('sweet') || n.includes('dessert')) {
      return 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=400&q=80';
    }
    if (n.includes('udipi') || n.includes('upahar') || n.includes('tiffin') || n.includes('purna') || n.includes('dhaba') || n.includes('mess') || n.includes('kakatiya') || n.includes('taj') || n.includes('dosa') || n.includes('idli')) {
      return 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=400&q=80';
    }
    if (n.includes('brewing') || n.includes('brewpub') || n.includes('prost') || n.includes('moon') || n.includes('blue') || n.includes('bar') || n.includes('lounge')) {
      return 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=400&q=80';
    }
    if (n.includes('fisherman') || n.includes('wharf') || n.includes('fish') || n.includes('sea')) {
      return 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&q=80';
    }

    return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80';
  };

  // Distance/time computed deterministically using name hash for realistic variety
  const getDeliveryStats = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const distVal = 1.2 + (Math.abs(hash) % 49) / 10; // Ranges between 1.2 km and 6.0 km
    const timeVal = Math.ceil(distVal * 3.5); // Ranges between 5 mins and 21 mins
    return {
      distance: `${distVal.toFixed(1)} km`,
      time: `${timeVal} mins`
    };
  };

  const { distance, time } = getDeliveryStats(restaurant.name);

  return (
    <Link to={`/restaurant/${restaurant.id}`} className="block no-underline text-inherit group">
      <div className="h-full bg-white dark:bg-[#243038] border border-slate-150 dark:border-white/5 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md hover:border-zomato-red/40 dark:hover:border-zomato-red/30 hover:-translate-y-1 transition-all duration-300 flex flex-col">
        
        {/* Cover Image */}
        <div className="relative h-44 w-full overflow-hidden">
          <img
            src={getRestaurantImage(restaurant.name)}
            alt={restaurant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 right-3 bg-zomato-red text-white px-2.5 py-0.5 rounded-full flex items-center gap-1 text-[11px] font-bold shadow-sm">
            <Star size={11} fill="currentColor" />
            {restaurant.rating}
          </div>
        </div>

        {/* Info */}
        <div className="p-4 sm:p-5 flex flex-col gap-2 flex-1 min-w-0">
          <h3 className="font-display text-[16px] font-bold text-slate-800 dark:text-white group-hover:text-zomato-red transition-colors duration-200 truncate w-full" title={restaurant.name}>
            {restaurant.name}
          </h3>

          <p className="flex items-center gap-1.5 text-xs text-slate-505 dark:text-slate-400 min-w-0 w-full">
            <MapPin size={13} className="text-slate-400 flex-shrink-0" />
            <span className="truncate" title={restaurant.address}>{restaurant.address}</span>
          </p>

          {/* Stats Bar */}
          <div className="flex items-center gap-3 border-t border-slate-105 dark:border-white/5 pt-3 mt-auto text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Clock size={12} className="text-slate-400" />
              {time}
            </span>
            <span className="text-slate-200 dark:text-slate-700">|</span>
            <span>{distance}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default RestaurantCard;
