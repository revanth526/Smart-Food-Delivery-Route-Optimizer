import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Compass } from 'lucide-react';

const RESTAURANTS = [
  { name: 'Pizza Hub', lat: 17.4483, lng: 78.3915 },
  { name: 'Burger King', lat: 17.4375, lng: 78.4483 },
  { name: 'Noodles Point', lat: 17.4436, lng: 78.3792 }
];

// Haversine formula to compute distance in km between two geo-coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

const LiveLocationMap = ({ onLocationSelected }) => {
  const mapContainerRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);
  const restaurantMarkersRef = useRef([]);

  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [nearestRestaurant, setNearestRestaurant] = useState(null);

  const getLiveLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        setLocating(false);
        
        // Find nearest restaurant
        let nearest = null;
        let minDistance = Infinity;
        
        RESTAURANTS.forEach(rest => {
          const dist = calculateDistance(latitude, longitude, rest.lat, rest.lng);
          if (dist < minDistance) {
            minDistance = dist;
            nearest = { ...rest, distance: dist.toFixed(2) };
          }
        });
        
        setNearestRestaurant(nearest);

        if (onLocationSelected) {
          onLocationSelected({
            lat: latitude,
            lng: longitude,
            nearestRestaurant: nearest
          });
        }
      },
      (error) => {
        console.error("Error getting location: ", error);
        alert("Unable to retrieve your location. Please check your browser permissions.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (!coords || !window.L || !mapContainerRef.current) return;

    // Initialize map if it doesn't exist
    if (!mapInstance.current) {
      mapInstance.current = window.L.map(mapContainerRef.current).setView([coords.lat, coords.lng], 14);

      // Add OpenStreetMap tile layer
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstance.current);

      // Add draggable user marker
      markerInstance.current = window.L.marker([coords.lat, coords.lng], { draggable: true })
        .addTo(mapInstance.current)
        .bindPopup('<b>Your Live Delivery Location</b><br>Drag me to refine your address!')
        .openPopup();

      // Listen to marker drag events
      markerInstance.current.on('dragend', () => {
        const pos = markerInstance.current.getLatLng();
        updateNearestAndSelect(pos.lat, pos.lng);
      });

      // Listen to map click events
      mapInstance.current.on('click', (e) => {
        const { lat, lng } = e.latlng;
        markerInstance.current.setLatLng([lat, lng]);
        updateNearestAndSelect(lat, lng);
      });

      // Add restaurant markers to map
      RESTAURANTS.forEach(rest => {
        const restMarker = window.L.marker([rest.lat, rest.lng], {
          icon: window.L.divIcon({
            html: `<div style="background-color: #ef4444; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3)">🍕</div>`,
            className: 'custom-div-icon',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          })
        })
          .addTo(mapInstance.current)
          .bindPopup(`<b>${rest.name}</b><br>Seeded Restaurant location.`);
        
        restaurantMarkersRef.current.push(restMarker);
      });
    } else {
      // Update center of map and user marker
      mapInstance.current.setView([coords.lat, coords.lng], 14);
      markerInstance.current.setLatLng([coords.lat, coords.lng]);
    }
  }, [coords]);

  const updateNearestAndSelect = (lat, lng) => {
    setCoords({ lat, lng });

    // Find nearest restaurant
    let nearest = null;
    let minDistance = Infinity;
    
    RESTAURANTS.forEach(rest => {
      const dist = calculateDistance(lat, lng, rest.lat, rest.lng);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = { ...rest, distance: dist.toFixed(2) };
      }
    });

    setNearestRestaurant(nearest);

    if (onLocationSelected) {
      onLocationSelected({
        lat,
        lng,
        nearestRestaurant: nearest
      });
    }
  };

  // Clean up map instance on unmount
  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
      {/* Geolocation Button */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={getLiveLocation}
          disabled={locating}
          className="glow-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            fontSize: '14px'
          }}
        >
          <Navigation size={16} className={locating ? 'pulse-icon' : ''} />
          {locating ? 'Detecting Location...' : 'Access My Live Location'}
        </button>

        {coords && (
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            📍 Coords: <strong>{coords.lat.toFixed(4)}°N, {coords.lng.toFixed(4)}°E</strong>
          </div>
        )}
      </div>

      {/* Nearest Restaurant Alert */}
      {nearestRestaurant && (
        <div className="fade-in" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 18px',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '13px',
          color: 'var(--text-primary)'
        }}>
          <Compass size={18} color="var(--accent-color)" />
          <span>
            Closest seeded restaurant: <strong style={{ color: 'var(--accent-color)' }}>{nearestRestaurant.name}</strong> is <strong>{nearestRestaurant.distance} km</strong> away from you.
          </span>
        </div>
      )}

      {/* Leaflet Map Div */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: coords ? '300px' : '0px',
          borderRadius: 'var(--radius-md)',
          border: coords ? '1px solid var(--border-color)' : 'none',
          boxShadow: 'var(--card-shadow)',
          transition: 'height 0.3s ease, border 0.3s ease',
          backgroundColor: 'rgba(0,0,0,0.1)',
          zIndex: 1
        }}
      />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.9); }
        }
        .pulse-icon {
          animation: pulse 1s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default LiveLocationMap;
export { calculateDistance };
