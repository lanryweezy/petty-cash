const express = require('express');
const cors = require('cors');
const db = require('./db');
const auth = require('./auth');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/signup', auth.signup);
app.post('/login', auth.login);

app.get('/requests', auth.protect, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM requests');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/requests', auth.protect, async (req, res) => {
  try {
    const { userId, amount, purpose, description } = req.body;
    const { rows } = await db.query(
      'INSERT INTO requests (user_id, amount, purpose, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, amount, purpose, description]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/requests/:id', auth.protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approvedBy } = req.body;
    const { rows } = await db.query(
      'UPDATE requests SET status = $1, approved_by = $2, approved_at = NOW() WHERE id = $3 RETURNING *',
      [status, approvedBy, id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/receipts', auth.protect, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM receipts');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/receipts', auth.protect, async (req, res) => {
  try {
    const { requestId, filePath, amount, merchant, notes, userId } = req.body;
    const { rows } = await db.query(
      'INSERT INTO receipts (request_id, file_path, amount, merchant, notes, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [requestId, filePath, amount, merchant, notes, userId]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/users', auth.protect, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/users', auth.protect, auth.signup);

app.put('/users/:id', auth.protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, roleId } = req.body;
    const { rows } = await db.query(
      'UPDATE users SET name = $1, role_id = $2 WHERE id = $3 RETURNING *',
      [name, roleId, id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/currencies', auth.protect, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM currencies');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/currencies', auth.protect, async (req, res) => {
  try {
    const { name, code, exchangeRate } = req.body;
    const { rows } = await db.query(
      'INSERT INTO currencies (name, code, exchange_rate) VALUES ($1, $2, $3) RETURNING *',
      [name, code, exchangeRate]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/currencies/:id', auth.protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, exchangeRate } = req.body;
    const { rows } = await db.query(
      'UPDATE currencies SET name = $1, code = $2, exchange_rate = $3 WHERE id = $4 RETURNING *',
      [name, code, exchangeRate, id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/currencies/set-default', auth.protect, async (req, res) => {
  try {
    const { id } = req.body;
    await db.query('UPDATE currencies SET is_default = false');
    await db.query('UPDATE currencies SET is_default = true WHERE id = $1', [id]);
    res.json({ message: 'Default currency updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/roles', auth.protect, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM roles');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/roles', auth.protect, async (req, res) => {
  try {
    const { name } = req.body;
    const { rows } = await db.query('INSERT INTO roles (name) VALUES ($1) RETURNING *', [name]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/roles/:id', auth.protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const { rows } = await db.query('UPDATE roles SET name = $1 WHERE id = $2 RETURNING *', [name, id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/roles/:id/permissions', auth.protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('SELECT * FROM role_permissions WHERE role_id = $1', [id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/roles/:id/permissions', auth.protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { permission } = req.body;
    const { rows } = await db.query(
      'INSERT INTO role_permissions (role_id, permission) VALUES ($1, $2) RETURNING *',
      [id, permission]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/roles/:id/permissions/:permissionId', auth.protect, async (req, res) => {
  try {
    const { permissionId } = req.params;
    await db.query('DELETE FROM role_permissions WHERE id = $1', [permissionId]);
    res.json({ message: 'Permission deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
