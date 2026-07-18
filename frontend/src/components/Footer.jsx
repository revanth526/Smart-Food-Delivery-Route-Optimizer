import React from 'react';
import { ShoppingBag } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-brandDark border-t border-slate-150 dark:border-white/5 py-10 px-6 mt-auto transition-colors duration-300">
      <div className="flex flex-wrap justify-between gap-8 max-w-6xl mx-auto pb-8 border-b border-slate-100 dark:border-white/5">
        
        {/* About Column */}
        <div className="flex-1 min-w-[280px]">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-gradient-to-br from-zomato-red to-blinkit-yellow w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm shadow-zomato-red/10">
              <ShoppingBag size={15} />
            </div>
            <span className="font-display text-base font-extrabold text-slate-800 dark:text-white">
              SmartFood Route
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-[260px]">
            Combining Node.js Express, MongoDB, and JWT with Dijkstra's shortest path algorithm to deliver fresh food on highly optimized routing networks.
          </p>
        </div>

        {/* Categories Column */}
        <div className="min-w-[120px]">
          <h4 className="text-slate-800 dark:text-slate-200 font-bold mb-4 text-xs tracking-wider uppercase">Categories</h4>
          <ul className="list-none p-0 m-0 flex flex-col gap-2 text-xs">
            {['Pizzas', 'Burgers', 'Biryanis', 'Desserts'].map(cat => (
              <li key={cat}>
                <a href="#" className="text-slate-500 dark:text-slate-400 hover:text-zomato-red dark:hover:text-zomato-red transition-colors duration-200 no-underline">
                  {cat}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Tech Stack Column */}
        <div className="min-w-[150px]">
          <h4 className="text-slate-800 dark:text-slate-200 font-bold mb-4 text-xs tracking-wider uppercase">Tech Stack</h4>
          <ul className="list-none p-0 m-0 flex flex-col gap-2 text-xs text-slate-500 dark:text-slate-400">
            <li>React.js & Tailwind CSS</li>
            <li>Node.js & Express</li>
            <li>MongoDB (Mongoose)</li>
            <li>Dijkstra's Algorithm</li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-6xl mx-auto mt-6 flex justify-between items-center flex-wrap gap-4 text-[11px] text-slate-400 dark:text-slate-500">
        <p>&copy; {new Date().getFullYear()} SmartFood Route. All rights reserved.</p>
        <p>Designed for portfolio demonstration and routing simulation.</p>
      </div>
    </footer>
  );
};

export default Footer;
