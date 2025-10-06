const express = require('express');
const path = require('path');
const multer = require('multer');
const { pool, initializeDatabase } = require('./db');

const app = express();
const PORT = 5000;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(express.json());

app.post('/api/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ? AND password = ? AND role = ?',
      [username, password, role]
    );
    
    if (users.length > 0) {
      const user = users[0];
      res.json({
        success: true,
        user: {
          username: user.username,
          name: user.name,
          role: user.role
        }
      });
    } else {
      res.json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/assets', async (req, res) => {
  try {
    const [assets] = await pool.query('SELECT * FROM assets ORDER BY created_at DESC');
    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/assets', async (req, res) => {
  try {
    const { id, name, category, description } = req.body;
    await pool.query(
      'INSERT INTO assets (id, name, category, description, status) VALUES (?, ?, ?, ?, ?)',
      [id, name, category, description || null, 'Available']
    );
    res.json({ success: true, message: 'Asset created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/assets/:id', async (req, res) => {
  try {
    const { name, category, description } = req.body;
    await pool.query(
      'UPDATE assets SET name = ?, category = ?, description = ? WHERE id = ?',
      [name, category, description || null, req.params.id]
    );
    res.json({ success: true, message: 'Asset updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/assets/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM assets WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Asset deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/borrowings', async (req, res) => {
  try {
    const [borrowings] = await pool.query('SELECT * FROM borrowings ORDER BY created_at DESC');
    res.json(borrowings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/borrowings', async (req, res) => {
  try {
    const { id, assetId, assetName, borrowerUsername, borrowerName, borrowDate, dueDate, purpose } = req.body;
    
    await pool.query(
      'INSERT INTO borrowings (id, asset_id, asset_name, borrower_username, borrower_name, borrow_date, due_date, purpose, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, assetId, assetName, borrowerUsername, borrowerName, borrowDate, dueDate, purpose, 'Borrowed']
    );
    
    await pool.query('UPDATE assets SET status = ? WHERE id = ?', ['Borrowed', assetId]);
    
    res.json({ success: true, message: 'Item borrowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/borrowings/:id/return', async (req, res) => {
  try {
    const [borrowing] = await pool.query('SELECT * FROM borrowings WHERE id = ?', [req.params.id]);
    
    if (borrowing.length > 0) {
      await pool.query(
        'UPDATE borrowings SET status = ?, returned_date = NOW() WHERE id = ?',
        ['Returned', req.params.id]
      );
      
      await pool.query('UPDATE assets SET status = ? WHERE id = ?', ['Available', borrowing[0].asset_id]);
      
      res.json({ success: true, message: 'Item returned' });
    } else {
      res.status(404).json({ error: 'Borrowing not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/expenses', async (req, res) => {
  try {
    const [expenses] = await pool.query('SELECT * FROM expenses ORDER BY created_at DESC');
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/expenses', upload.single('bill'), async (req, res) => {
  try {
    const { id, date, employeeUsername, employeeName, type, amount, description } = req.body;
    const billFilename = req.file ? req.file.filename : null;
    
    await pool.query(
      'INSERT INTO expenses (id, date, employee_username, employee_name, type, amount, description, bill_filename, status, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, date, employeeUsername, employeeName, type, amount, description, billFilename, 'Pending', 'Pending Payment']
    );
    
    res.json({ success: true, message: 'Expense submitted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/expenses/:id/approve', async (req, res) => {
  try {
    const { approvedBy } = req.body;
    await pool.query(
      'UPDATE expenses SET status = ?, approved_by = ?, approved_date = NOW() WHERE id = ?',
      ['Approved', approvedBy, req.params.id]
    );
    res.json({ success: true, message: 'Expense approved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/expenses/:id/reject', async (req, res) => {
  try {
    const { rejectedBy } = req.body;
    await pool.query(
      'UPDATE expenses SET status = ?, rejected_by = ?, rejected_date = NOW() WHERE id = ?',
      ['Rejected', rejectedBy, req.params.id]
    );
    res.json({ success: true, message: 'Expense rejected' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/expenses/:id/pay', async (req, res) => {
  try {
    await pool.query(
      'UPDATE expenses SET payment_status = ?, paid_date = NOW() WHERE id = ?',
      ['Paid', req.params.id]
    );
    res.json({ success: true, message: 'Expense marked as paid' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// initializeDatabase()

initializeDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Office Asset & Expense Management System running on http://0.0.0.0:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// export default app