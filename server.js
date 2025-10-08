import express from "express";
import path from "path";
import multer from "multer";
import { pool, initializeDatabase } from "./db.js";

// const express = require("express");
// const path = require("path");
// const multer = require("multer");
// const { pool, initializeDatabase } = require("./db");

export const config = {
  api: {
    bodyParser: false, // multer will handle body parsing
  },
};

const app = express();
app.use(express.json());
const PORT = 5000;

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads/");
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix =
//       Date.now() + "-" + Math.random().toString(36).substr(2, 9);
//     cb(null, uniqueSuffix + "-" + file.originalname);
//   },
// });
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use(express.json());

app.post("/api/login", async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const [users] = await pool.query(
      "SELECT * FROM users WHERE username = ? AND password = ? AND role = ?",
      [username, password, role]
    );

    if (users.length > 0) {
      const user = users[0];
      res.json({
        success: true,
        user: {
          username: user.username,
          name: user.name,
          role: user.role,
        },
      });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/assets", async (req, res) => {
  try {
    const [assets] = await pool.query(
      "SELECT * FROM assets ORDER BY created_at DESC"
    );
    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/assets", async (req, res) => {
  try {
    const { id, name, category, type, description } = req.body;
    await pool.query(
      "INSERT INTO assets (id, name, category, type, description, status) VALUES (?, ?, ?, ?, ?, ?)",
      [id, name, category, type, description || null, "Available"]
    );
    res.json({ success: true, message: "Asset created" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/assets/:id", async (req, res) => {
  try {
    const { name, category, description } = req.body;
    await pool.query(
      "UPDATE assets SET name = ?, category = ?, description = ? WHERE id = ?",
      [name, category, description || null, req.params.id]
    );
    if (result.affectedRows > 0) {
      res.json({ success: true });
    } else {
      res.json({ success: false, message: "Insert failed" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/assets/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM assets WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Asset deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/borrowings", async (req, res) => {
  try {
    const [borrowings] = await pool.query(
      "SELECT * FROM borrowings ORDER BY created_at DESC"
    );
    res.json(borrowings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/borrowings", async (req, res) => {
  try {
    const {
      id,
      assetId,
      assetName,
      borrowerUsername,
      borrowerName,
      borrowDate,
      dueDate,
      purpose,
    } = req.body;

    await pool.query(
      "INSERT INTO borrowings (id, asset_id, asset_name, borrower_username, borrower_name, borrow_date, due_date, purpose, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        assetId,
        assetName,
        borrowerUsername,
        borrowerName,
        borrowDate,
        dueDate,
        purpose,
        "Borrowed",
      ]
    );

    await pool.query("UPDATE assets SET status = ? WHERE id = ?", [
      "Borrowed",
      assetId,
    ]);

    res.json({ success: true, message: "Item borrowed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/borrowings/:id/return", async (req, res) => {
  try {
    const [borrowing] = await pool.query(
      "SELECT * FROM borrowings WHERE id = ?",
      [req.params.id]
    );

    if (borrowing.length > 0) {
      await pool.query(
        "UPDATE borrowings SET status = ?, returned_date = NOW() WHERE id = ?",
        ["Returned", req.params.id]
      );

      await pool.query("UPDATE assets SET status = ? WHERE id = ?", [
        "Available",
        borrowing[0].asset_id,
      ]);

      res.json({ success: true, message: "Item returned" });
    } else {
      res.status(404).json({ error: "Borrowing not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/expenses", async (req, res) => {
  try {
    const [expenses] = await pool.query(
      "SELECT * FROM expenses ORDER BY created_at DESC"
    );
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/expenses", upload.single("bill"), async (req, res) => {
  try {
    const {
      id,
      date,
      employeeUsername,
      employeeName,
      type,
      amount,
      description,
    } = req.body;

    const billData = req.file ? req.file.buffer : null;
    const billType = req.file ? req.file.mimetype : null;

    await pool.query(
      "INSERT INTO expenses (id, date, employee_username, employee_name, type, amount, description, status, payment_status, bill_data, bill_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        date,
        employeeUsername,
        employeeName,
        type,
        amount,
        description,
        "Pending",
        "Pending Payment",
        billData,
        billType,
      ]
    );

    res.json({ success: true, message: "Expense submitted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/expenses/:id/approve", async (req, res) => {
  try {
    const { approvedBy } = req.body;
    await pool.query(
      "UPDATE expenses SET status = ?, approved_by = ?, approved_date = NOW() WHERE id = ?",
      ["Approved", approvedBy, req.params.id]
    );
    res.json({ success: true, message: "Expense approved" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/expenses/:id/reject", async (req, res) => {
  try {
    const { rejectedBy } = req.body;
    await pool.query(
      "UPDATE expenses SET status = ?, rejected_by = ?, rejected_date = NOW() WHERE id = ?",
      ["Rejected", rejectedBy, req.params.id]
    );
    res.json({ success: true, message: "Expense rejected" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/expenses/:id/pay", async (req, res) => {
  try {
    await pool.query(
      "UPDATE expenses SET payment_status = ?, paid_date = NOW() WHERE id = ?",
      ["Paid", req.params.id]
    );
    res.json({ success: true, message: "Expense marked as paid" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all employees
app.get("/api/users", async (req, res) => {
  try {
    const [users] = await pool.query("SELECT id, name FROM employees");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check-in
app.post("/api/checkin", async (req, res) => {
  try {
    const { employee_id, latitude, longitude } = req.body;
    const time = new Date();
    await pool.query(
      "INSERT INTO attendance (employee_id, check_in, latitude, longitude) VALUES (?, ?, ?, ?)",
      [employee_id, time, latitude, longitude]
    );
    res.json({ success: true, message: "Checked in successfully", time });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check-out
app.post("/api/checkout", async (req, res) => {
  try {
    const { employee_id } = req.body;
    const time = new Date();
    await pool.query(
      "UPDATE attendance SET check_out=? WHERE employee_id=? AND DATE(check_in)=CURDATE()",
      [time, employee_id]
    );
    res.json({ success: true, message: "Checked out successfully", time });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get monthly attendance with worked hours
app.get("/api/attendance/:employee_id", async (req, res) => {
  try {
    const employee_id = req.params.employee_id;
    const [attendance] = await pool.query(
      `SELECT id, check_in, check_out,
              TIMESTAMPDIFF(MINUTE, check_in, check_out) AS worked_minutes
       FROM attendance
       WHERE employee_id=? AND MONTH(check_in)=MONTH(CURDATE())
       ORDER BY check_in DESC`,
      [employee_id]
    );
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Apply for leave (Employee)
app.post("/api/leave/apply", async (req, res) => {
  try {
    const { employee_id, name, leave_type, start_date, end_date, reason } =
      req.body;
    await pool.query(
      "INSERT INTO leave_requests (employee_id, name, leave_type, start_date, end_date, reason) VALUES (?, ?, ?, ?, ?, ?)",
      [employee_id, name, leave_type, start_date, end_date, reason]
    );
    res.json({ success: true, message: "Leave request submitted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/leave/requests", async (req, res) => {
  const [requests] = await pool.query(
    `SELECT lr.id, lr.employee_id, e.name, lr.leave_type, lr.start_date, lr.end_date, lr.reason, lr.status
     FROM leave_requests lr
     JOIN employees e ON lr.employee_id = e.id
     ORDER BY lr.start_date DESC`
  );
  return res.json(requests);
});

// Approve or Reject leave (Admin)
app.post("/api/leave/update", async (req, res) => {
  try {
    const { leave_id, status } = req.body; // status = 'Approved' or 'Rejected'
    await pool.query("UPDATE leave_requests SET status=? WHERE id=?", [
      status,
      leave_id,
    ]);
    res.json({ success: true, message: `Leave ${status.toLowerCase()}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new employee (Admin)
app.post("/api/employees", async (req, res) => {
  try {
    const { name } = req.body;
    const [result] = await pool.query(
      "INSERT INTO employees (name) VALUES (?)",
      [name]
    );
    res.json({
      success: true,
      message: "Employee added successfully",
      id: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Edit employee
app.put("/api/employees/:id", async (req, res) => {
  try {
    const { name } = req.body;
    await pool.query("UPDATE employees SET name=? WHERE id=?", [
      name,
      req.params.id,
    ]);
    res.json({ success: true, message: "Employee updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete employee
app.delete("/api/employees/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM employees WHERE id=?", [req.params.id]);
    res.json({ success: true, message: "Employee deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
initializeDatabase();

// initializeDatabase()
//   .then(() => {
//     app.listen(PORT, "0.0.0.0", () => {
//       console.log(
//         `Office Asset & Expense Management System running on http://0.0.0.0:${PORT}`
//       );
//     });
//   })
//   .catch((err) => {
//     console.error("Failed to initialize database:", err);
//     process.exit(1);
//   });

export default app;
