const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// home route redirects based on role
router.get("/", (req, res) => {
  if (req.session && req.session.user) {
    if (req.session.user.role === "admin") {
      return res.redirect("/admin/dashboard");
    }
    if (req.session.user.role === "lab-incharge") {
      return res.redirect("/lab-incharge/dashboard");
    }
    return res.redirect("/requester/dashboard");
  }
  res.redirect("/login");
});

// show register page
router.get("/register", (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect("/");
  }
  res.render("auth/register", { title: "Register" });
});

// handle register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      req.flash("error", "Please fill all fields!");
      return res.redirect("/register");
    }

    // check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      req.flash("error", "Email is already registered!");
      return res.redirect("/register");
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role
    });

    await newUser.save();
    req.flash("success", "Registration successful! Please login.");
    res.redirect("/login");
  } catch (err) {
    console.log("Error in register:", err);
    req.flash("error", "Something went wrong during registration.");
    res.redirect("/register");
  }
});

// show login page
router.get("/login", (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect("/");
  }
  res.render("auth/login", { title: "Login" });
});

// handle login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.flash("error", "Please enter both email and password!");
      return res.redirect("/login");
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      req.flash("error", "Invalid email or password!");
      return res.redirect("/login");
    }

    // check password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      req.flash("error", "Invalid email or password!");
      return res.redirect("/login");
    }

    // save user in session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    req.flash("success", "Login successful!");

    if (user.role === "admin") {
      res.redirect("/admin/dashboard");
    } else if (user.role === "lab-incharge") {
      res.redirect("/lab-incharge/dashboard");
    } else {
      res.redirect("/requester/dashboard");
    }
  } catch (err) {
    console.log("Error in login:", err);
    req.flash("error", "Something went wrong during login.");
    res.redirect("/login");
  }
});

// logout user
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

module.exports = router;
