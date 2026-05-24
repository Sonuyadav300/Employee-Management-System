const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.log('❌ Database Error:', err.message);
    return;
  }
  console.log('✅ Database Connected Successfully!');
});

// ==========================================
// API ROUTES
// ==========================================

// GET all employees (with search)
app.get('/api/employees', (req, res) => {
  const search = req.query.search || '';
  const searchTerm = `%${search}%`;

  const sql = `
    SELECT * FROM employees
    WHERE name LIKE ?
       OR email LIKE ?
       OR department LIKE ?
       OR position LIKE ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [searchTerm, searchTerm, searchTerm, searchTerm], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    res.json({ success: true, data: results });
  });
});

// GET single employee by ID
app.get('/api/employees/:id', (req, res) => {
  const sql = 'SELECT * FROM employees WHERE id = ?';

  db.query(sql, [req.params.id], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, data: results[0] });
  });
});

// POST create new employee
app.post('/api/employees', (req, res) => {
  const { name, email, phone, department, position, salary, status } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: 'Name and email are required'
    });
  }

  const sql = `
    INSERT INTO employees (name, email, phone, department, position, salary, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [name, email, phone || null, department || null, position || null, salary || null, status || 'active'],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ success: false, message: 'Email already exists' });
        }
        return res.status(500).json({ success: false, message: err.message });
      }
      res.status(201).json({
        success: true,
        message: 'Employee created successfully',
        id: result.insertId
      });
    }
  );
});

// PUT update employee
app.put('/api/employees/:id', (req, res) => {
  const { name, email, phone, department, position, salary, status } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: 'Name and email are required'
    });
  }

  const sql = `
    UPDATE employees
    SET name=?, email=?, phone=?, department=?, position=?, salary=?, status=?
    WHERE id=?
  `;

  db.query(
    sql,
    [name, email, phone || null, department || null, position || null, salary || null, status, req.params.id],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ success: false, message: 'Email already exists' });
        }
        return res.status(500).json({ success: false, message: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }
      res.json({ success: true, message: 'Employee updated successfully' });
    }
  );
});

// DELETE employee
app.delete('/api/employees/:id', (req, res) => {
  const sql = 'DELETE FROM employees WHERE id = ?';

  db.query(sql, [req.params.id], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, message: 'Employee deleted successfully' });
  });
});

// ==========================================
// START SERVER
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API URL: http://localhost:${PORT}/api/employees`);
});