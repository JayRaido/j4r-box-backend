// basic imports
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 5000;

// setup middleware
app.use(cors());
app.use(bodyParser.json());

// connect to mongodb atlas (change the connection if needed)
const MONGO_URI =
  "mongodb+srv://JayRide:DZo7fM0Wa7OQ4EaL@it-1029.wad4dic.mongodb.net/ecommerceDB?appName=IT-1029";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error(err));

// simple user schema (this acts like a table structure)
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
});

// create a model to use the schema
const User = mongoose.model("User", UserSchema);

// route to save user data (runs when you click Save on the form)
app.post("/api/users", async (req, res) => {
  try {
    const { name, email } = req.body;
    const newUser = new User({ name, email });
    await newUser.save(); // save to database
    console.log("✅ Saved:", newUser);
    res.json(newUser);
  } catch (err) {
    console.error("❌ Save failed:", err);
    res.status(500).json({ error: err.message });
  }
});

// route to get all users (this loads the table data)
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find(); // gets everything in the collection
    console.log("📤 Sending users:", users);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// start the server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));