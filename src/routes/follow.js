import express from "express";
import { followUser, unfollowUser, getFollowing, getFollowers } from "../controllers/users.js";
import authorised from "../middleware/auth.js";
import optionalAuth from "../middleware/optionalAuth.js";

const router = express.Router()

router.post('/:id/follow', authorised, followUser)
router.delete('/:id/follow', authorised, unfollowUser)
router.get('/:id/following', optionalAuth, getFollowing)
router.get('/:id/followers', optionalAuth, getFollowers)

export default router