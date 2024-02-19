// Importing necessary modules
import express from "express"; // Importing Express.js framework
import path from "path"; // Path module for dealing with file paths
import mongoose from "mongoose"; // Mongoose for MongoDB object modeling
import cookieParser from "cookie-parser"; // Cookie parser middleware
import jwt from "jsonwebtoken"; // JSON Web Token implementation
import bcrypt from "bcrypt"; // Bcrypt for password hashing

// Connect to MongoDB database
mongoose
  .connect("mongodb://127.0.0.1:27017", { // Connecting to MongoDB server running locally
    dbName: "backend", // Database name
  })
  .then(() => console.log("Database Connected")) // Log successful connection
  .catch((e) => console.log(e)); // Log any errors

// Define user schema for MongoDB
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

// Create User model using user schema
const User = mongoose.model("User", userSchema);

// Create Express application
const app = express();

// Middleware setup
app.use(express.static(path.join(path.resolve(), "public"))); // Serve static files from the "public" directory
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies

// View Engine setup (using EJS)
app.set("view engine", "ejs");

// Authentication Middleware to check if user is authenticated
const isAuthenticated = async (req, res, next) => {
  const { token } = req.cookies; // Extract JWT token from cookies
  if (token) {
    // If token exists
    const decoded = jwt.verify(token, "sdjasdbajsdbjasd"); // Verify the token's authenticity
    req.user = await User.findById(decoded._id); // Find user by decoded user ID
    next(); // Proceed to the next middleware
  } else {
    // If token doesn't exist
    res.redirect("/login"); // Redirect user to login page
  }
};

// Routes setup

// Home route
app.get("/", isAuthenticated, (req, res) => {
  res.render("logout", { name: req.user.name }); // Render logout page with user's name
});

// Login route
app.get("/login", (req, res) => {
  res.render("login"); // Render login page
});

// Register route
app.get("/register", (req, res) => {
  res.render("register"); // Render register page
});

// Login form submission route
app.post("/login", async (req, res) => {
  const { email, password } = req.body; // Extract email and password from request body

  let user = await User.findOne({ email }); // Find user by email

  if (!user) return res.redirect("/register"); // If user not found, redirect to register page

  const isMatch = await bcrypt.compare(password, user.password); // Compare passwords

  if (!isMatch)
    return res.render("login", { email, message: "Incorrect Password" }); // If passwords don't match, render login page with error message

  // If authentication successful, create JWT token
  const token = jwt.sign({ _id: user._id }, "sdjasdbajsdbjasd");

  // Set token in cookie
  res.cookie("token", token, {
    httpOnly: true, // HttpOnly flag for security
    expires: new Date(Date.now() + 60 * 1000), // Token expiration time (1 minute)
  });
  
  // Redirect to home page
  res.redirect("/");
});

// Register form submission route
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body; // Extract name, email, and password from request body

  let user = await User.findOne({ email }); // Check if user with given email already exists
  if (user) {
    return res.redirect("/login"); // If user exists, redirect to login page
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user
  user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  // Create JWT token for new user
  const token = jwt.sign({ _id: user._id }, "sdjasdbajsdbjasd");

  // Set token in cookie
  res.cookie("token", token, {
    httpOnly: true, // HttpOnly flag for security
    expires: new Date(Date.now() + 60 * 1000), // Token expiration time (1 minute)
  });
  
  // Redirect to home page
  res.redirect("/");
});

// Logout route
app.get("/logout", (req, res) => {
  // Clear token cookie
  res.cookie("token", null, {
    httpOnly: true, // HttpOnly flag for security
    expires: new Date(Date.now()), // Expire immediately
  });
  
  // Redirect to home page
  res.redirect("/");
});

// Start server
app.listen(5000, () => {
  console.log("Server is working");
});
