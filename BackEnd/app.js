require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const redis = require("redis");
const client = require('prom-client');
const register = client.register;

const app = express();
const port = process.env.PORT || 3000;

// Prometheus metrics endpoint
client.collectDefaultMetrics({ register });

// MySQL connection pool
const db = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});

// Redis client
const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || "6379"),
  }
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

(async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      await redisClient.auth({ password: process.env.REDIS_PASSWORD });
      console.log("Redis connected and authenticated.");
    }
  } catch (err) {
    console.error("Redis connection/auth error:", err);
  }
})();

app.use(cors({ origin: "*", methods: ["GET", "POST"] }));

// Ensure the `counter` table exists and has a row
const ensureTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS counter (
      id INT PRIMARY KEY AUTO_INCREMENT,
      value INT NOT NULL DEFAULT 0
    )
  `);

  const [rows] = await db.query("SELECT COUNT(*) as count FROM counter");
  if (rows[0].count === 0) {
    await db.query("INSERT INTO counter (value) VALUES (0)");
  }
};

// Increment route with robust Redis and MySQL handling
app.get("/api/increment", async (req, res) => {
  try {
    let cachedValue = null;

    try {
      cachedValue = await redisClient.get("counter");
    } catch (redisErr) {
      console.error("Redis get error:", redisErr);
    }

    if (cachedValue !== null) {
      const newValue = parseInt(cachedValue) + 1;
      try {
        await redisClient.set("counter", newValue.toString());
      } catch (redisSetErr) {
        console.error("Redis set error:", redisSetErr);
      }
      await db.query("UPDATE counter SET value = ?", [newValue]);
      return res.json({ counter: newValue });
    }

    // Redis cache miss or error: fallback to MySQL
    const [rows] = await db.query("SELECT value FROM counter LIMIT 1");
    let current = rows[0]?.value ?? 0;
    current++;
    await db.query("UPDATE counter SET value = ?", [current]);
    try {
      await redisClient.set("counter", current.toString());
    } catch (redisSetErr) {
      console.error("Redis set error:", redisSetErr);
    }
    res.json({ counter: current });
  } catch (err) {
    console.error("Error incrementing counter:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Test MySQL connection endpoint
app.get("/mysql", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 as test");
    res.send("MySQL connected");
  } catch (err) {
    console.error("MySQL test error:", err);
    res.status(500).send("MySQL test failed");
  }
});

// Test Redis connection endpoint
app.get("/redis", async (req, res) => {
  try {
    const pong = await redisClient.ping();
    res.send("Redis connected: " + pong);
  } catch (err) {
    console.error("Redis test error:", err);
    res.status(500).send("Redis test failed");
  }
});

// Create HTTP request duration histogram
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});



// Middleware to observe request durations
app.use((req, res, next) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  res.on('finish', () => {
    const routePath = req.route ? req.route.path : req.path; // safe fallback
    end({ method: req.method, route: routePath, status_code: res.statusCode });
  });
  next();
});


// Add /metrics endpoint for Prometheus scraping
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

// Start server after ensuring table is ready
(async () => {
  try {
    await ensureTable();
    app.listen(port, "0.0.0.0", () => {
      console.log(`Backend API listening at http://0.0.0.0:${port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
  }
})();
