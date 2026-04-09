require('dotenv').config(); // Must be first!

const express = require('express');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 4005;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const blogs = require('./routes/blog');
const authRoutes = require('./routes/auth');

app.use('/api/v1', blogs);
app.use('/api/v1/auth', authRoutes);

app.use((err, req, res, next) => {
  if (!err) return next();
  console.error(err);
  res.status(400).json({ success: false, message: err.message || 'Request failed' });
});

app.get('/', (req, res) => {
  res.json({ message: 'Blog API is running!', version: '1.0' });
});

// DB Connect
const dbConnect = require('./config/database');
dbConnect();

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
