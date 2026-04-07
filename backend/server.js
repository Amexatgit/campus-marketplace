const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware - Increased limit to 10mb for Base64 image uploads
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Initialize SQLite Database
const dbPath = path.resolve(__dirname, "campus.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("Database opening error: ", err);
});

// Create Tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT
    )`);

  db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        price REAL,
        image TEXT,
        description TEXT,
        user_id INTEGER,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
});

// --- AUTHENTICATION ROUTES ---

app.post("/api/register", (req, res) => {
  const { email, password } = req.body;
  db.run(
    "INSERT INTO users (email, password) VALUES (?, ?)",
    [email, password],
    function (err) {
      if (err) return res.status(400).json({ error: "Email already exists" });
      res.json({ id: this.lastID, email });
    },
  );
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  db.get(
    "SELECT * FROM users WHERE email = ? AND password = ?",
    [email, password],
    (err, user) => {
      if (err || !user)
        return res.status(401).json({ error: "Invalid credentials" });
      res.json({ id: user.id, email: user.email });
    },
  );
});

// --- PRODUCT ROUTES ---

app.get("/api/products", (req, res) => {
  db.all("SELECT * FROM products ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get("/api/products/:id", (req, res) => {
  const query = `
        SELECT products.*, users.email AS seller_email 
        FROM products 
        JOIN users ON products.user_id = users.id 
        WHERE products.id = ?
    `;
  db.get(query, [req.params.id], (err, row) => {
    if (err || !row)
      return res.status(404).json({ error: "Product not found" });
    res.json(row);
  });
});

app.post("/api/products", (req, res) => {
  const { title, price, image, description, user_id } = req.body;
  db.run(
    "INSERT INTO products (title, price, image, description, user_id) VALUES (?, ?, ?, ?, ?)",
    [title, price, image, description, user_id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, title, price, image, description, user_id });
    },
  );
});

app.delete("/api/products/:id", (req, res) => {
  db.run("DELETE FROM products WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Deleted successfully" });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
