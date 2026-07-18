# Smart Food Delivery Route Optimizer 🛵💨

A full-stack food delivery application featuring route optimization using **Dijkstra's shortest path algorithm**. The application calculates the most optimal path from a restaurant to a customer address using physical distance and traversal time, visualizing the route dynamically on an interactive node-link network map.

---

## 🚀 Tech Stack

- **Frontend**: React.js, HTML5, CSS3, JavaScript, Axios, React Router, Lucide Icons.
- **Backend**: Java Spring Boot, Spring Data JPA, REST APIs, Maven Wrapper.
- **Database**: H2 (In-memory development database) or PostgreSQL / MySQL (configurable).
- **DSA Core**: Dijkstra's Shortest Path Algorithm, Priority Queue, HashMap, Adjacency List.

---

## 📂 Project Structure

```
SmartFoodDelivery/
├── database/
│   └── schema.sql                # SQL schema definitions
├── backend/
│   ├── src/main/java/com/example/demo/
│   │   ├── controller/           # REST Controllers (Restaurant, Order, Route)
│   │   ├── dto/                  # Data Transfer Objects (Requests/Responses)
│   │   ├── model/                # JPA Database Entities (Restaurant, MenuItem, Order, Delivery, Edge)
│   │   ├── repository/           # Data Repositories
│   │   ├── service/              # Route Service (Dijkstra algorithm engine)
│   │   └── util/                 # DataInitializer (seeds mock database at startup)
│   ├── src/main/resources/
│   │   └── application.properties # H2/PostgreSQL/MySQL configs
│   ├── mvnw / mvnw.cmd           # Maven Wrapper
│   └── pom.xml                   # Maven dependencies
└── frontend/
    ├── src/
    │   ├── components/           # Reusable components (Navbar, Footer, RestaurantCard, RouteMap, SearchBar)
    │   ├── context/              # AppContext (Cart, Theme state, active order tracking)
    │   ├── pages/                # Page components (Home, Restaurants, Cart, Orders, Tracking, RouteOptimizer, Analytics)
    │   ├── App.jsx               # Navigation router setup
    │   ├── index.css             # Unified CSS variables & styling themes
    │   └── main.jsx              # App entry mount
    └── package.json              # NPM dependencies
```

---

## ⚡ DSA Integration (Dijkstra's Engine)

The routing engine uses **Dijkstra's algorithm** to solve the single-source shortest path problem on an undirected weighted graph:
1. **Nodes** represent restaurants, customer regions, and main road intersections.
2. **Edges** represent roads with two weights: physical distance (km) and traversal time (mins).
3. The graph is stored as an adjacency list using `HashMap<String, List<Edge>>`.
4. A Java `PriorityQueue` processes nodes in a greedy fashion to ensure logarithmic complexity $O((E + V) \log V)$ for finding the optimal route.
5. In case the backend is offline, a **pure JavaScript Dijkstra solver fallback** is implemented on the frontend to guarantee visualization works in all situations.

---

## 🛠️ How to Run locally

### Prerequisites
- Node.js & npm (installed)
- Java 17+ (installed)

### 1. Start the Java Spring Boot Backend
Navigate to the `backend` folder and run the Maven wrapper command:
```bash
cd backend
./mvnw spring-boot:run
```
The server will start at `http://localhost:8080` and seed the database automatically with 3 restaurants and 9 menu items.
You can view the H2 Database Console at `http://localhost:8080/h2-console` (Username: `sa`, Password: `password`, JDBC URL: `jdbc:h2:mem:smartfooddb`).

### 2. Start the React Frontend
Open a new terminal, navigate to the `frontend` folder, and run:
```bash
cd frontend
npm install
npm run dev
```
The Vite development server will open at `http://localhost:5173`.

---

## 📡 REST API Contracts

### Restaurants
- `GET /api/restaurants` - Retrieve all restaurants
- `GET /api/restaurants/{id}` - Retrieve details of a specific restaurant

### Menu
- `GET /api/menu/{restaurantId}` - Retrieve the menu list of a specific restaurant

### Orders
- `POST /api/orders` - Place a new order (triggers route calculation and rider assignment)
- `GET /api/orders` - Fetch all orders
- `PUT /api/orders/status/{id}` - Update delivery progress status

### Routes
- `POST /api/route/calculate` - Calculate Dijkstra route
  - **Request Body**:
    ```json
    {
      "restaurantId": 1,
      "customerLocation": "Ameerpet"
    }
    ```
  - **Response Body**:
    ```json
    {
      "distance": "8.4 km",
      "time": "18 mins",
      "path": ["Pizza Hub", "Road B", "Road D", "Ameerpet"]
    }
    ```
