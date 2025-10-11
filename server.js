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

app.get("/api/allexpenses", async (req, res) => {
  try {
    const [expenses] = await pool.query(
      "SELECT * FROM expenses ORDER BY created_at DESC"
    );
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/expensesRequest", upload.single("bill"), async (req, res) => {
  try {
    const {
      id,
      date,
      employeeUsername,
      employeeName,
      type,
      invoiceNumber,
      amount,
      description,
    } = req.body;
    const bill = req.file;

    await pool.query(
      `INSERT INTO expenses 
       (id, date, employee_username, employee_name, type, invoiceNumber, amount, description, bill_data, bill_type, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [
        id,
        date,
        employeeUsername,
        employeeName,
        type,
        invoiceNumber,
        amount,
        description,
        bill ? bill.buffer : null,
        bill ? bill.mimetype : null,
      ]
    );

    res.json({ success: true, invoiceNumber });
  } catch (error) {
    console.error("Error submitting expense:", error);
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

    // Check if employee already checked in today
    const [existing] = await pool.query(
      `SELECT id FROM attendance 
       WHERE employee_id = ? 
       AND DATE(check_in) = CURDATE() 
       AND check_out IS NULL`,
      [employee_id]
    );

    if (existing.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Already checked in today" });
    }

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
              TIMESTAMPDIFF(MINUTE, check_in, check_out) AS worked_minutes,
              latitude, longitude
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

app.get("/api/leave/requests/:employee_id", async (req, res) => {
  const { employee_id } = req.params;
  let query = "";
  let values = [];

  if (employee_id) {
    // For employee: show only their own requests
    query = "SELECT * FROM leave_requests WHERE employee_id = ?";
    values = [employee_id];
  } else {
    // For admin: show all
    query = "SELECT * FROM leave_requests";
  }

  const [rows] = await pool.query(query, values);
  return res.json(rows);
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

app.post("/api/compensatory/request", async (req, res) => {
  try {
    const { employee_id, work_date, requested_date, reason } = req.body;

    // Prevent duplicate request for same date
    const [existing] = await pool.query(
      "SELECT id FROM compensatory_leave WHERE employee_id = ? AND work_date = ? AND requested_date = ?",
      [employee_id, work_date, requested_date]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Request already exists for that date",
      });
    }

    await pool.query(
      "INSERT INTO compensatory_leave (employee_id, work_date, requested_date, reason) VALUES (?, ?, ?, ?)",
      [employee_id, work_date, requested_date, reason]
    );

    res.json({
      success: true,
      message: "Compensatory leave request submitted",
    });
  } catch (error) {
    console.error("Compensatory leave error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.put("/api/compensatory/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approved_by } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    await pool.query(
      `UPDATE compensatory_leave 
       SET status = ?, approved_by = ?, approved_date = NOW() 
       WHERE id = ?`,
      [status, approved_by, id]
    );

    res.json({
      success: true,
      message: `Request ${status.toLowerCase()} successfully`,
    });
  } catch (error) {
    console.error("Update compensatory error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/compensatory/mine/:employee_id", async (req, res) => {
  try {
    const { employee_id } = req.params;
    const [data] = await pool.query(
      `SELECT c.id, c.work_date, c.requested_date, c.reason, c.status, c.approved_by, c.approved_date
       FROM compensatory_leave c
       WHERE c.employee_id = ?
       ORDER BY c.work_date DESC`,
      [employee_id]
    );

    res.json({ success: true, data });
  } catch (error) {
    console.error("Fetch compensatory error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/compensatory/requests", async (req, res) => {
  try {
    const [data] = await pool.query(
      `SELECT c.id, c.work_date, c.requested_date, c.reason, c.status, c.approved_by, c.approved_date
       FROM compensatory_leave c
       ORDER BY c.work_date DESC`
    );

    res.json({ success: true, data });
  } catch (error) {
    console.error("Fetch compensatory error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/expense-types", async (req, res) => {
  try {
    const { type_name, type_code } = req.body;

    if (!type_name || !type_code)
      return res
        .status(400)
        .json({ error: "Both type name and code are required" });

    await pool.query(
      "INSERT INTO expense_types (type_name, type_code) VALUES (?, ?)",
      [type_name, type_code.toUpperCase()]
    );

    res.json({ success: true, message: "Expense type added successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/expensesTypes", async (req, res) => {
  try {
    const [types] = await pool.query(
      "SELECT * FROM expense_types ORDER BY type_name"
    );
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//invoice generation endpoint can be added here
app.post("/api/expensesInvoice", async (req, res) => {
  try {
    // Format like LKPR1001, LKPR1002, etc.
    const { type } = req.body;
    if (!type) return res.status(400).json({ error: "Type is required" });

    // Fetch type_code from expense_types
    const [typeInfo] = await pool.query(
      "SELECT type_code FROM expense_types WHERE LOWER(type_name) = LOWER(?)",
      [type]
    );

    if (!typeInfo.length)
      return res.status(400).json({ error: "Invalid expense type" });

    const typeCode = typeInfo[0].type_code.toUpperCase();

    // ✅ Get last invoice for this type
    const [lastInvoice] = await pool.query(
      "SELECT invoiceNumber FROM expenses WHERE invoiceNumber LIKE ? ORDER BY id DESC LIMIT 1",
      [`${typeCode}%`]
    );

    let nextNumber = 1001; // Start from LKPR1001
    if (lastInvoice.length > 0 && lastInvoice[0].invoiceNumber) {
      const lastNum = parseInt(
        lastInvoice[0].invoiceNumber.replace(typeCode, "")
      );
      if (!isNaN(lastNum)) nextNumber = lastNum + 1;
    }

    const invoiceNumber = `${typeCode}${nextNumber}`;

    res.json({ success: true, invoiceNumber });

    //Format like LKPR-20251011-001
    // const typeCode = typeInfo[0].type_code;
    // // const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    // const [countRes] = await pool.query(
    //   "SELECT COUNT(*) AS count FROM expenses WHERE DATE(created_at)=CURDATE() AND type=?",
    //   [type]
    // );
    // const sequence = (countRes[0].count + 1).toString().padStart(3, "100");
    // Find the last invoice for this type_code

    //Format like LKPR1001, LKPR1002, etc.
    // const invoiceNumber = `${typeCode}${sequence}`;
    res.json({ success: true, invoiceNumber });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all attendance records with leave and compensatory info
app.get("/api/attendance", async (req, res) => {
  try {
    // Fetch all employees
    const [employees] = await pool.query(`SELECT id, name FROM employees`);

    // Fetch daily attendance
    const [attendanceRows] = await pool.query(`
      SELECT 
        a.employee_id,
        DATE(a.check_in) AS date,
        a.check_in,
        a.check_out,
        TIMESTAMPDIFF(MINUTE, a.check_in, a.check_out) AS worked_minutes
      FROM attendance a
      ORDER BY a.check_in DESC
    `);

    // Fetch all approved leave records
    const [leaveRows] = await pool.query(`
      SELECT employee_id, leave_type, start_date, end_date
      FROM leave_requests
      WHERE status='Approved'
    `);

    // Fetch all compensatory leave records
    const [compRows] = await pool.query(`
      SELECT employee_id, work_date, requested_date, status
      FROM compensatory_leave
    `);

    // Map for quick employee lookup
    const employeeMap = {};
    employees.forEach((e) => {
      employeeMap[e.id] = { id: e.id, name: e.name };
    });

    // Organize attendance + leaves by employee and date
    const dayMap = {};

    // 1️⃣ Attendance rows
    attendanceRows.forEach((a) => {
      const key = `${a.employee_id}-${a.date}`;
      dayMap[key] = {
        employee_id: a.employee_id,
        employee_name: employeeMap[a.employee_id].name,
        date: a.date,
        check_in: a.check_in,
        check_out: a.check_out,
        worked_minutes: a.worked_minutes,
        leaves: [],
        comp_leaves: [],
      };
    });

    // 2️⃣ Leaves
    leaveRows.forEach((l) => {
      const start = new Date(l.start_date);
      const end = new Date(l.end_date);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        const key = `${l.employee_id}-${dateStr}`;

        if (!dayMap[key]) {
          dayMap[key] = {
            employee_id: l.employee_id,
            employee_name: employeeMap[l.employee_id].name,
            date: dateStr,
            check_in: null,
            check_out: null,
            worked_minutes: 0,
            leaves: [],
            comp_leaves: [],
          };
        }
        dayMap[key].leaves.push({
          type: l.leave_type,
          start_date: l.start_date,
          end_date: l.end_date,
        });
      }
    });

    // 3️⃣ Comp leaves
    compRows.forEach((c) => {
      const dateStr = c.work_date.toISOString().split("T")[0];
      const key = `${c.employee_id}-${dateStr}`;

      if (!dayMap[key]) {
        dayMap[key] = {
          employee_id: c.employee_id,
          employee_name: employeeMap[c.employee_id].name,
          date: dateStr,
          check_in: null,
          check_out: null,
          worked_minutes: 0,
          leaves: [],
          comp_leaves: [],
        };
      }
      dayMap[key].comp_leaves.push({
        requested_date: c.requested_date,
        work_date: c.work_date,
        status: c.status,
      });
    });

    // 4️⃣ Aggregate total leaves per employee
    const totalLeavesMap = {};
    employees.forEach((e) => {
      totalLeavesMap[e.id] = { totalLeaves: 0, totalCompLeaves: 0 };
    });

    Object.values(dayMap).forEach((d) => {
      totalLeavesMap[d.employee_id].totalLeaves += d.leaves.length;
      totalLeavesMap[d.employee_id].totalCompLeaves += d.comp_leaves.length;
    });

    // Convert map to array
    const result = Object.values(dayMap).map((d) => ({
      ...d,
      totalLeaves: totalLeavesMap[d.employee_id].totalLeaves,
      totalCompLeaves: totalLeavesMap[d.employee_id].totalCompLeaves,
    }));

    res.json(result);
  } catch (err) {
    console.error("Error fetching attendance:", err);
    res.status(500).json({ error: "Failed to fetch attendance" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

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

initializeDatabase();
export default app;
