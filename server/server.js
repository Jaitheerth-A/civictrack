require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const complaintRoutes = require("./routes/complaintRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

connectDB();

app.use("/api/complaints",complaintRoutes);
app.use("/api/admin",adminRoutes);

app.get("/",(req,res)=>{
res.send("CivicTrack API running");
});

const PORT = 8000;

app.listen(PORT,()=>{
console.log("Server running on port",PORT);
});
