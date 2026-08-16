require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { db } = require('./src/config/firebase');
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Status : OK' });
});

app.use('/auth', authRoutes);
app.use('/api/user', userRoutes);
 console.log('Firebase Connected');  

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});