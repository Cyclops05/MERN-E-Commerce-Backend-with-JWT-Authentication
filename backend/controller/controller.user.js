const User = require("../modules/module.user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// Register User
exports.registerUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "Username and password required" });

    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res.status(400).json({ error: "Username already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.json({ message: "User registered successfully", user: { username: newUser.username } });
  } catch (error) {
    res.status(500).json({ error: "Server error during registration" });
  }
};

// Login User
exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });

    res.json({
      message: "Login successful",
      token,
      user: { id: user._id, username: user.username },
    });
  } catch (error) {
    res.status(500).json({ error: "Server error during login" });
  }
};

// Get All Users (with product references)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().populate("products", "name price category");
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: "Unable to fetch users" });
  }
};
