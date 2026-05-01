import express from "express"

import mongoose from "mongoose";
import userschema from "../models/users.js";


export const getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await userschema.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, user });
    }
    catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ success: false, message: 'Server error, unable to fetch user' });

    }
};

export const updateProfile = async (req, res) => {
    try {
        
        const allowedFields = ['first_name', 'last_name', 'username', 'email', 'bio']
        const updates = {}

        
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) updates[field] = req.body[field]
        })

        const user = await User.findByIdAndUpdate(
            req.user._id,      
            { $set: updates },
            { new: true, runValidators: true }  
        ).select('-password')

        res.json({ success: true, user })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error, unable to update profile' })
    }
}

export const deleteAccount = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.user._id)
        res.json({ success: true, message: 'Account deleted successfully' })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error, unable to delete account' })
    }
}

export const followUser = async (req, res) => {
    try {
        const targetId = req.params.id         // person to follow
        const myId = req.user._id.toString()   // person doing the following

        // cannot follow yourself
        if (targetId === myId) {
            return res.status(400).json({ success: false, message: "You can't follow yourself" })
        }

        const targetUser = await User.findById(targetId)
        if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' })

        // cannot follow same user twice
        if (targetUser.followers.includes(myId)) {
            return res.status(400).json({ success: false, message: 'You already follow this user' })
        }

        
        await Promise.all([
            User.findByIdAndUpdate(targetId, { $push: { followers: myId } }),
            User.findByIdAndUpdate(myId,     { $push: { following: targetId } })
        ])

        res.json({ success: true, message: 'User followed successfully' })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error, unable to follow user' })
    }
}

export const unfollowUser = async (req, res) => {
    try {
        const targetId = req.params.id
        const myId = req.user._id.toString()

        
        const me = await User.findById(myId)
        if (!me.following.includes(targetId)) {
            return res.status(400).json({ success: false, message: "You don't follow this user" })
        }

        await Promise.all([
            User.findByIdAndUpdate(targetId, { $pull: { followers: myId } }),
            User.findByIdAndUpdate(myId,     { $pull: { following: targetId } })
        ])

        res.json({ success: true, message: 'Unfollowed successfully' })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' })
    }
}

export const getFollowing = async (req, res) => {
    try {
       
        const user = await User.findById(req.params.id)
            .populate('following', 'first_name last_name username')
            .select('following')

        if (!user) return res.status(404).json({ success: false, message: 'User not found' })

        res.json({ success: true, following: user.following })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' })
    }
}

export const getFollowers = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('followers', 'first_name last_name username')
            .select('followers')

        if (!user) return res.status(404).json({ success: false, message: 'User not found' })

        res.json({ success: true, followers: user.followers })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' })
    }
}

export const getMyPosts = async (req, res) => {
    try {
        const { page = 1, limit = 10, state } = req.query
        const skip = (page - 1) * limit

        
        const query = { author: req.user._id }
        if (state) query.state = state   

        const [posts, total] = await Promise.all([
            Post.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
            Post.countDocuments(query)
        ])

        res.json({
            success: true,
            posts,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' })
    }
}
