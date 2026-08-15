const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
const PORT = 3000;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5
});

let dbReady = false;

function initDb(attempt = 1) {
  pool.query(
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100)
    )`,
    (err) => {
      if (err) {
        console.error(`⏳ DB not ready (attempt ${attempt}): ${err.message}`);
        setTimeout(() => initDb(attempt + 1), 5000);
      } else {
        dbReady = true;
        console.log('✅ Connected to MySQL database, table ready');
      }
    }
  );
}
initDb();

app.get('/api/users', (req, res) => {
  pool.query('SELECT * FROM users ORDER BY id DESC', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.get('/api/add', (req, res) => {
  pool.query('INSERT INTO users (name) VALUES (?)', ['Disha'], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'User added!' });
  });
});

app.get('/health', (req, res) => res.send('Backend is alive'));

app.get('/ready', (req, res) =>
  dbReady ? res.send('ready') : res.status(503).send('db not ready')
);

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));