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

// Development endpoint to create default admin user
app.post('/api/auth/create-default-admin', async (req, res) => {
  try {
    // Check if any users exist
    const { rows: existingUsers } = await db.query('SELECT COUNT(*) as count FROM users');
    
    if (existingUsers[0].count > 0) {
      return res.status(400).json({ error: 'Users already exist in the system' });
    }
    
    // Create default admin user
    const defaultUsername = 'admin';
    const defaultPassword = 'admin123';
    const defaultName = 'Administrator';
    const defaultRole = 'admin';
    
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    const { rows } = await db.query(
      'INSERT INTO users (username, password, name, role, is_first_login) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, name, role',
      [defaultUsername, hashedPassword, defaultName, defaultRole, false]
    );
    
    res.json({
      message: 'Default admin user created successfully',
      user: rows[0],
      credentials: {
        username: defaultUsername,
        password: defaultPassword
      }
    });
  } catch (error) {
    console.error('Create default admin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const { rows } = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    const user = rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        isFirstLogin: user.is_first_login
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
    const { password, currentPassword } = req.body;
    const userId = req.user.userId;
    
    // If current password is provided, verify it (for existing users)
    if (currentPassword) {
      const { rows } = await db.query('SELECT password FROM users WHERE id = $1', [userId]);
      const user = rows[0];
      const isValid = await bcrypt.compare(currentPassword, user.password);
      
      if (!isValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update password and mark first login as complete
    await db.query('UPDATE users SET password = $1, is_first_login = false WHERE id = $2', [hashedPassword, userId]);
    
    // Log the password change
    await db.query('INSERT INTO logs (message, user_id) VALUES ($1, $2)', ['updated password', userId]);
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin-only middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// User management endpoints (admin only)
app.get('/api/admin/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id, username, name, role, is_first_login, created_at FROM users ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/admin/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { username, name, role, sendEmail } = req.body;
    
    // Check if username already exists
    const { rows: existingUsers } = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    // Create user
    const { rows } = await db.query(
      'INSERT INTO users (username, password, name, role, is_first_login) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, name, role',
      [username, hashedPassword, name, role, true]
    );
    
    const newUser = rows[0];
    
    // TODO: Send email with credentials if sendEmail is true
    
    res.status(201).json({
      user: newUser,
      tempPassword: tempPassword // Remove this in production, send via email instead
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/admin/users/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, role } = req.body;
    
    const { rows } = await db.query(
      'UPDATE users SET name = $1, role = $2 WHERE id = $3 RETURNING id, username, name, role',
      [name, role, userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/admin/users/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Don't allow deleting self
    if (userId == req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    const { rows } = await db.query('DELETE FROM users WHERE id = $1 RETURNING username', [userId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
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
