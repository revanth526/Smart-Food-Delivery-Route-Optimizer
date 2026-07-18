package com.example.demo.dto;

public class OrderRequest {
    private String customerName;
    private Long restaurantId;
    private Double total;
    private String customerLocation;

    public OrderRequest() {}

    public OrderRequest(String customerName, Long restaurantId, Double total, String customerLocation) {
        this.customerName = customerName;
        this.restaurantId = restaurantId;
        this.total = total;
        this.customerLocation = customerLocation;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public Long getRestaurantId() {
        return restaurantId;
    }

    public void setRestaurantId(Long restaurantId) {
        this.restaurantId = restaurantId;
    }

    public Double getTotal() {
        return total;
    }

    public void setTotal(Double total) {
        this.total = total;
    }

    public String getCustomerLocation() {
        return customerLocation;
    }

    public void setCustomerLocation(String customerLocation) {
        this.customerLocation = customerLocation;
    }
}
