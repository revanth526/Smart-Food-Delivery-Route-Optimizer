package com.example.demo.dto;

import java.util.List;

public class RouteResponse {
    private String distance;
    private String time;
    private List<String> path;

    public RouteResponse() {}

    public RouteResponse(String distance, String time, List<String> path) {
        this.distance = distance;
        this.time = time;
        this.path = path;
    }

    public String getDistance() {
        return distance;
    }

    public void setDistance(String distance) {
        this.distance = distance;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }

    public List<String> getPath() {
        return path;
    }

    public void setPath(List<String> path) {
        this.path = path;
    }
}
