// server.js
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(cookieParser());

// ===== Config =====
const PORT = process.env.PORT || 4000;
const MONGO_URI = 'mongodb+srv://cyborg:Gogl1357@cluster0.wawchpu.mongodb.net/?appName=Cluster0';
const JWT_SECRET = 'super_secret_key';

// ===== MongoDB Connection =====
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// ===== User Schema =====
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// ===== JWT Middleware =====
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// ===== API Routes =====

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields are required' });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashed });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ token, user: { id: newUser._id, name, email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'All fields are required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Protected route
app.get('/api/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== Serve Frontend (index.html) =====
app.get('/', (req, res) => {
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Auth System</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background: #0f172a;
        color: #f8fafc;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        margin: 0;
      }
      .container {
        background: #1e293b;
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 0 15px rgba(0,0,0,0.3);
        width: 350px;
      }
      h2 {
        text-align: center;
        color: #38bdf8;
      }
      input {
        width: 100%;
        padding: 10px;
        margin: 10px 0;
        border: none;
        border-radius: 8px;
        outline: none;
      }
      button {
        width: 100%;
        padding: 10px;
        background: #38bdf8;
        border: none;
        border-radius: 8px;
        color: #0f172a;
        font-weight: bold;
        cursor: pointer;
      }
      button:hover {
        background: #0ea5e9;
      }
      #toggle {
        text-align: center;
        margin-top: 10px;
        cursor: pointer;
        color: #a5f3fc;
      }
      .message {
        text-align: center;
        color: #fbbf24;
        margin-top: 8px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2 id="formTitle">Register</h2>
      <input type="text" id="name" placeholder="Name" />
      <input type="email" id="email" placeholder="Email" />
      <input type="password" id="password" placeholder="Password" />
      <button id="submitBtn">Register</button>
      <div id="toggle">Already have an account? Login</div>
      <div class="message" id="message"></div>
    </div>

    <script>
      const formTitle = document.getElementById('formTitle');
      const nameInput = document.getElementById('name');
      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');
      const submitBtn = document.getElementById('submitBtn');
      const toggle = document.getElementById('toggle');
      const message = document.getElementById('message');

      let isLogin = false;
      const API_URL = '/api';

      toggle.addEventListener('click', () => {
        isLogin = !isLogin;
        if (isLogin) {
          formTitle.textContent = 'Login';
          nameInput.style.display = 'none';
          submitBtn.textContent = 'Login';
          toggle.textContent = "Don't have an account? Register";
        } else {
          formTitle.textContent = 'Register';
          nameInput.style.display = 'block';
          submitBtn.textContent = 'Register';
          toggle.textContent = 'Already have an account? Login';
        }
        message.textContent = '';
      });

      submitBtn.addEventListener('click', async () => {
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password || (!isLogin && !name)) {
          message.textContent = 'Please fill all fields.';
          return;
        }

        try {
          const endpoint = isLogin ? '/login' : '/register';
          const payload = isLogin ? { email, password } : { name, email, password };

          const res = await fetch(\`\${API_URL}\${endpoint}\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          const data = await res.json();

          if (res.ok) {
            message.style.color = '#22c55e';
            message.textContent = isLogin
              ? \`✅ Welcome \${data.user.name}\`
              : '✅ Registration successful! You can now login.';
            if (isLogin) {
              localStorage.setItem('token', data.token);
            }
          } else {
            message.style.color = '#f87171';
            message.textContent = data.message || 'Something went wrong';
          }
        } catch (err) {
          message.style.color = '#f87171';
          message.textContent = 'Server error';
        }
      });
    </script>
  </body>
  </html>`;
  res.send(html);
});

// ===== Start Server =====
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
