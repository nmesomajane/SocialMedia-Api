import express from "express";
import users from "../models/users.js";    

export const followUser = async (req, res, next) => {  
    try {
        const userToFollow = await User.findById(req.params.id)
        if (!userToFollow) {
            return res.status(404).json({ success: false, message: 'User not found' })
        }

        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'You cannot follow yourself' })
        }

        if (userToFollow.followers.includes(req.user._id)) {
            return res.status(400).json({ success: false, message: 'You are already following this user' })
        }

      
        await Promise.all([
            User.findByIdAndUpdate(req.params.id, { $push: { followers: req.user._id } }),
            User.findByIdAndUpdate(req.user._id,  { $push: { following: req.params.id } })
        ])

        res.status(200).json({ success: true, message: 'User followed successfully' })
    } catch (error) {
        next(error) 
    }
}

export const unfollowUser = async (req, res, next) => {
    try {
        const userToUnfollow = await User.findById(req.params.id)

        if (!userToUnfollow) {
            return res.status(404).json({ success: false, message: 'User not found' })
        }

        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'You cannot unfollow yourself' })
        }

        if (!userToUnfollow.followers.includes(req.user._id)) {
            return res.status(400).json({ success: false, message: 'You are not following this user' })
        }

       
        await Promise.all([
            User.findByIdAndUpdate(req.params.id, { $pull: { followers: req.user._id } }),
            User.findByIdAndUpdate(req.user._id,  { $pull: { following: req.params.id } })
        ])

        res.status(200).json({ success: true, message: 'User unfollowed successfully' })
    } catch (error) {
        next(error)
    }
}


export const getFollowing = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('following', 'first_name last_name username bio')
           

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' })
        }

        res.status(200).json({ 
            success: true, 
            count: user.following.length,  
            data: { following: user.following } 
        })
    } catch (error) {
        next(error)
    }
}


export const getFollowers = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('followers', 'first_name last_name username bio')

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' })
        }

        res.status(200).json({ 
            success: true, 
            count: user.followers.length,
            data: { followers: user.followers } 
        })
    } catch (error) {
        next(error)
    }
}