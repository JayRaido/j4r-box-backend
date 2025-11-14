const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: "*" }));
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(
  "mongodb+srv://JayRide:DZo7fM0Wa7OQ4EaL@it-1029.wad4dic.mongodb.net/?appName=IT-1029",
  { useNewUrlParser: true, useUnifiedTopology: true }
)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

// ===== Schemas =====
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});
const ProductSchema = new mongoose.Schema({
  name: String,
  category: String,
  price: Number,
  stock: Number,
  image: String,
  description: String,
});

const User = mongoose.model("User", UserSchema);
const Product = mongoose.model("Product", ProductSchema);

// ===== Routes =====

// quick test route
app.get("/", (req, res) => res.send("J4R GameVerse API online!"));

// --- User Auth ---
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "Email already exists" });
    const user = await User.create({ name, email, password });
    res.json({ user, token: "dummy-token" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    res.json({ user, token: "dummy-token" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Product CRUD ---
app.get("/api/products", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

app.post("/api/products", async (req, res) => {
  const newItem = await Product.create(req.body);
  res.json(newItem);
});

app.put("/api/products/:id", async (req, res) => {
  const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

app.delete("/api/products/:id", async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "Product deleted" });
});

// ----- Start Server -----
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));