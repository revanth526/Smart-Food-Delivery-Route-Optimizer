import React, { useState } from 'react';
import api from '../services/api';
import RouteMap, { NODE_COORDINATES, CONNECTIONS } from '../components/RouteMap';
import { Compass, Clock, MapPin, Calculator, Info, Award, Cpu } from 'lucide-react';

// --- Custom Priority Queue (Min-Heap) for Local JavaScript Solvers ---
class MinPriorityQueue {
  constructor() {
    this.heap = [];
  }
  push(element) {
    this.heap.push(element);
    this.bubbleUp(this.heap.length - 1);
  }
  pop() {
    if (this.heap.length === 0) return null;
    const min = this.heap[0];
    const end = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = end;
      this.sinkDown(0);
    }
    return min;
  }
  size() {
    return this.heap.length;
  }
  bubbleUp(index) {
    const element = this.heap[index];
    while (index > 0) {
      let parentIndex = Math.floor((index - 1) / 2);
      let parent = this.heap[parentIndex];
      if (element.priority >= parent.priority) break;
      this.heap[index] = parent;
      index = parentIndex;
    }
    this.heap[index] = element;
  }
  sinkDown(index) {
    const length = this.heap.length;
    const element = this.heap[index];
    while (true) {
      let leftChildIndex = 2 * index + 1;
      let rightChildIndex = 2 * index + 2;
      let leftChild, rightChild;
      let swap = null;

      if (leftChildIndex < length) {
        leftChild = this.heap[leftChildIndex];
        if (leftChild.priority < element.priority) {
          swap = leftChildIndex;
        }
      }
      if (rightChildIndex < length) {
        rightChild = this.heap[rightChildIndex];
        if (
          (swap === null && rightChild.priority < element.priority) ||
          (swap !== null && rightChild.priority < leftChild.priority)
        ) {
          swap = rightChildIndex;
        }
      }
      if (swap === null) break;
      this.heap[index] = this.heap[swap];
      index = swap;
    }
    this.heap[index] = element;
  }
}

// Custom HashMap Adjacency List builder
const buildAdjacencyList = () => {
  const list = new Map();
  Object.keys(NODE_COORDINATES).forEach(node => {
    list.set(node, []);
  });
  CONNECTIONS.forEach(conn => {
    const uNeighbors = list.get(conn.u) || [];
    uNeighbors.push({ target: conn.v, distance: conn.distance, time: conn.time });
    list.set(conn.u, uNeighbors);

    const vNeighbors = list.get(conn.v) || [];
    vNeighbors.push({ target: conn.u, distance: conn.distance, time: conn.time });
    list.set(conn.v, vNeighbors);
  });
  return list;
};

const adjList = buildAdjacencyList();

// Local Dijkstra Solver
const solveLocalDijkstra = (startNode, endNode) => {
  const distances = new Map();
  const previous = new Map();
  const pq = new MinPriorityQueue();
  const visited = new Set();

  Object.keys(NODE_COORDINATES).forEach(node => {
    distances.set(node, Infinity);
    previous.set(node, null);
  });

  distances.set(startNode, 0);
  pq.push({ node: startNode, priority: 0 });

  while (pq.size() > 0) {
    const { node: u } = pq.pop();

    if (u === endNode) break;
    if (visited.has(u)) continue;
    visited.add(u);

    const neighbors = adjList.get(u) || [];
    for (const edge of neighbors) {
      const v = edge.target;
      if (visited.has(v)) continue;

      const alt = distances.get(u) + edge.distance;
      if (alt < distances.get(v)) {
        distances.set(v, alt);
        previous.set(v, u);
        pq.push({ node: v, priority: alt });
      }
    }
  }

  const path = [];
  let curr = endNode;
  while (curr) {
    path.unshift(curr);
    curr = previous.get(curr);
  }

  const totalDist = distances.get(endNode);
  return {
    distance: totalDist === Infinity ? '0.0 km' : `${totalDist.toFixed(1)} km`,
    time: totalDist === Infinity ? '0 mins' : `${Math.ceil(totalDist * 3.5)} mins`,
    path
  };
};

