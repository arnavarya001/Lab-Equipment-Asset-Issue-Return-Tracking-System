const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;
const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/lab_equipment_db";

// connect to mongodb database
mongoose.connect(mongoURI)
  .then(() => {
    console.log("Database connected successfully!");
  })
  .catch((err) => {
    console.log("Database connection error:", err);
  });

// set view engine to ejs
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// middlewares for parsing body data and static files
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// session setup with mongodb store so sessions persist on vercel
app.use(session({
  secret: process.env.SESSION_SECRET || "mycollegesecretkey123",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: mongoURI
  })
}));

// flash messages setup
app.use(flash());

// pass user session and flash messages to all ejs views
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.messages = {
    success: req.flash("success"),
    error: req.flash("error")
  };
  next();
});

// import routes
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const requesterRoutes = require("./routes/requester");
const labInchargeRoutes = require("./routes/labIncharge");

// use routes
app.use("/", authRoutes);
app.use("/admin", adminRoutes);
app.use("/requester", requesterRoutes);
app.use("/lab-incharge", labInchargeRoutes);

// 404 page handler
app.use((req, res) => {
  res.status(404).render("auth/login", {
    title: "Page Not Found",
    messages: { error: "Page not found, redirected to login." }
  });
});

// start server (runs locally, on vercel the app is exported as serverless)
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server is running at port ${port}`);
  });
}

module.exports = app;
