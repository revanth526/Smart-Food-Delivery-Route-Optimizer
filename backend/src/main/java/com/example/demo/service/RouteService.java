package com.example.demo.service;

import com.example.demo.dto.RouteResponse;
import com.example.demo.model.Edge;
import com.example.demo.model.Restaurant;
import com.example.demo.repository.RestaurantRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class RouteService {

    @Autowired
    private RestaurantRepository restaurantRepository;

    // Adjacency list representation of the graph
    private final Map<String, List<Edge>> graph = new HashMap<>();

    @PostConstruct
    public void initGraph() {
        // Initialize the graph edges
        // Note: Graph is undirected, so we add edges in both directions.
        
        // Pizza Hub connections
        addEdge("Pizza Hub", "Road A", 2.0, 5);
        addEdge("Pizza Hub", "Road B", 3.5, 8);

        // Burger King connections
        addEdge("Burger King", "Road B", 1.5, 4);
        addEdge("Burger King", "Road C", 4.0, 9);

        // Noodles Point connections
        addEdge("Noodles Point", "Road D", 2.5, 6);

        // Road A connections
        addEdge("Road A", "Road C", 3.0, 6);
        addEdge("Road A", "Madhapur", 4.0, 10);

        // Road B connections
        addEdge("Road B", "Road D", 2.0, 5);
        addEdge("Road B", "Jubilee Hills", 5.0, 12);

        // Road C connections
        addEdge("Road C", "Ameerpet", 3.2, 7);
        addEdge("Road C", "Road E", 2.0, 4);

        // Road D connections
        addEdge("Road D", "Road F", 3.0, 7);
        addEdge("Road D", "Gachibowli", 6.0, 14);

        // Road E connections
        addEdge("Road E", "Ameerpet", 1.5, 3);
        addEdge("Road E", "Madhapur", 2.5, 5);

        // Road F connections
        addEdge("Road F", "Jubilee Hills", 2.0, 5);
        addEdge("Road F", "Gachibowli", 3.5, 8);

        // Other inter-connections to complete routes
        addEdge("Madhapur", "Jubilee Hills", 3.0, 7);
        addEdge("Jubilee Hills", "Gachibowli", 4.5, 10);
    }

    private void addEdge(String u, String v, double distance, int time) {
        graph.computeIfAbsent(u, k -> new ArrayList<>()).add(new Edge(v, distance, time));
        graph.computeIfAbsent(v, k -> new ArrayList<>()).add(new Edge(u, distance, time));
    }

    /**
     * Calculates the shortest route from a restaurant to a customer address using Dijkstra's algorithm.
     */
    public RouteResponse calculateRoute(Long restaurantId, String customerLocation) {
        // Find restaurant name
        Optional<Restaurant> restOpt = restaurantRepository.findById(restaurantId);
        String startNode = restOpt.map(Restaurant::getName).orElse("Pizza Hub");
        String endNode = customerLocation;

        // Standardize customer location input case (e.g. "ameerpet" -> "Ameerpet")
        endNode = capitalize(endNode.trim());
        if (!graph.containsKey(endNode)) {
            // Fallback to a default node if not found in graph
            endNode = "Ameerpet";
        }

        // Dijkstra's Algorithm
        Map<String, Double> distances = new HashMap<>();
        Map<String, Integer> times = new HashMap<>();
        Map<String, String> parentNodes = new HashMap<>();
        PriorityQueue<NodeWrapper> pq = new PriorityQueue<>();

        // Initialize distances
        for (String node : graph.keySet()) {
            distances.put(node, Double.MAX_VALUE);
            times.put(node, Integer.MAX_VALUE);
        }

        distances.put(startNode, 0.0);
        times.put(startNode, 0);
        pq.add(new NodeWrapper(startNode, 0.0));

        while (!pq.isEmpty()) {
            NodeWrapper current = pq.poll();
            String u = current.name;

            if (u.equals(endNode)) {
                break; // Found shortest path to destination
            }

            if (current.distance > distances.get(u)) {
                continue;
            }

            List<Edge> neighbors = graph.getOrDefault(u, Collections.emptyList());
            for (Edge edge : neighbors) {
                String v = edge.getTarget();
                double newDist = distances.get(u) + edge.getDistance();

                if (newDist < distances.get(v)) {
                    distances.put(v, newDist);
                    times.put(v, times.get(u) + edge.getTime());
                    parentNodes.put(v, u);
                    pq.add(new NodeWrapper(v, newDist));
                }
            }
        }

        // Reconstruct path
        List<String> path = new ArrayList<>();
        String current = endNode;
        while (current != null) {
            path.add(0, current);
            current = parentNodes.get(current);
        }

        // Handle edge case where start and end are disconnected (should not happen in our fully connected graph)
        if (path.size() == 1 && !path.get(0).equals(startNode)) {
            return new RouteResponse("0.0 km", "0 mins", Collections.singletonList(startNode));
        }

        double totalDistance = distances.get(endNode);
        int totalTime = times.get(endNode);

        return new RouteResponse(
                String.format(Locale.US, "%.1f km", totalDistance),
                totalTime + " mins",
                path
        );
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
    }

    private static class NodeWrapper implements Comparable<NodeWrapper> {
        String name;
        double distance;

        public NodeWrapper(String name, double distance) {
            this.name = name;
            this.distance = distance;
        }

        @Override
        public int compareTo(NodeWrapper other) {
            return Double.compare(this.distance, other.distance);
        }
    }
}
