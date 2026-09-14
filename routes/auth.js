const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Landing / Root Route: Redirects based on authentication state
router.get('/', (req, res) => {
  if (req.session && req.session.user) {
    if (req.session.user.role === 'admin') return res.redirect('/admin/dashboard');
    if (req.session.user.role === 'lab-incharge') return res.redirect('/lab-incharge/dashboard');
    return res.redirect('/requester/dashboard');
  }
  res.redirect('/login');
});

// GET /register: Render registration form
router.get('/register', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/');
  }
  res.render('auth/register', { title: 'Register - Lab Equipment System' });
});

// POST /register: Create new user account
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      req.flash('error', 'All fields are required.');
      return res.redirect('/register');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      req.flash('error', 'An account with this email already exists.');
      return res.redirect('/register');
    }

    // Hash password with salt rounds = 10
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role
    });

    await newUser.save();
    req.flash('success', 'Registration successful! You can now log in.');
    res.redirect('/login');
  } catch (err) {
    console.error('Registration Error:', err);
    req.flash('error', 'An error occurred during registration. Please try again.');
    res.redirect('/register');
  }
});

// GET /login: Render login form
router.get('/login', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/');
  }
  res.render('auth/login', { title: 'Login - Lab Equipment System' });
});

// POST /login: Authenticate user & start session
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.flash('error', 'Please provide both email and password.');
      return res.redirect('/login');
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/login');
    }

    // Verify password hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/login');
    }

    // Store user session (exclude password)
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    req.flash('success', `Welcome back, ${user.name}!`);

    // Redirect based on role
    if (user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    } else if (user.role === 'lab-incharge') {
      return res.redirect('/lab-incharge/dashboard');
    } else {
      return res.redirect('/requester/dashboard');
    }
  } catch (err) {
    console.error('Login Error:', err);
    req.flash('error', 'An error occurred during login. Please try again.');
    res.redirect('/login');
  }
});

// GET /logout: Destroy session & logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/login');
  });
});

module.exports = router;
