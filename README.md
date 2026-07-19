# 🍔 Smart Food Delivery Route Optimizer 🛵

A full-stack food delivery application that optimizes delivery routes using **Dijkstra's Shortest Path Algorithm**. The system calculates the shortest route between a restaurant and the customer's location based on road distances and estimated travel time, then visualizes the path on an interactive graph.

---

## 📖 Table of Contents

- Overview
- Features
- Tech Stack
- Project Structure
- Dijkstra's Algorithm Integration
- System Workflow
- Installation
- Running the Application
- REST API
- Database
- Future Improvements
- Screenshots
- License

---

# 📌 Overview

Smart Food Delivery Route Optimizer is designed to simulate a modern food delivery platform while demonstrating the practical use of **Data Structures and Algorithms**.

The application allows users to:

- Browse restaurants
- View menus
- Place food orders
- Calculate the shortest delivery route
- Track delivery progress
- Visualize routes on an interactive graph

---

# ✨ Features

- 🍕 Restaurant Listing
- 📋 Menu Management
- 🛒 Shopping Cart
- 📦 Order Placement
- 🚚 Delivery Tracking
- 🗺️ Route Optimization using Dijkstra's Algorithm
- 📊 Delivery Analytics Dashboard
- ⚡ JavaScript Route Solver Fallback
- 🔄 RESTful API Architecture

---

# 🛠 Tech Stack

## Frontend

- React.js
- JavaScript (ES6+)
- HTML5
- CSS3
- Axios
- React Router
- Lucide Icons
- Vite

## Backend

- Java 17
- Spring Boot
- Spring Data JPA
- Maven

## Database

- H2 Database (Development)
- PostgreSQL (Optional)
- MySQL (Optional)

## DSA

- Dijkstra's Shortest Path Algorithm
- Priority Queue
- HashMap
- Adjacency List

---

# 📂 Project Structure

```text
SmartFoodDelivery/
│
├── backend/
│   ├── controller/
│   ├── dto/
│   ├── model/
│   ├── repository/
│   ├── service/
│   ├── util/
│   ├── resources/
│   ├── pom.xml
│   └── mvnw
│
├── frontend/
│   ├── components/
│   ├── context/
│   ├── pages/
│   ├── App.jsx
│   ├── main.jsx
│   └── package.json
│
└── database/
    └── schema.sql
```

---

# 🧠 Dijkstra's Algorithm Integration

The route optimization module uses **Dijkstra's Shortest Path Algorithm** to solve the Single Source Shortest Path problem.

### Graph Representation

- Nodes
  - Restaurants
  - Road Junctions
  - Customer Locations

- Edges
  - Roads connecting nodes
  - Weighted by distance and travel time

### Data Structures

- HashMap
- Adjacency List
- Priority Queue

### Algorithm Complexity

```
Time Complexity:
O((V + E) log V)

Space Complexity:
O(V + E)
```

### Route Calculation Flow

```
Restaurant
      │
      ▼
Graph Construction
      │
      ▼
Run Dijkstra
      │
      ▼
Shortest Path
      │
      ▼
Distance + Time
      │
      ▼
Interactive Route Visualization
```

### Frontend Fallback

If the backend is unavailable, the frontend automatically switches to a JavaScript implementation of Dijkstra's Algorithm, ensuring uninterrupted route visualization.

---

# ⚙️ System Workflow

```text
User
 │
 ▼
Browse Restaurants
 │
 ▼
Select Menu Items
 │
 ▼
Place Order
 │
 ▼
Backend Receives Order
 │
 ▼
Run Dijkstra Algorithm
 │
 ▼
Find Shortest Route
 │
 ▼
Assign Delivery Rider
 │
 ▼
Return Route
 │
 ▼
Visualize on Map
```

---

# 🚀 Installation

## Prerequisites

- Java 17+
- Node.js
- npm
- Git

---

# ▶️ Running the Backend

```bash
cd backend
./mvnw spring-boot:run
```

Backend runs on

```
http://localhost:8080
```

---

# ▶️ Running the Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend runs on

```
http://localhost:5173
```

---

# 🗄 Database

Default database:

- H2 In-Memory Database

H2 Console

```
http://localhost:8080/h2-console
```

Credentials

| Property | Value |
|----------|-------|
| JDBC URL | jdbc:h2:mem:smartfooddb |
| Username | sa |
| Password | password |

The application automatically seeds:

- 3 Restaurants
- 9 Menu Items
- Sample Road Graph

---

# 📡 REST API

## Restaurants

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/restaurants` | Get all restaurants |
| GET | `/api/restaurants/{id}` | Get restaurant details |

---

## Menu

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/menu/{restaurantId}` | Get menu by restaurant |

---

## Orders

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/orders` | Place an order |
| GET | `/api/orders` | Get all orders |
| PUT | `/api/orders/status/{id}` | Update order status |

---

## Route

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/route/calculate` | Calculate optimal route |

### Sample Request

```json
{
  "restaurantId": 1,
  "customerLocation": "Ameerpet"
}
```

### Sample Response

```json
{
  "distance": "8.4 km",
  "time": "18 mins",
  "path": [
    "Pizza Hub",
    "Road B",
    "Road D",
    "Ameerpet"
  ]
}
```

---

# 📈 Future Improvements

- Live GPS Tracking
- Rider Assignment Optimization
- Traffic-Aware Routing
- A* Search Algorithm
- Google Maps Integration
- JWT Authentication
- Payment Gateway Integration
- Docker Deployment
- Kubernetes Support

---

# 📸 Screenshots

Add screenshots here.

```
Home Page

Restaurant Listing

Route Optimizer

Delivery Tracking

Analytics Dashboard
```

---

# 🎯 Learning Outcomes

This project demonstrates:

- Full Stack Development
- Spring Boot REST APIs
- React Application Development
- Database Design
- Graph Data Structures
- Dijkstra's Algorithm
- Route Optimization
- API Integration
- State Management
- Client-Server Architecture

---

# 👨‍💻 Author

**Your Name**

GitHub: https://github.com/revanth526

LinkedIn: https://linkedin.com/in/yourprofile

---

# 📄 License

This project is licensed under the MIT License.

---
