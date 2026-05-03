import express from "express";
import { getFollow, createFollow, deleteFollow } from "../controllers/follow.js";

const schemaFollow = new express.Router()