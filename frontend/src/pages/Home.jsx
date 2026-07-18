import React, { useState, useEffect } from 'react';
import api from '../services/api';
import SearchBar from '../components/SearchBar';
import RestaurantCard from '../components/RestaurantCard';
import { FALLBACK_RESTAURANTS } from '../fallbackRestaurants';

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Active selected location state (passed to SearchBar)
  const [selectedLocation, setSelectedLocation] = useState('Hyderabad');

  // Zomato filter pill states
  const [ratingFilter, setRatingFilter] = useState(false);
  const [offersFilter, setOffersFilter] = useState(false);
  const [petFriendlyFilter, setPetFriendlyFilter] = useState(false);
  const [outdoorSeatingFilter, setOutdoorSeatingFilter] = useState(false);
  const [alcoholFilter, setAlcoholFilter] = useState(false);
  const [openNowFilter, setOpenNowFilter] = useState(false);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/restaurants');
        const mappedData = response.data.map(rest => {
          let category = 'Pizza';
          const name = rest.name.toLowerCase();
          if (name.includes('burger') || name.includes('kfc')) category = 'Burgers';
          else if (name.includes('noodle') || name.includes('biryani') || name.includes('pista') || name.includes('haleem') || name.includes('bahar') || name.includes('shadab')) category = 'Biryani';
          return { ...rest, id: rest._id, category };
        });
        setRestaurants(mappedData);
        setError(false);
      } catch (err) {
        console.warn('Backend REST API unavailable. Using fallback restaurant seed data.');
        setRestaurants(FALLBACK_RESTAURANTS);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  // Filter evaluation loop
  const filteredRestaurants = restaurants.filter(rest => {
    // 0. Location selection filter
    const matchesLocation = rest.address.toLowerCase().includes(selectedLocation.toLowerCase());

    // 1. Text Search matching
    const matchesSearch = rest.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          rest.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. Rating 4.5+ filter
    const matchesRating = !ratingFilter || rest.rating >= 4.5;
    
    // 3. Offers (Pizza Hub and Burger King have active discount codes)
    const matchesOffers = !offersFilter || (rest.name.includes('Pizza') || rest.name.includes('Burger') || rest.name.includes('KFC'));
    
    // 4. Pet Friendly (Noodles Point has an open lawn seating area)
    const matchesPetFriendly = !petFriendlyFilter || rest.name.includes('Noodles') || rest.name.includes('Bistro');
    
    // 5. Outdoor Seating (Pizza Hub has outdoor terrace seating)
    const matchesOutdoor = !outdoorSeatingFilter || rest.name.includes('Pizza') || rest.name.includes('Brewing') || rest.name.includes('Wharf');
    
    // 6. Serves Alcohol (Burger King has beverage licenses in sandbox)
    const matchesAlcohol = !alcoholFilter || rest.name.includes('Brewing') || rest.name.includes('Prost') || rest.name.includes('Moon');
    
    // 7. Open Now (all active restaurants in Hyderabad coordinates sandbox are open)
    const matchesOpen = !openNowFilter || rest.rating >= 4.0;

    return matchesLocation && matchesSearch && matchesRating && matchesOffers && matchesPetFriendly && matchesOutdoor && matchesAlcohol && matchesOpen;
  });

  return (
    <div className="fade-in max-w-6xl mx-auto px-6 py-10 flex flex-col gap-10">
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-zomato-light/20 to-blinkit-light/20 dark:from-slate-900/60 dark:to-slate-800/40 border border-slate-150 dark:border-white/5 rounded-3xl px-6 py-12 text-center flex flex-col items-center gap-4.5 shadow-sm">
        <h1 className="font-display text-3xl md:text-4.5xl font-extrabold text-slate-800 dark:text-white leading-tight max-w-xl">
          Fast Food Delivered Via <span className="text-zomato-red">Smartest Routes</span>
        </h1>
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">
          Enter your location, select your favorite dishes, and let our graph-optimized Dijkstra routers calculate the fastest delivery path for you.
        </p>

        {/* Search Bar Integration with Zomato headers and Filters */}
        <div className="w-full mt-2">
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            ratingFilter={ratingFilter}
            setRatingFilter={setRatingFilter}
            offersFilter={offersFilter}
            setOffersFilter={setOffersFilter}
            petFriendlyFilter={petFriendlyFilter}
            setPetFriendlyFilter={setPetFriendlyFilter}
            outdoorSeatingFilter={outdoorSeatingFilter}
            setOutdoorSeatingFilter={setOutdoorSeatingFilter}
            alcoholFilter={alcoholFilter}
            setAlcoholFilter={setAlcoholFilter}
            openNowFilter={openNowFilter}
            setOpenNowFilter={setOpenNowFilter}
            selectedLocation={selectedLocation}
            setSelectedLocation={setSelectedLocation}
          />
        </div>
      </div>

      {/* Connection status warning */}
      {error && (
        <div className="p-3.5 bg-blinkit-light dark:bg-blinkit-green/10 border border-blinkit-yellow/40 dark:border-blinkit-green/20 rounded-xl text-xs text-blinkit-green dark:text-blinkit-yellow text-center font-bold shadow-sm">
          💡 Running in Offline Sandbox. To query live database collections, start your Node backend on port 5000.
        </div>
      )}

      {/* Restaurants Section */}
      <div>
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">
            Popular Restaurants
          </h2>
          {/* Active filter count indicator */}
          {(ratingFilter || offersFilter || petFriendlyFilter || outdoorSeatingFilter || alcoholFilter || openNowFilter) && (
            <span className="text-xs font-semibold text-zomato-red bg-zomato-light px-3 py-1 rounded-full border border-zomato-red/10 animate-pulse">
              Filters Active
            </span>
          )}
        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            Loading restaurants...
          </div>
        ) : filteredRestaurants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center">
            <p className="text-sm font-medium">No restaurants found matching your criteria.</p>
            <p className="text-xs text-slate-400 mt-1">Try toggling off some filters to see all seeded outlets!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
