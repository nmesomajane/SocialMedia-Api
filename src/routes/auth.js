import express from "express"
import { signIn,signUp,signOut } from "../controllers/auth.js"
import authorised from "../middleware/auth.js"




const router = express.Router()

router.post('/signUp' ,signUp)
router.post('/signIn', signIn)
router.post('/signOut',signOut)
export  default router