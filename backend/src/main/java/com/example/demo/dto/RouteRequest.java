package com.example.demo.dto;

public class RouteRequest {
    private Long restaurantId;
    private String customerLocation;

    public RouteRequest() {}

    public RouteRequest(Long restaurantId, String customerLocation) {
        this.restaurantId = restaurantId;
        this.customerLocation = customerLocation;
    }

    public Long getRestaurantId() {
        return restaurantId;
    }

    public void setRestaurantId(Long restaurantId) {
        this.restaurantId = restaurantId;
    }

    public String getCustomerLocation() {
        return customerLocation;
    }

    public void setCustomerLocation(String customerLocation) {
        this.customerLocation = customerLocation;
    }
}
