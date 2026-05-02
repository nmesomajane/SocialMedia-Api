import express from 'express'

import { createPost, getPostById, updatePost, deletePost, likePost, unlikePost, getFeed ,publishPost,getAllPosts } from '../controllers/post.js';
import authorised from '../middleware/auth.js';
import optionalAuth from '../middleware/optionalAuth.js';

const router = express.Router()

router.post('/', authorised, createPost)
router.get('/:id',optionalAuth, getPostById)
router.patch('/:id', authorised, updatePost)
router.delete('/:id', authorised, deletePost)
router.post('/:id/like', authorised, likePost)
router.delete('/:id/like', authorised, unlikePost)
router.get('/feed', optionalAuth, getFeed)
router.patch('/:id/publish', authorised, publishPost)
router.get('/', optionalAuth, getAllPosts)

export default router