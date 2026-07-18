require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const Admin = require('./models/Admin');
const Restaurant = require('./models/Restaurant');
const MenuItem = require('./models/MenuItem');
const seedOutlets = require('./restaurantsSeedData');

// Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const orderRoutes = require('./routes/orderRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and parsing of JSON payloads
app.use(cors({ origin: '*' }));
app.use(express.json());

// Basic check endpoint
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Smart Food Route Optimizer Node API is running.' });
});

// Register API Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/orders', orderRoutes);
app.use('/api', restaurantRoutes);
app.use('/api', deliveryRoutes);
app.use('/payments', paymentRoutes);

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'An unexpected error occurred on the server.'
  });
});

// Seed default Admin and Restaurant structures
const seedDatabase = async () => {
  try {
    // 1. Seed admin credential
    const adminEmail = 'rkrevanth2456@gmail.com';
    const existingAdmin = await Admin.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('Salaar@111', 10);
      await Admin.create({
        email: adminEmail,
        password: hashedPassword,
        role: 'admin'
      });
      console.log('🏁 Admin user seeded: rkrevanth2456@gmail.com / Salaar@111');
    } else {
      console.log('🏁 Admin credentials active: rkrevanth2456@gmail.com / Salaar@111');
    }

    // 2. Seed default restaurants & menu items if they do not exist
    // Loaded dynamically from ./restaurantsSeedData.js

    for (const outlet of seedOutlets) {
      const existing = await Restaurant.findOne({ name: outlet.name });
      if (!existing) {
        const createdRest = await Restaurant.create({
          name: outlet.name,
          address: outlet.address,
          rating: outlet.rating,
          latitude: outlet.latitude,
          longitude: outlet.longitude
        });

        for (const dish of outlet.menu) {
          await MenuItem.create({
            restaurant: createdRest._id,
            itemName: dish.itemName,
            price: dish.price
          });
        }
        console.log(`🌱 Seeded outlet: ${outlet.name}`);
      }
    }
  } catch (err) {
    console.error('Error seeding initial records:', err.message);
  }
};

// Database Connection & Server Startup
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartfooddelivery';

console.log(`Connecting to database: ${MONGODB_URI}`);
mongoose.set('bufferCommands', false); // Fail fast instead of hanging if Mongo is offline

mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 3000 })
  .then(async () => {
    console.log('🔌 Connected to MongoDB database successfully.');
    await seedDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Node Express Server listening on port ${PORT}`);
      console.log(`📡 Endpoints available: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB database.');
    console.error('Please make sure your MongoDB server is running locally or check your connection string.');
    console.error('Error Details:', err.message);
    
    // Sandbox fallback mode - start server anyway so frontend remains functional
    console.log('\n⚠️ Starting server in Sandbox Memory Mock mode (database-offline)...');
    app.listen(PORT, () => {
      console.log(`🚀 Node Express Server (Sandbox Mock) listening on port ${PORT}`);
    });
  });
