const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');

// Coordinates for nodes in our delivery network graph (for A* Heuristic calculation)
const NODE_COORDINATES = {
  'Pizza Hub': { x: 100, y: 100 },
  'Burger King': { x: 100, y: 250 },
  'Noodles Point': { x: 100, y: 400 },
  'Road A': { x: 280, y: 100 },
  'Road B': { x: 280, y: 250 },
  'Road C': { x: 440, y: 130 },
  'Road D': { x: 280, y: 400 },
  'Road E': { x: 440, y: 250 },
  'Road F': { x: 440, y: 400 },
  'Ameerpet': { x: 680, y: 150 },
  'Madhapur': { x: 680, y: 70 },
  'Jubilee Hills': { x: 680, y: 320 },
  'Gachibowli': { x: 680, y: 430 }
};

// Weighted connections in our graph
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

// --- Custom DSA HashMap Implementation ---
class GraphHashMap {
  constructor() {
    this.map = new Map();
  }
  put(key, value) {
    this.map.set(key, value);
  }
  get(key) {
    return this.map.get(key);
  }
  has(key) {
    return this.map.has(key);
  }
  entries() {
    return this.map.entries();
  }
}

// --- Custom DSA Min-Heap Priority Queue Implementation ---
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

// Build adjacency list using custom HashMap
const adjacencyList = new GraphHashMap();
Object.keys(NODE_COORDINATES).forEach(node => {
  adjacencyList.put(node, []);
});

CONNECTIONS.forEach(conn => {
  const uNeighbors = adjacencyList.get(conn.u) || [];
  uNeighbors.push({ target: conn.v, distance: conn.distance, time: conn.time });
  adjacencyList.put(conn.u, uNeighbors);

  const vNeighbors = adjacencyList.get(conn.v) || [];
  vNeighbors.push({ target: conn.u, distance: conn.distance, time: conn.time });
  adjacencyList.put(conn.v, vNeighbors);
});

/**
 * 1. Dijkstra shortest path routing algorithm using Min-Heap and HashMap
 */
function calculateDijkstraPath(start, end) {
  const distances = new GraphHashMap();
  const previous = new GraphHashMap();
  const minHeap = new MinPriorityQueue();
  const visited = new Set();

  Object.keys(NODE_COORDINATES).forEach(node => {
    distances.put(node, Infinity);
    previous.put(node, null);
  });

  distances.put(start, 0);
  minHeap.push({ node: start, priority: 0 });

  while (minHeap.size() > 0) {
    const { node: u } = minHeap.pop();

    if (u === end) break;
    if (visited.has(u)) continue;
    visited.add(u);

    const neighbors = adjacencyList.get(u) || [];
    for (const edge of neighbors) {
      const v = edge.target;
      if (visited.has(v)) continue;

      const alt = distances.get(u) + edge.distance;
      if (alt < distances.get(v)) {
        distances.put(v, alt);
        previous.put(v, u);
        minHeap.push({ node: v, priority: alt });
      }
    }
  }

  const path = [];
  let curr = end;
  while (curr) {
    path.unshift(curr);
    curr = previous.get(curr);
  }

  return {
    path,
    distance: distances.get(end) === Infinity ? 0.0 : distances.get(end)
  };
}

/**
 * 2. A* Search routing algorithm using Min-Heap, HashMap, and Euclidean heuristic
 */
