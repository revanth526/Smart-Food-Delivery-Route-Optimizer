import React, { useState } from 'react';
import { Search, MapPin, ChevronDown, SlidersHorizontal } from 'lucide-react';

const SearchBar = ({ 
  searchQuery, 
  setSearchQuery, 
  // Filters state from Home
  ratingFilter,
  setRatingFilter,
  offersFilter,
  setOffersFilter,
  petFriendlyFilter,
  setPetFriendlyFilter,
  outdoorSeatingFilter,
  setOutdoorSeatingFilter,
  alcoholFilter,
  setAlcoholFilter,
  openNowFilter,
  setOpenNowFilter,
  selectedLocation,
  setSelectedLocation
}) => {
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const locations = ['Hyderabad', 'Secunderabad', 'Madhapur', 'Jubilee Hills', 'Gachibowli'];

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto px-2">
      
      {/* Zomato-style Header Search Container */}
      <div className="relative flex items-center bg-white dark:bg-[#243038] border border-slate-200 dark:border-white/5 rounded-xl shadow-md p-1.5 w-full flex-wrap md:flex-nowrap transition-colors duration-300">
        
        {/* Left Side: Location Selection */}
        <div className="relative flex items-center px-3 py-2 cursor-pointer border-b md:border-b-0 md:border-r border-slate-100 dark:border-white/5 w-full md:w-auto min-w-[160px] justify-between">
          <div 
            className="flex items-center gap-2 w-full"
            onClick={() => setShowLocationDropdown(!showLocationDropdown)}
          >
            <MapPin size={18} className="text-zomato-red flex-shrink-0" />
            <span className="text-[13px] font-medium text-slate-700 dark:text-slate-200 truncate select-none">
              {selectedLocation}
            </span>
            <ChevronDown size={14} className="text-slate-400 ml-auto transition-transform duration-200" style={{ transform: showLocationDropdown ? 'rotate(180deg)' : 'none' }} />
          </div>

          {/* Location Dropdown selector */}
          {showLocationDropdown && (
            <div className="absolute top-12 left-0 w-full bg-white dark:bg-[#243038] border border-slate-200 dark:border-white/10 rounded-xl shadow-lg z-30 overflow-hidden py-1">
              {locations.map((loc) => (
                <div
                  key={loc}
                  onClick={() => {
                    setSelectedLocation(loc);
                    setShowLocationDropdown(false);
                  }}
                  className="px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150 cursor-pointer font-medium"
                >
                  {loc}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Search Input */}
        <div className="flex items-center flex-1 w-full pl-3 pr-2 py-1.5">
          <Search size={17} className="text-slate-400 pointer-events-none mr-2.5" />
          <input
            type="text"
            placeholder="Search for restaurant, cuisine or a dish"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none text-slate-800 dark:text-white text-[13.5px] outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Screenshot Filter Pills Row */}
      <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-2 scroll-smooth w-full flex-nowrap md:flex-wrap select-none">
        
        {/* 1. Filters Button */}
        <button
          onClick={() => {
            // Clear all filters as a toggle/reset
            setRatingFilter(false);
            setOffersFilter(false);
            setPetFriendlyFilter(false);
            setOutdoorSeatingFilter(false);
            setAlcoholFilter(false);
            setOpenNowFilter(false);
          }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all duration-200 whitespace-nowrap bg-white dark:bg-[#243038] text-slate-505 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800`}
        >
          <SlidersHorizontal size={13} className="text-slate-400" />
          <span>Filters</span>
        </button>

        {/* 2. Offers */}
        <button
          onClick={() => setOffersFilter(!offersFilter)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all duration-200 whitespace-nowrap ${
            offersFilter
              ? 'bg-zomato-red text-white border-zomato-red shadow-sm'
              : 'bg-white dark:bg-[#243038] text-slate-505 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span>Offers</span>
        </button>

        {/* 3. Rating: 4.5+ */}
        <button
          onClick={() => setRatingFilter(!ratingFilter)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all duration-200 whitespace-nowrap ${
            ratingFilter
              ? 'bg-zomato-red text-white border-zomato-red shadow-sm'
              : 'bg-white dark:bg-[#243038] text-slate-550 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span>Rating: 4.5+</span>
        </button>

        {/* 4. Pet friendly */}
        <button
          onClick={() => setPetFriendlyFilter(!petFriendlyFilter)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all duration-200 whitespace-nowrap ${
            petFriendlyFilter
              ? 'bg-zomato-red text-white border-zomato-red shadow-sm'
              : 'bg-white dark:bg-[#243038] text-slate-550 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span>Pet friendly</span>
        </button>

        {/* 5. Outdoor seating */}
        <button
          onClick={() => setOutdoorSeatingFilter(!outdoorSeatingFilter)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all duration-200 whitespace-nowrap ${
            outdoorSeatingFilter
              ? 'bg-zomato-red text-white border-zomato-red shadow-sm'
              : 'bg-white dark:bg-[#243038] text-slate-550 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span>Outdoor seating</span>
        </button>

        {/* 6. Serves Alcohol */}
        <button
          onClick={() => setAlcoholFilter(!alcoholFilter)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all duration-200 whitespace-nowrap ${
            alcoholFilter
              ? 'bg-zomato-red text-white border-zomato-red shadow-sm'
              : 'bg-white dark:bg-[#243038] text-slate-550 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span>Serves Alcohol</span>
        </button>

        {/* 7. Open Now */}
        <button
          onClick={() => setOpenNowFilter(!openNowFilter)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all duration-200 whitespace-nowrap ${
            openNowFilter
              ? 'bg-zomato-red text-white border-zomato-red shadow-sm'
              : 'bg-white dark:bg-[#243038] text-slate-550 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span>Open Now</span>
        </button>

      </div>
    </div>
  );
};

export default SearchBar;
