package com.example.demo.dto;

public class MenuItemRequest {
    private Long restaurantId;
    private String itemName;
    private Double price;

    public MenuItemRequest() {}

    public MenuItemRequest(Long restaurantId, String itemName, Double price) {
        this.restaurantId = restaurantId;
        this.itemName = itemName;
        this.price = price;
    }

    public Long getRestaurantId() {
        return restaurantId;
    }

    public void setRestaurantId(Long restaurantId) {
        this.restaurantId = restaurantId;
    }

    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }
}
