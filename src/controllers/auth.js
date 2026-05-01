import express from "express";
import User from "../models/users.js"
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();



export const signUp = async (req, res, next) => {
    let session;
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ status: "error", message: "Request body is empty" })
        }

        const { first_name, last_name, bio, email, password } = req.body

        console.log("Signup attempt:", { email, first_name, last_name });
        
        session = await mongoose.startSession()
        session.startTransaction()

        // Check duplicate email
        const existingUser = await User.findOne({ email }).session(session)
        if (existingUser) {
            const error = new Error("Email already in use")
            error.statusCode = 400
            throw error
        }

        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10)

        const newUser = new User({
            first_name,
            last_name,
            bio,
            email,
            password: hashedPassword,
        })

        const savedUser = await newUser.save({ session })

        const token = jwt.sign(
            { userId: savedUser._id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }  // ✅ requirement says 1 hour
        )

        await session.commitTransaction()

        const userResponse = savedUser.toObject()
        delete userResponse.password  // ✅ never return password

        res.status(201).json({
            success: true,
            data: { user: userResponse, token }
        })

    } catch (error) {
        if (session) await session.abortTransaction()  // ✅ rollback on failure
        console.error("SIGNUP ERROR:", error.message)
        next(error)
    } finally {
        if (session) session.endSession()
    }
}

export const signIn = async (req, res, next) => {
    try {
        const { email, password } = req.body

        const user = await User.findOne({ email })
        if (!user) {
            const error = new Error("Invalid email or password")
            error.statusCode = 401
            throw error
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            const error = new Error("Invalid email or password")
            error.statusCode = 401
            throw error
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        )

        const userResponse = user.toObject()
        delete userResponse.password  // ✅ never return password

        res.status(200).json({
            success: true,
            data: { user: userResponse, token }
        })

    } catch (error) {
        next(error)
    }
}

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
