// PS 8: Lab Equipment & Asset Issue-Return Tracking System
// Entry point: app.js

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lab_equipment_db';

// 1. Connect to MongoDB Atlas / Local MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected successfully to MongoDB database');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });

// 2. Configure View Engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 3. Body Parsing & Static Assets Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 4. Session Configuration (Stores login sessions in MongoDB)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'lab_equipment_secret_session_key_2026',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGO_URI,
      collectionName: 'sessions',
      ttl: 24 * 60 * 60 // 1 day session lifespan
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      httpOnly: true // Mitigates XSS cookie theft
    }
  })
);

// 5. Connect Flash Messages Middleware
app.use(flash());

// 6. Global Variables for EJS Views (makes user session and flash messages available in all views)
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.messages = {
    success: req.flash('success'),
    error: req.flash('error')
  };
  next();
});

// 7. Mount Application Routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const requesterRoutes = require('./routes/requester');
const labInchargeRoutes = require('./routes/labIncharge');

app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/requester', requesterRoutes);
app.use('/lab-incharge', labInchargeRoutes);

// 8. 404 Error Handler
app.use((req, res) => {
  res.status(404).render('auth/login', {
    title: '404 - Page Not Found',
    messages: {
      error: 'The requested page does not exist. Redirected to login.'
    }
  });
});

// 9. Start Server
app.listen(PORT, () => {
  console.log(`🚀 Lab Equipment System running on http://localhost:${PORT}`);
});

module.exports = app;