// Local A* Solver
const solveLocalAStar = (startNode, endNode) => {
  const openSet = new MinPriorityQueue();
  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();
  const visited = new Set();

  Object.keys(NODE_COORDINATES).forEach(node => {
    gScore.set(node, Infinity);
    fScore.set(node, Infinity);
  });

  gScore.set(startNode, 0);

  // Heuristic: Straight-line Euclidean distance
  const h = (node) => {
    const n = NODE_COORDINATES[node];
    const target = NODE_COORDINATES[endNode];
    if (!n || !target) return 0;
    const dx = target.x - n.x;
    const dy = target.y - n.y;
    return Math.sqrt(dx * dx + dy * dy) / 80;
  };

  const hVal = h(startNode);
  fScore.set(startNode, hVal);
  openSet.push({ node: startNode, priority: hVal });

  while (openSet.size() > 0) {
    const { node: current } = openSet.pop();

    if (current === endNode) break;
    if (visited.has(current)) continue;
    visited.add(current);

    const neighbors = adjList.get(current) || [];
    for (const edge of neighbors) {
      const neighbor = edge.target;
      if (visited.has(neighbor)) continue;

      const tentativeG = gScore.get(current) + edge.distance;
      if (tentativeG < gScore.get(neighbor)) {
        cameFrom.set(neighbor, current);
        gScore.set(neighbor, tentativeG);
        const f = tentativeG + h(neighbor);
        fScore.set(neighbor, f);
        openSet.push({ node: neighbor, priority: f });
      }
    }
  }

  const path = [];
  let curr = endNode;
  while (curr) {
    path.unshift(curr);
    curr = cameFrom.get(curr);
  }

  const totalDist = gScore.get(endNode);
  return {
    distance: totalDist === Infinity ? '0.0 km' : `${totalDist.toFixed(1)} km`,
    time: totalDist === Infinity ? '0 mins' : `${Math.ceil(totalDist * 3.5)} mins`,
    path
  };
};

