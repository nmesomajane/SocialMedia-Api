import express from "express";
import userschema from "../models/users.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const signUp = async (req, res, next) => {
  let session;
  const { firstname, lastname, email, password } = req.body;

  try {
    console.log("📝 Signup attempt:", { email, firstname, lastname });
    session = await mongoose.startSession();
    session.startTransaction();

    console.log("Received data:", {
      firstname,
      lastname,
      username,
      email,
      password ,
    });

    if (!firstname || !lastname || !email || !password) {
      const error = new Error("Please provide name, email, and password");
      error.statusCode = 400;
      throw error;
    }

    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      const error = new Error("Email already in use");
      error.statusCode = 400;
      throw error;
    }

    

  

    const newUser = new User({
      firstname,
      lastname,
      email,
      password,
    });

    const savedUser = await newUser.save({ session });

    console.log("User saved:", savedUser._id);

    if (!savedUser || !savedUser._id) {
      throw new Error("Failed to create user");
    }

    const token = jwt.sign({ userId: savedUser._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    await session.commitTransaction();

    console.log("Transaction committed successfully");

    const userResponse = savedUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    if (session) {
      await session.abortTransaction();
    }

    console.error("Sign Up Error:", error.message);
    console.error("Stack:", error.stack);

    next(error);
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

export const signIn = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    console.log("📝 Signup attempt:", { email, password });

    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }
    const ispasswordvalid = await bcrypt.compare(password, user.password);
    if (!ispasswordvalid) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    res.status(200).json({
      success: true,
      data: {
        user,
        token,
      },
    });
   
  } catch (error) {
    next(error);
  }
};

export const signOut = async (req, res, next) => {
  try {
    res.clearCookie("token");

    // Send success response
    res.status(200).json({
      message: "Logged out successfully",
      success: true,
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      message: "Something went wrong during logout",
      error: error.message,
    });
  }
};
