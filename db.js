const mysql = require('mysql2/promise');

//local db config
// const dbConfig = {
//   host: "localhost",
//   user: "lkprglobal_localdev",
//   password: "PdK1!gc8Ep%n",
//   database: "asset_management_app",
//   port: 3306,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0
// };

//hostinger db config
const dbConfig = {
  host: "srv1876.hstgr.io",
  user: "u238482420_lkpr_office",
  password: "CO^RAVc2dU@",
  database: "u238482420_assets_mgmnt",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

console.log('Database configuration:', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  port: dbConfig.port
});

const pool = mysql.createPool(dbConfig);

async function initializeDatabase() {
  const connection = await pool.getConnection();
  
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role ENUM('admin', 'manager', 'employee') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS assets (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT,
        status ENUM('Available', 'Borrowed') DEFAULT 'Available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS borrowings (
        id VARCHAR(50) PRIMARY KEY,
        asset_id VARCHAR(50) NOT NULL,
        asset_name VARCHAR(200) NOT NULL,
        borrower_username VARCHAR(50) NOT NULL,
        borrower_name VARCHAR(100) NOT NULL,
        borrow_date DATETIME NOT NULL,
        due_date DATETIME NOT NULL,
        returned_date DATETIME,
        purpose TEXT,
        status ENUM('Borrowed', 'Returned') DEFAULT 'Borrowed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE RESTRICT
      )
    `);
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(50) PRIMARY KEY,
        date DATE NOT NULL,
        employee_username VARCHAR(50) NOT NULL,
        employee_name VARCHAR(100) NOT NULL,
        type VARCHAR(100) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        bill_filename VARCHAR(255),
        status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
        payment_status ENUM('Pending Payment', 'Paid') DEFAULT 'Pending Payment',
        approved_by VARCHAR(50),
        approved_date DATETIME,
        rejected_by VARCHAR(50),
        rejected_date DATETIME,
        paid_date DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const [existingUsers] = await connection.query('SELECT COUNT(*) as count FROM users');
    if (existingUsers[0].count === 0) {
      await connection.query(`
        INSERT INTO users (username, password, name, role) VALUES
        ('admin', 'admin123', 'Admin User', 'admin'),
        ('manager', 'manager123', 'Manager User', 'manager'),
        ('employee', 'employee123', 'Employee User', 'employee')
      `);
      console.log('Default users created');
    }
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { pool, initializeDatabase };
