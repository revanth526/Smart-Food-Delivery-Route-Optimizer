package com.example.demo.controller;

import com.example.demo.dto.OrderRequest;
import com.example.demo.dto.RouteResponse;
import com.example.demo.model.Delivery;
import com.example.demo.model.Order;
import com.example.demo.model.Restaurant;
import com.example.demo.repository.DeliveryRepository;
import com.example.demo.repository.OrderRepository;
import com.example.demo.repository.RestaurantRepository;
import com.example.demo.service.RouteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private DeliveryRepository deliveryRepository;

    @Autowired
    private RouteService routeService;

    private final List<String> RIDERS = Arrays.asList(
            "Rahul Sharma", "Amit Patel", "Sonia Reddy", 
            "Vikram Singh", "Priya Nair", "Karan Johar"
    );
    private final Random random = new Random();

    @GetMapping("/orders")
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable Long id) {
        return orderRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/orders")
    public ResponseEntity<?> placeOrder(@RequestBody OrderRequest request) {
        Optional<Restaurant> restOpt = restaurantRepository.findById(request.getRestaurantId());
        if (restOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Restaurant not found with id: " + request.getRestaurantId());
        }

        // 1. Create and save order
        Order order = new Order(
                request.getCustomerName(),
                restOpt.get(),
                request.getTotal(),
                "Order Confirmed"
        );
        
        Order savedOrder = orderRepository.save(order);

        // 2. Calculate Dijkstra route
        RouteResponse route = routeService.calculateRoute(
                request.getRestaurantId(), 
                request.getCustomerLocation()
        );

        // Parse distance e.g. "8.4 km" -> 8.4
        double distance = 5.0;
        try {
            distance = Double.parseDouble(route.getDistance().replace(" km", ""));
        } catch (Exception ignored) {}

        // Parse time e.g. "18 mins" -> 18
        int time = 15;
        try {
            time = Integer.parseInt(route.getTime().replace(" mins", ""));
        } catch (Exception ignored) {}

        // 3. Select a random rider and save Delivery
        String rider = RIDERS.get(random.nextInt(RIDERS.size()));
        Delivery delivery = new Delivery(
                savedOrder,
                rider,
                distance,
                time
        );

        deliveryRepository.save(delivery);

        return ResponseEntity.ok(savedOrder);
    }

    @PutMapping("/orders/status/{id}")
    public ResponseEntity<Order> updateOrderStatus(@PathVariable Long id, @RequestBody String status) {
        // Remove surrounding quotes if any from status body
        final String cleanStatus = status.replace("\"", "").trim();
        
        return orderRepository.findById(id)
                .map(order -> {
                    order.setStatus(cleanStatus);
                    return ResponseEntity.ok(orderRepository.save(order));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/delivery/order/{orderId}")
    public ResponseEntity<Delivery> getDeliveryByOrderId(@PathVariable Long orderId) {
        return deliveryRepository.findByOrderId(orderId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
