const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'mahash_db',
      port: 3306
    });
    
    await pool.query('DELETE FROM mahash_assets WHERE category = "logo" AND name LIKE "%silence%" OR name LIKE "%سکوت%"');
    console.log("Deleted any custom silence logo");
    process.exit(0);
  } catch (err) {
    console.log("Error or no DB:", err.message);
  }
}
run();
