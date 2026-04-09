require("dns").setDefaultResultOrder("ipv4first");

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
require('./cron/expiryCheck');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/food', require('./routes/food'));
app.use('/api/admin', require('./routes/admin'));

// Ping route to wake up the server from cold start
app.get('/api/ping', (req, res) => res.status(200).send({ status: 'ok' }));

const mongoUri = process.env.MONGO_URI;
const port = process.env.PORT || 5000;

if (!mongoUri) {
  console.error("Missing MONGO_URI in environment.");
}

mongoose
  .connect(mongoUri)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("Mongo connection error:", err));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});