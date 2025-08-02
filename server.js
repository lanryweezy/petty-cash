const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./server/db');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// Serve uploaded files from the 'uploads' directory
app.use('/uploads', express.static(uploadsDir));

// Development endpoint to create default user (remove in production)
app.post('/api/auth/create-default-user', async (req, res) => {
  try {
    // Check if any users exist
    const { rows: existingUsers } = await db.query('SELECT COUNT(*) as count FROM users');
    
    if (existingUsers[0].count > 0) {
      return res.status(400).json({ error: 'Users already exist in the system' });
    }
    
    // Create default user
    const defaultEmail = 'admin@test.com';
    const defaultPassword = 'password123';
    const defaultName = 'Admin User';
    
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    const { rows } = await db.query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [defaultEmail, hashedPassword, defaultName]
    );
    
    res.json({
      message: 'Default user created successfully',
      user: rows[0],
      credentials: {
        email: defaultEmail,
        password: defaultPassword
      }
    });
  } catch (error) {
    console.error('Create default user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Check if user already exists
    const { rows: existingUsers } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const { rows } = await db.query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, hashedPassword, name]
    );
    
    const user = rows[0];
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

app.post('/api/auth/change-password', verifyToken, async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.userId;
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update password in database
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);
    
    // Log the password change
    await db.query('INSERT INTO logs (message, user_id) VALUES ($1, $2)', ['updated password', userId]);
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// File upload endpoint
app.post('/upload', upload.single('receipt'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  res.send({ filePath: `/uploads/${req.file.filename}` });
});

// Handle all other routes by serving the 'index.html' file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
