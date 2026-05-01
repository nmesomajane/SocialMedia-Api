import express from "express"

import { getUserById,updateProfile,deleteAccount,followUser,unfollowUser,getFollowing,getFollowers,getMyPosts } from "../controllers/users.js";
import authorised from "../middleware/auth.js";
import optionalAuth from "../middleware/optionalAuth.js";

const router = express.Router()

router.get('/me/posts', authorised, getMyPosts)
router.get('/:id', optionalAuth, getUserById)
router.patch('/me', authorised, updateProfile)
router.delete('/:id', authorised, deleteAccount)
router.post('/:id/follow', authorised, followUser)
router.delete('/:id/follow', authorised, unfollowUser)
router.get('/:id/following', authorised, getFollowing)
router.get('/:id/followers', authorised, getFollowers)


export default router