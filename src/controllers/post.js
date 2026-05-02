import express from 'express'
import Post from '../models/post.js'
import users from '../models/users.js'  


export const createPost = async (req, res, next) => {
    try {
        const { title, content, tags } = req.body
       
        if (!title || !content) {
            return res.status(400).json({ 
                success: false, 
                message: 'Title and content are required' 
            })
        }

        const post = await Post.create({
            title,
            content,
            tags: tags || [],
            author: req.user._id,
            state: 'draft'
           
        })

        res.status(201).json({ 
            success: true, 
            message: 'Post created as draft',
            data: { post } 
        })
    } catch (error) {
        next(error)
        
    }
}

// GET ALL PUBLISHED POSTS
export const getAllPosts = async (req, res, next) => {
    try {
        // Extract query params with defaults
        const { 
            page = 1,          
            limit = 20,      
            search,           
            author,            
            orderBy = 'createdAt'  
        } = req.query

        const skip = (page - 1) * limit
       
        const query = { state: 'published' }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
               
                
                { tags: { $regex: search, $options: 'i' } }
            ]
        }

        //  FILTER BY AUTHOR NAME  
        if (author) {
            // First find users whose name matches the search
            const users = await User.find({
                $or: [
                    { first_name: { $regex: author, $options: 'i' } },
                    { last_name:  { $regex: author, $options: 'i' } },
                    { username:   { $regex: author, $options: 'i' } }
                ]
            }).select('_id')
           

            const userIds = users.map(u => u._id)
            query.author = { $in: userIds }
            
        }

        //  ORDERING 
        
        const allowedSortFields = ['like_count', 'comment_count', 'createdAt']
        const sortField = allowedSortFields.includes(orderBy) ? orderBy : 'createdAt'

        const sortOptions = {}
        if (sortField === 'like_count') {
            sortOptions['likes'] = -1
            
        } else {
            sortOptions[sortField] = -1
        }

        //  EXECUTES QUERY 
        const [posts, total] = await Promise.all([
            Post.find(query)
                .populate('author', 'first_name last_name username')
                
                .sort(sortOptions)
                .skip(Number(skip))
                .limit(Number(limit)),
            Post.countDocuments(query)
         
        ])

        res.status(200).json({
            success: true,
            data: {
                posts,
                pagination: {
                    page:  Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / limit)
                   
                }
            }
        })
    } catch (error) {
        next(error)
    }
}


export const getPostById = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('author', 'first_name last_name username bio')
            
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' })
        }

        
        const isOwner = req.user && req.user._id.toString() === post.author._id.toString()
        if (post.state === 'draft' && !isOwner) {
            return res.status(404).json({ success: false, message: 'Post not found' })
     
        }

        res.status(200).json({ success: true, data: { post } })
    } catch (error) {
        next(error)
    }
}

export const publishPost = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id)

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' })
        }

        //  only the author can publish
        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' })
           
        }

        post.state = 'published'
        await post.save()
        

        res.status(200).json({ 
            success: true, 
            message: 'Post published',
            data: { post } 
        })
    } catch (error) {
        next(error)
    }
}

// update post 
export const updatePost = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id)

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' })
        }

        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' })
        }

        // Only allow editing specific fields — never let user change author or 
        const allowedFields = ['title', 'content', 'tags']
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) post[field] = req.body[field]
          
        })

        await post.save()

        res.status(200).json({ success: true, data: { post } })
    } catch (error) {
        next(error)
    }
}

// delete post
export const deletePost = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id)

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' })
        }

        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' })
        }

        await Post.findByIdAndDelete(req.params.id)

        res.status(200).json({ success: true, message: 'Post deleted successfully' })
    } catch (error) {
        next(error)
    }
}


// like post
export const likePost = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id)

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' })
        }

        const alreadyLiked = post.likes.includes(req.user._id)
        // .includes() checks if the userId is already in the likes array
        // Requirement #27 — prevents liking same post twice

        if (alreadyLiked) {
            return res.status(400).json({ success: false, message: 'Post already liked' })
        }

        await Post.findByIdAndUpdate(
            req.params.id,
            { $push: { likes: req.user._id } },
        
            { new: true }
        )

        res.status(200).json({ success: true, message: 'Post liked' })
    } catch (error) {
        next(error)
    }
}

// unlike post
export const unlikePost = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id)

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' })
        }

        const hasLiked = post.likes.includes(req.user._id)
        if (!hasLiked) {
            return res.status(400).json({ success: false, message: "You haven't liked this post" })
        }

        await Post.findByIdAndUpdate(
            req.params.id,
            { $pull: { likes: req.user._id } }
            // $pull removes matching element from array
            // Opposite of $push
        )

        res.status(200).json({ success: true, message: 'Post unliked' })
    } catch (error) {
        next(error)
    }
}


// get feed
export const getFeed = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query
        const skip = (page - 1) * limit

        let authorIds = []

        if (req.user) {
         
            const me = await User.findById(req.user._id).select('following')
            authorIds = [...me.following, req.user._id]
            
        }

        const query = {
            state: 'published',
            ...(authorIds.length > 0 && { author: { $in: authorIds } })
         
        }

        const [posts, total] = await Promise.all([
            Post.find(query)
                .populate('author', 'first_name last_name username')
                .sort({ createdAt: -1 })
                .skip(Number(skip))
                .limit(Number(limit)),
            Post.countDocuments(query)
        ])

        res.status(200).json({
            success: true,
            data: {
                posts,
                pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) }
            }
        })
    } catch (error) {
        next(error)
    }
}