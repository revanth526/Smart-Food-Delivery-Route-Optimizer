import React, { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  // Authentication status
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('user_session') !== null;
  });

  // Role state: 'customer' or 'admin'
  const [role, setRole] = useState(() => {
    return localStorage.getItem('role') || 'customer';
  });

  // Cart state: array of { id, itemName, price, quantity, restaurantId, restaurantName }
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Active tracking order
  const [activeOrder, setActiveOrder] = useState(() => {
    const savedOrder = localStorage.getItem('activeOrder');
    return savedOrder ? JSON.parse(savedOrder) : null;
  });

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Sync role to localStorage
  useEffect(() => {
    localStorage.setItem('role', role);
    if (role === 'admin' || role === 'customer') {
      setIsAuthenticated(localStorage.getItem('user_session') !== null);
    }
  }, [role]);

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Sync active order to localStorage
  useEffect(() => {
    if (activeOrder) {
      localStorage.setItem('activeOrder', JSON.stringify(activeOrder));
    } else {
      localStorage.removeItem('activeOrder');
    }
  }, [activeOrder]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const logout = () => {
    localStorage.removeItem('user_session');
    localStorage.removeItem('role');
    setIsAuthenticated(false);
    setRole('customer');
    setCart([]);
    setActiveOrder(null);
  };

  const addToCart = (item, restaurant) => {
    setCart(prevCart => {
      // Check if item from another restaurant is already in cart
      if (prevCart.length > 0 && prevCart[0].restaurantId !== restaurant.id) {
        // Clear previous cart and add new item if it's from a different restaurant
        return [{
          id: item.id,
          itemName: item.itemName,
          price: item.price,
          quantity: 1,
          restaurantId: restaurant.id,
          restaurantName: restaurant.name
        }];
      }

      const existingIndex = prevCart.findIndex(cartItem => cartItem.id === item.id);
      if (existingIndex > -1) {
        const newCart = [...prevCart];
        newCart[existingIndex].quantity += 1;
        return newCart;
      } else {
        return [...prevCart, {
          id: item.id,
          itemName: item.itemName,
          price: item.price,
          quantity: 1,
          restaurantId: restaurant.id,
          restaurantName: restaurant.name
        }];
      }
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === itemId);
      if (!existing) return prevCart;

      if (existing.quantity === 1) {
        return prevCart.filter(item => item.id !== itemId);
      } else {
        return prevCart.map(item =>
          item.id === itemId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getCartCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        role,
        setRole,
        isAuthenticated,
        setIsAuthenticated,
        logout,
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        getCartTotal,
        getCartCount,
        activeOrder,
        setActiveOrder
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
