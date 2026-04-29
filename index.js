import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";

import dotenv from 'dotenv'
import authRouter from "./src/routes/auth.js";


dotenv.config()
const app = express();


app.use(bodyParser.json({ limit: "30mb", extended: true }));

app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));

app.use(cors({
  origin: [ 'http://localhost:5173',  ,],
  credentials: true
}));

app.use('/api/auth', authRouter);



app.get('/', (req, res) => {
  res.send('Server is running!');
});

const CONNECTION_URL = process.env.CONNECTION_URL;
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;


mongoose.connect(CONNECTION_URL)
  .then(() => {
    console.log("✅ Successfully connected to MongoDB Atlas!");
    app.listen(PORT, () => console.log(`🚀 Server running on port: ${PORT}`));
  })
  .catch((error) => console.log("❌ MongoDB connection error:", error.message));

//mongodb+srv://admin:
