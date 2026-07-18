package com.example.demo.model;

import jakarta.persistence.*;

@Entity
@Table(name = "delivery")
public class Delivery {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;
    
    @Column(name = "rider_name")
    private String riderName;
    
    @Column(name = "route_distance")
    private Double routeDistance; // in km
    
    @Column(name = "estimated_time")
    private Integer estimatedTime; // in minutes

    public Delivery() {}

    public Delivery(Order order, String riderName, Double routeDistance, Integer estimatedTime) {
        this.order = order;
        this.riderName = riderName;
        this.routeDistance = routeDistance;
        this.estimatedTime = estimatedTime;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Order getOrder() {
        return order;
    }

    public void setOrder(Order order) {
        this.order = order;
    }

    public String getRiderName() {
        return riderName;
    }

    public void setRiderName(String riderName) {
        this.riderName = riderName;
    }

    public Double getRouteDistance() {
        return routeDistance;
    }

    public void setRouteDistance(Double routeDistance) {
        this.routeDistance = routeDistance;
    }

    public Integer getEstimatedTime() {
        return estimatedTime;
    }

    public void setEstimatedTime(Integer estimatedTime) {
        this.estimatedTime = estimatedTime;
    }
}