const RouteOptimizer = () => {
  const [restaurantId, setRestaurantId] = useState('1');
  const [customerLocation, setCustomerLocation] = useState('Ameerpet');
  const [algorithm, setAlgorithm] = useState('dijkstra'); // 'dijkstra' or 'astar'
  const [result, setResult] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [offlineUsed, setOfflineUsed] = useState(false);

  const getRestaurantName = (id) => {
    switch (id) {
      case '1': return 'Pizza Hub';
      case '2': return 'Burger King';
      case '3': return 'Noodles Point';
      default: return 'Pizza Hub';
    }
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    setCalculating(true);
    setOfflineUsed(false);

    const payload = {
      restaurantId: parseInt(restaurantId),
      customerLocation: customerLocation,
      algorithm: algorithm
    };

    try {
      const res = await api.post('/api/route/calculate', payload);
      setResult({
        distance: `${res.data.distance.toFixed(1)} km`,
        time: `${Math.ceil(res.data.distance * 3.5)} mins`,
        path: res.data.path,
        algorithmUsed: res.data.algorithmUsed
      });
      setOfflineUsed(false);
    } catch (err) {
      console.warn('Backend routing API offline. Resolving route using local JavaScript solver.');
      const startNodeName = getRestaurantName(restaurantId);
      
      const localResult = algorithm === 'astar' 
        ? solveLocalAStar(startNodeName, customerLocation) 
        : solveLocalDijkstra(startNodeName, customerLocation);

      setResult({
        ...localResult,
        algorithmUsed: algorithm === 'astar' ? 'A* Search (Local JavaScript)' : 'Dijkstra (Local JavaScript)'
      });
      setOfflineUsed(true);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="fade-in max-w-6xl mx-auto px-6 py-10 flex flex-col gap-8">
      
      <div>
        <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider font-sans">DSA Visualization Platform</span>
        <h1 className="font-display text-2.5xl font-extrabold text-slate-800 dark:text-white mt-1">
          Dijkstra & A* Route Optimizer
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Controls & Results */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Form Controls */}
          <div className="bg-white dark:bg-[#243038] border border-slate-150 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col gap-4 transition-colors duration-300">
            <h3 className="font-display text-[15px] font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-white/5 pb-3">Configure Route</h3>
            
            <form onSubmit={handleCalculate} className="flex flex-col gap-4">
              <div>
                <label htmlFor="rest-select" className="block text-xs font-semibold text-slate-550 dark:text-slate-300 mb-1.5">
                  Start Node (Restaurant)
                </label>
                <select
                  id="rest-select"
                  value={restaurantId}
                  onChange={(e) => setRestaurantId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-brandDark border border-slate-200 dark:border-white/10 focus:border-zomato-red focus:ring-4 focus:ring-zomato-red/10 rounded-xl text-slate-800 dark:text-white px-3.5 py-2.5 text-xs outline-none transition-all duration-200 cursor-pointer"
                >
                  <option value="1">Pizza Hub (Jubilee Hills)</option>
                  <option value="2">Burger King (Ameerpet)</option>
                  <option value="3">Noodles Point (Madhapur)</option>
                  <option value="4">KFC (Ameerpet)</option>
                  <option value="5">Biryani Zone (Madhapur/Gachibowli)</option>
                  <option value="6">Chili's Grill (Jubilee Hills)</option>
                  <option value="7">Pista House (Jubilee Hills)</option>
                </select>
              </div>

              <div>
                <label htmlFor="dest-select" className="block text-xs font-semibold text-slate-550 dark:text-slate-300 mb-1.5">
                  End Node (Customer Address)
                </label>
                <select
                  id="dest-select"
                  value={customerLocation}
                  onChange={(e) => setCustomerLocation(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-brandDark border border-slate-200 dark:border-white/10 focus:border-zomato-red focus:ring-4 focus:ring-zomato-red/10 rounded-xl text-slate-800 dark:text-white px-3.5 py-2.5 text-xs outline-none transition-all duration-200 cursor-pointer"
                >
                  <option value="Ameerpet">Ameerpet</option>
                  <option value="Madhapur">Madhapur</option>
                  <option value="Jubilee Hills">Jubilee Hills</option>
                  <option value="Gachibowli">Gachibowli</option>
                </select>
              </div>

              <div>
                <label htmlFor="algo-select" className="block text-xs font-semibold text-slate-550 dark:text-slate-300 mb-1.5">
                  Routing Algorithm
                </label>
                <select
                  id="algo-select"
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-brandDark border border-slate-200 dark:border-white/10 focus:border-zomato-red focus:ring-4 focus:ring-zomato-red/10 rounded-xl text-slate-800 dark:text-white px-3.5 py-2.5 text-xs outline-none transition-all duration-200 cursor-pointer"
                >
                  <option value="dijkstra">Dijkstra's Algorithm (Shortest Cost)</option>
                  <option value="astar">A* Search Algorithm (Heuristic Guided)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={calculating}
                className="w-full bg-zomato-red hover:bg-zomato-hover text-white font-semibold py-2.5 px-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer text-center text-xs mt-3 flex items-center justify-center gap-1.5"
              >
                <Calculator size={14} />
                {calculating ? 'Running Solver...' : 'Calculate Route'}
              </button>
            </form>
          </div>

          {/* Dijkstra vs A* Info Alert */}
          <div className="relative overflow-hidden bg-white dark:bg-[#243038] border border-slate-150 dark:border-white/5 rounded-2xl pl-5 pr-4.5 py-4.5 flex gap-3 shadow-sm text-xs text-slate-505 dark:text-slate-300 leading-relaxed transition-colors duration-300">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-zomato-red" />
            <Info size={18} className="text-zomato-red flex-shrink-0 mt-0.5" />
            <div>
              {algorithm === 'astar' ? (
                <span>
                  <strong>A* Search</strong> uses a heuristic $f(n) = g(n) + h(n)$ estimating distance to target node, speeding up queries by prioritizing directions heading toward the destination.
                </span>
              ) : (
                <span>
                  <strong>Dijkstra's Algorithm</strong> explores edges uniformly in concentric rings starting from the source, guaranteeing shortest costs but searching nodes in all directions.
                </span>
              )}
            </div>
          </div>

          {/* Path Results */}
          {result && (
            <div className="bg-gradient-to-br from-zomato-light/20 to-blinkit-light/20 dark:from-zomato-red/5 dark:to-blinkit-yellow/5 border border-slate-150 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col gap-4 transition-colors duration-300">
              <h3 className="font-display text-[15px] font-bold text-slate-800 dark:text-white">
                Calculation Results
              </h3>

              {offlineUsed && (
                <div className="text-[10px] text-zomato-red font-bold uppercase tracking-wider">
                  ⚠️ SOLVED OFFLINE (Backend Server is disconnected)
                </div>
              )}

              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Method: <strong className="text-slate-800 dark:text-slate-200">{result.algorithmUsed}</strong>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Compass size={15} className="text-slate-400" />
                  <div>
                    <span className="block text-[10px] text-slate-400 dark:text-slate-500">Distance</span>
                    <strong className="text-slate-750 dark:text-slate-200">{result.distance}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-slate-400" />
                  <div>
                    <span className="block text-[10px] text-slate-400 dark:text-slate-500">Time</span>
                    <strong className="text-slate-755 dark:text-slate-200">{result.time}</strong>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200/60 dark:border-white/5 pt-3.5 text-xs">
                <span className="block text-[10px] text-slate-405 dark:text-slate-400 mb-2">Shortest Path Node Path</span>
                <div className="flex flex-wrap items-center gap-2">
                  {result.path.map((node, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <span className="text-slate-350 dark:text-slate-600">➔</span>}
                      <span className={`px-2 py-0.5 border rounded text-[10px] font-bold shadow-sm ${
                        i === 0 
                          ? 'bg-zomato-light dark:bg-zomato-red/10 text-zomato-red border-zomato-red/20' 
                          : i === result.path.length - 1 
                            ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-500 border-blue-200/60' 
                            : 'bg-white dark:bg-brandDark text-slate-650 dark:text-slate-300 border-slate-200/60 dark:border-white/10'
                      }`}>
                        {node}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Graph Map & Complexity Analytics */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white dark:bg-[#243038] border border-slate-150 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
            <RouteMap path={result ? result.path : []} />
          </div>

          {/* DSA Complexity breakdown */}
          <div className="bg-white dark:bg-[#243038] border border-slate-150 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col gap-4 transition-colors duration-300">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
              <Cpu size={16} className="text-zomato-red" />
              <h3 className="font-display text-[15px] font-bold text-slate-805 dark:text-white">
                DSA Implementation Breakdown
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              <div>
                <h4 className="font-bold text-slate-805 dark:text-slate-200 mb-1.5">HashMap Adjacency List</h4>
                <p>
                  Instead of standard matrices, the graph structure is parsed as a **HashMap** where key-node string mappings yield an array of neighbor edges in **$O(1)$** lookup complexity.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-805 dark:text-slate-200 mb-1.5">Priority Queue Min-Heap</h4>
                <p>
                  Exploring nodes uses a custom **Min-Heap** structure. Extracting the minimum cost node is highly optimized at **$O(\log V)$** complexity instead of slow linear $O(V)$ sorting arrays.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-805 dark:text-slate-200 mb-1.5">Dijkstra Complexity</h4>
                <p>
                  Uniform cost search. Complexity matches **$O((V + E) \log V)$** where $V$ represents nodes and $E$ is the connection segments. Perfect for multi-target static maps.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-805 dark:text-slate-200 mb-1.5">A* Search Complexity</h4>
                <p>
                  Goal-directed search. Incorporates Euclidean distance heuristics $h(n)$ to bound complexity closer to **$O(E \log V)$** on average by focusing traversal segments.
                </p>
              </div>
            </div>
          </div>
          
          {!result && (
            <div className="text-center py-6 px-4 bg-blinkit-light dark:bg-blinkit-green/10 border border-dashed border-blinkit-yellow/20 dark:border-blinkit-green/20 rounded-2xl text-xs text-blinkit-green dark:text-blinkit-yellow font-medium">
              💡 Select nodes and algorithms, and click "Calculate Route" to compare.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RouteOptimizer;
