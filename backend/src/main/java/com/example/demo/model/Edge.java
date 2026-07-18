package com.example.demo.model;

public class Edge {
    private String target;
    private double distance; // in km
    private int time;        // in minutes

    public Edge() {}

    public Edge(String target, double distance, int time) {
        this.target = target;
        this.distance = distance;
        this.time = time;
    }

    public String getTarget() {
        return target;
    }

    public void setTarget(String target) {
        this.target = target;
    }

    public double getDistance() {
        return distance;
    }

    public void setDistance(double distance) {
        this.distance = distance;
    }

    public int getTime() {
        return time;
    }

    public void setTime(int time) {
        this.time = time;
    }
}
