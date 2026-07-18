package com.example.demo.controller;

import com.example.demo.dto.RouteRequest;
import com.example.demo.dto.RouteResponse;
import com.example.demo.service.RouteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/route")
@CrossOrigin(origins = "*")
public class RouteController {

    @Autowired
    private RouteService routeService;

    @PostMapping("/calculate")
    public ResponseEntity<RouteResponse> calculateRoute(@RequestBody RouteRequest request) {
        if (request.getRestaurantId() == null || request.getCustomerLocation() == null) {
            return ResponseEntity.badRequest().build();
        }
        
        RouteResponse response = routeService.calculateRoute(
                request.getRestaurantId(), 
                request.getCustomerLocation()
        );
        
        return ResponseEntity.ok(response);
    }
}