function calculateAStarPath(start, end) {
  const openSet = new MinPriorityQueue();
  const cameFrom = new GraphHashMap();
  
  const gScore = new GraphHashMap();
  const fScore = new GraphHashMap();
  const visited = new Set();
  
  Object.keys(NODE_COORDINATES).forEach(node => {
    gScore.put(node, Infinity);
    fScore.put(node, Infinity);
  });
  
  gScore.put(start, 0);
  
  // Heuristic h(n): Straight-line Euclidean distance between node coordinates
  const h = (node) => {
    const n = NODE_COORDINATES[node];
    const target = NODE_COORDINATES[end];
    if (!n || !target) return 0;
    const dx = target.x - n.x;
    const dy = target.y - n.y;
    // Scale pixel distance to match road metrics scale
    return Math.sqrt(dx * dx + dy * dy) / 80;
  };
  
  const hVal = h(start);
  fScore.put(start, hVal);
  openSet.push({ node: start, priority: hVal });
  
  while (openSet.size() > 0) {
    const { node: current } = openSet.pop();
    
    if (current === end) break;
    if (visited.has(current)) continue;
    visited.add(current);
    
    const neighbors = adjacencyList.get(current) || [];
    for (const edge of neighbors) {
      const neighbor = edge.target;
      if (visited.has(neighbor)) continue;
      
      const tentativeGScore = gScore.get(current) + edge.distance;
      if (tentativeGScore < gScore.get(neighbor)) {
        cameFrom.put(neighbor, current);
        gScore.put(neighbor, tentativeGScore);
        
        const f = tentativeGScore + h(neighbor);
        fScore.put(neighbor, f);
        openSet.push({ node: neighbor, priority: f });
      }
    }
  }
  
  const path = [];
  let curr = end;
  while (curr) {
    path.unshift(curr);
    curr = cameFrom.get(curr);
  }
  
  return {
    path,
    distance: gScore.get(end) === Infinity ? 0.0 : gScore.get(end)
  };
}

// Calculate shortest path: POST /api/route/calculate
router.post('/route/calculate', async (req, res) => {
  try {
    const { restaurantId, customerLocation, algorithm } = req.body;
    let startNode = 'Pizza Hub'; // Default start node

    if (restaurantId) {
      const rest = await Restaurant.findById(restaurantId);
      if (rest) {
        const name = rest.name.toLowerCase();
        const address = rest.address.toLowerCase();
        if (name.includes('hub') || address.includes('jubilee') || address.includes('secunderabad')) {
          startNode = 'Pizza Hub';
        } else if (name.includes('king') || name.includes('kfc') || address.includes('ameerpet')) {
          startNode = 'Burger King';
        } else if (name.includes('noodle') || name.includes('biryani') || address.includes('madhapur') || address.includes('gachibowli')) {
          startNode = 'Noodles Point';
        }
      } else {
        // Fallback checks
        const idStr = String(restaurantId);
        if (idStr.includes('2') || idStr.includes('4')) startNode = 'Burger King';
        else if (idStr.includes('3') || idStr.includes('5') || idStr.includes('6') || idStr.includes('7')) startNode = 'Noodles Point';
      }
    }

    const destNode = customerLocation || 'Ameerpet';
    let result;

    if (algorithm === 'astar') {
      result = calculateAStarPath(startNode, destNode);
    } else {
      result = calculateDijkstraPath(startNode, destNode);
    }

    res.json({ 
      success: true, 
      path: result.path, 
      distance: result.distance,
      algorithmUsed: algorithm === 'astar' ? 'A* Search (Euclidean Heuristic)' : 'Dijkstra'
    });
  } catch (err) {
    console.error('Route calculation error:', err);
    res.status(500).json({ success: false, path: ['Pizza Hub', 'Road A', 'Madhapur'], distance: 6.0 });
  }
});

// Fetch active Delivery Rider details: GET /api/delivery/order/:orderId
router.get('/delivery/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId });
    
    let destNode = 'Ameerpet';
    let startNode = 'Pizza Hub';

    if (order) {
      destNode = order.deliveryAddress;
      if (order.orderedItems && order.orderedItems.length > 0) {
        const firstItem = order.orderedItems[0].itemName.toLowerCase();
        if (firstItem.includes('pizza') || firstItem.includes('garlic') || firstItem.includes('chili')) startNode = 'Pizza Hub';
        if (firstItem.includes('burger') || firstItem.includes('fries') || firstItem.includes('zinger') || firstItem.includes('wings') || firstItem.includes('popcorn')) startNode = 'Burger King';
        if (firstItem.includes('noodle') || firstItem.includes('rolls') || firstItem.includes('biryani') || firstItem.includes('haleem') || firstItem.includes('chai') || firstItem.includes('meetha')) startNode = 'Noodles Point';
      }
    }

    const { distance } = calculateDijkstraPath(startNode, destNode);

    res.json({
      riderName: 'Rider Amit (Heap-Priority Dijkstra Router)',
      routeDistance: distance,
      estimatedTime: Math.ceil(distance * 3.5)
    });
  } catch (err) {
    res.json({
      riderName: 'Rider Amit',
      routeDistance: 4.5,
      estimatedTime: 15
    });
  }
});

module.exports = router;
