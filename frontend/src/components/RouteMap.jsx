import React, { useEffect, useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';

// Coordinates for nodes in our delivery network graph (viewBox="0 0 800 500")
const NODE_COORDINATES = {
  // Restaurants
  'Pizza Hub': { x: 100, y: 100, type: 'restaurant', color: '#E23744' },
  'Burger King': { x: 100, y: 250, type: 'restaurant', color: '#F6C733' },
  'Noodles Point': { x: 100, y: 400, type: 'restaurant', color: '#318639' },
  
  // Roads / Intersections
  'Road A': { x: 280, y: 100, type: 'intersection', color: '#94a3b8' },
  'Road B': { x: 280, y: 250, type: 'intersection', color: '#94a3b8' },
  'Road C': { x: 440, y: 130, type: 'intersection', color: '#94a3b8' },
  'Road D': { x: 280, y: 400, type: 'intersection', color: '#94a3b8' },
  'Road E': { x: 440, y: 250, type: 'intersection', color: '#94a3b8' },
  'Road F': { x: 440, y: 400, type: 'intersection', color: '#94a3b8' },
  
  // Customers
  'Ameerpet': { x: 680, y: 150, type: 'customer', color: '#3b82f6' },
  'Madhapur': { x: 680, y: 70, type: 'customer', color: '#3b82f6' },
  'Jubilee Hills': { x: 680, y: 320, type: 'customer', color: '#3b82f6' },
  'Gachibowli': { x: 680, y: 430, type: 'customer', color: '#3b82f6' }
};

// Connections in our graph
const CONNECTIONS = [
  { u: 'Pizza Hub', v: 'Road A', distance: 2.0, time: 5 },
  { u: 'Pizza Hub', v: 'Road B', distance: 3.5, time: 8 },
  { u: 'Burger King', v: 'Road B', distance: 1.5, time: 4 },
  { u: 'Burger King', v: 'Road C', distance: 4.0, time: 9 },
  { u: 'Noodles Point', v: 'Road D', distance: 2.5, time: 6 },
  { u: 'Road A', v: 'Road C', distance: 3.0, time: 6 },
  { u: 'Road A', v: 'Madhapur', distance: 4.0, time: 10 },
  { u: 'Road B', v: 'Road D', distance: 2.0, time: 5 },
  { u: 'Road B', v: 'Jubilee Hills', distance: 5.0, time: 12 },
  { u: 'Road C', v: 'Ameerpet', distance: 3.2, time: 7 },
  { u: 'Road C', v: 'Road E', distance: 2.0, time: 4 },
  { u: 'Road D', v: 'Road F', distance: 3.0, time: 7 },
  { u: 'Road D', v: 'Gachibowli', distance: 6.0, time: 14 },
  { u: 'Road E', v: 'Ameerpet', distance: 1.5, time: 3 },
  { u: 'Road E', v: 'Madhapur', distance: 2.5, time: 5 },
  { u: 'Road F', v: 'Jubilee Hills', distance: 2.0, time: 5 },
  { u: 'Road F', v: 'Gachibowli', distance: 3.5, time: 8 },
  { u: 'Madhapur', v: 'Jubilee Hills', distance: 3.0, time: 7 },
  { u: 'Jubilee Hills', v: 'Gachibowli', distance: 4.5, time: 10 }
];

const RouteMap = ({ path = [] }) => {
  const { theme } = useContext(AppContext);
  const [riderPos, setRiderPos] = useState(null);

  // Check if a connection is part of the shortest path
  const isPathConnection = (u, v) => {
    if (!path || path.length < 2) return false;
    for (let i = 0; i < path.length - 1; i++) {
      if ((path[i] === u && path[i + 1] === v) || (path[i] === v && path[i + 1] === u)) {
        return true;
      }
    }
    return false;
  };

  // Silky smooth constant-velocity requestAnimationFrame loop
  useEffect(() => {
    if (!path || path.length < 2) {
      setRiderPos(null);
      return;
    }

    let animationFrameId;
    let startTime = null;

    const segments = [];
    let totalPixels = 0;

    for (let i = 0; i < path.length - 1; i++) {
      const u = NODE_COORDINATES[path[i]];
      const v = NODE_COORDINATES[path[i + 1]];
      if (u && v) {
        const dx = v.x - u.x;
        const dy = v.y - u.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        segments.push({ from: u, to: v, length: dist, startPixel: totalPixels });
        totalPixels += dist;
      }
    }

    const duration = totalPixels * 12;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = (elapsed % duration) / duration;

      const currentPixel = progress * totalPixels;

      let seg = segments[segments.length - 1];
      for (let i = 0; i < segments.length; i++) {
        if (currentPixel <= segments[i].startPixel + segments[i].length) {
          seg = segments[i];
          break;
        }
      }

      if (seg) {
        const segProgress = (currentPixel - seg.startPixel) / seg.length;
        const x = seg.from.x + (seg.to.x - seg.from.x) * segProgress;
        const y = seg.from.y + (seg.to.y - seg.from.y) * segProgress;

        const bounce = Math.sin(timestamp / 100) * 2;

        setRiderPos({ x, y: y + bounce });
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [path]);

  const isDark = theme === 'dark';

  return (
    <div className="bg-white dark:bg-[#243038] border border-slate-150 dark:border-white/5 rounded-3xl p-5 shadow-sm overflow-hidden">
      
      {/* Legend Header */}
      <div className="flex justify-between items-center flex-wrap gap-4 mb-4">
        <h4 className="font-display text-slate-850 dark:text-white font-bold text-sm">
          Delivery Network Graph
        </h4>
        
        <div className="flex gap-4 items-center text-[10px] text-slate-450 dark:text-slate-400 font-semibold uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-zomato-red shadow-sm shadow-zomato-red/20"></span>
            Restaurant
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 shadow-sm"></span>
            Road Node
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/20"></span>
            Customer Address
          </div>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative w-full h-0 pb-[60%] bg-slate-50 dark:bg-brandDark border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden">
        <svg
          viewBox="0 0 800 480"
          className="absolute top-0 left-0 w-full h-full"
        >
          <style>{`
            @keyframes dashflow {
              to {
                stroke-dashoffset: -20;
              }
            }
            .active-path-line {
              stroke-dasharray: 8, 4;
              animation: dashflow 1s linear infinite;
            }
          `}</style>

          {/* Grid lines background */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke={isDark ? '#2d3b45' : '#e2e8f0'} strokeWidth="0.5" opacity="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Connections / Edges */}
          {CONNECTIONS.map((conn, idx) => {
            const uNode = NODE_COORDINATES[conn.u];
            const vNode = NODE_COORDINATES[conn.v];
            if (!uNode || !vNode) return null;
            const highlighted = isPathConnection(conn.u, conn.v);
            
            return (
              <g key={idx}>
                <line
                  x1={uNode.x}
                  y1={uNode.y}
                  x2={vNode.x}
                  y2={vNode.y}
                  stroke={highlighted ? '#E23744' : (isDark ? '#334155' : '#cbd5e1')}
                  strokeWidth={highlighted ? 4.5 : 2}
                  className={highlighted ? 'active-path-line' : ''}
                  style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }}
                />
                
                {/* Weight Label (Distance/Time) */}
                <g>
                  <rect
                    x={(uNode.x + vNode.x) / 2 - 20}
                    y={(uNode.y + vNode.y) / 2 - 9}
                    width="40"
                    height="18"
                    rx="9"
                    fill={isDark ? '#1C252C' : '#ffffff'}
                    stroke={highlighted ? '#E23744' : (isDark ? '#334155' : '#cbd5e1')}
                    strokeWidth="1"
                    className="shadow-sm transition-colors duration-300"
                  />
                  <text
                    x={(uNode.x + vNode.x) / 2}
                    y={(uNode.y + vNode.y) / 2 + 3}
                    textAnchor="middle"
                    fill={highlighted ? '#CB202D' : (isDark ? '#94a3b8' : '#64748b')}
                    fontSize="9px"
                    fontWeight={highlighted ? 'bold' : '500'}
                  >
                    {conn.distance}k/{conn.time}m
                  </text>
                </g>
              </g>
            );
          })}

          {/* Nodes */}
          {Object.entries(NODE_COORDINATES).map(([name, node]) => {
            const isPathNode = path && path.includes(name);
            let size = node.type === 'intersection' ? 7 : 13;
            if (isPathNode && node.type !== 'intersection') size = 15;
            
            return (
              <g key={name}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={size}
                  fill={isPathNode ? (node.type === 'restaurant' ? '#E23744' : '#3b82f6') : node.color}
                  stroke={isDark ? '#243038' : '#ffffff'}
                  strokeWidth="2.5"
                  className="shadow-md transition-all duration-300"
                />
                
                {/* Node Outer Glow for Active Path */}
                {isPathNode && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={size + 5}
                    fill="none"
                    stroke={node.type === 'restaurant' ? '#E23744' : '#3b82f6'}
                    strokeWidth="1.5"
                  >
                    <animate attributeName="r" values={`${size + 2};${size + 8};${size + 2}`} dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                
                {/* Text Label */}
                <text
                  x={node.x}
                  y={node.type === 'intersection' ? node.y - 12 : node.y + (size + 14)}
                  textAnchor="middle"
                  fill={isPathNode ? (isDark ? '#f8fafc' : '#1e293b') : '#64748b'}
                  fontSize={node.type === 'intersection' ? '9px' : '10.5px'}
                  fontWeight={isPathNode ? 'bold' : '600'}
                  className="transition-colors duration-300 select-none"
                >
                  {name}
                </text>
              </g>
            );
          })}

          {/* Animated Rider Icon */}
          {riderPos && (
            <g transform={`translate(${riderPos.x}, ${riderPos.y})`}>
              {/* Outer Glow Ring */}
              <circle
                r="18"
                fill="#F6C733"
                opacity="0.25"
              >
                <animate attributeName="r" values="14;22;14" dur="1.5s" repeatCount="indefinite" />
              </circle>
              
              {/* Icon Bubble */}
              <circle
                r="13"
                fill="#F6C733"
                stroke={isDark ? '#243038' : '#ffffff'}
                strokeWidth="2"
                className="shadow-md"
              />
              {/* Rider Emoji */}
              <text y="4" textAnchor="middle" fontSize="13px" className="select-none">
                🛵
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};

export default RouteMap;
export { NODE_COORDINATES, CONNECTIONS };
