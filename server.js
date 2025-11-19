require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Error:', err));

// ============= SCHEMAS =============

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['digital', 'physical', 'currency'],
    required: true 
  },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  image: { type: String, default: '' },
  description: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

// ============= MIDDLEWARE =============

// Auth Middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error();
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) throw new Error();
    
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

// Admin Middleware
const adminMiddleware = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// ============= ROUTES =============

// Health Check
app.get('/', (req, res) => {
  res.json({ 
    message: 'J4R Box API Running ✅',
    endpoints: {
      products: '/api/products',
      auth: '/api/auth/register, /api/auth/login',
      seed: '/api/seed',
      migrate: '/api/migrate',
      updateStock: '/api/products/:id/stock (POST)'
    }
  });
});

// ===== AUTH ROUTES =====

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      isAdmin: email === process.env.ADMIN_EMAIL
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        admin: user.isAdmin
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== PRODUCT ROUTES =====

// Get All Products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Single Product
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create Product (Admin Only)
app.post('/api/products', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ NEW: Update Stock Only (NO AUTH REQUIRED - For Checkout)
app.post('/api/products/:id/stock', async (req, res) => {
  try {
    const { stock } = req.body;
    
    if (typeof stock !== 'number' || stock < 0) {
      return res.status(400).json({ error: 'Invalid stock value' });
    }
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Only update stock for physical products
    if (product.category === 'physical' && product.stock < 999) {
      product.stock = stock;
      await product.save();
      
      console.log(`✅ Stock updated: ${product.name} → ${stock}`);
      
      res.json({ 
        success: true, 
        product: {
          id: product._id,
          name: product.name,
          stock: product.stock
        }
      });
    } else {
      res.json({ 
        success: false, 
        message: 'Stock not updated (not a physical product or unlimited stock)' 
      });
    }
  } catch (error) {
    console.error('❌ Stock update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update Product (Admin Only)
app.put('/api/products/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Product (Admin Only)
app.delete('/api/products/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== MIGRATION ENDPOINT =====
app.get('/api/migrate', async (req, res) => {
  try {
    const virtualUpdate = await Product.updateMany(
      { category: 'virtual' },
      { $set: { category: 'digital' } }
    );

    const accessoryUpdate = await Product.updateMany(
      { category: 'accessory' },
      { $set: { category: 'physical' } }
    );

    const currencyUpdate = await Product.updateMany(
      { category: 'currency' },
      { $set: { stock: 999 } }
    );

    const products = await Product.find();
    
    res.json({ 
      message: '✅ Migration complete!',
      updated: {
        virtual_to_digital: virtualUpdate.modifiedCount,
        accessory_to_physical: accessoryUpdate.modifiedCount,
        currency_stock_fixed: currencyUpdate.modifiedCount
      },
      total_products: products.length,
      products: products
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== SEED DATA =====
app.get('/api/seed', async (req, res) => {
  try {
    const count = await Product.countDocuments();
    if (count > 0) {
      return res.json({ message: 'Database already seeded', count });
    }

    const demoProducts = [
      { 
        name: "God of War Ragnarok (PS5)", 
        category: "physical", 
        price: 3495, 
        stock: 20, 
        image: "./images/god.jpg", 
        description: "Brand new physical disc for PS5." 
      },
      { 
        name: "NBA 2K24 (PS4)", 
        category: "physical", 
        price: 1995, 
        stock: 25, 
        image: "./images/nba.jpeg", 
        description: "PS4 physical disc." 
      },
      { 
        name: "Razer BlackShark V2 X", 
        category: "physical", 
        price: 2499, 
        stock: 35, 
        image: "./images/razer.png", 
        description: "Lightweight esports headset." 
      },
      { 
        name: "Nintendo Switch Pro Controller", 
        category: "physical", 
        price: 3495, 
        stock: 15, 
        image: "./images/nintendo.jpeg", 
        description: "Official Pro Controller." 
      },
      { 
        name: "Genshin Genesis Crystals 6480", 
        category: "currency", 
        price: 4290, 
        stock: 999, 
        image: "./images/genshin.jpg", 
        description: "In-game top up. Instant delivery." 
      },
      { 
        name: "Valorant Points 475", 
        category: "currency", 
        price: 249, 
        stock: 999, 
        image: "./images/valo.png", 
        description: "Direct Riot top-up." 
      },
      { 
        name: "Elden Ring (PC)", 
        category: "digital", 
        price: 2699, 
        stock: 50, 
        image: "./images/elden.jpg", 
        description: "Award-winning ARPG. Steam key." 
      },
      { 
        name: "Minecraft (Java & Bedrock)", 
        category: "digital", 
        price: 1599, 
        stock: 100, 
        image: "./images/minecraft.jpeg", 
        description: "PC digital code." 
      }
    ];

    await Product.insertMany(demoProducts);

    res.json({ message: 'Database seeded successfully ✅', count: demoProducts.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Visit http://localhost:${PORT} to test API`);
});