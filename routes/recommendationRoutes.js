import express from 'express'
import { personalizedRecommendations, generalRecommendations } from '../controllers/recommendationsController.js'
import { userAuth } from '../middleware/userAuth.js';
const router = express.Router()

router.get("/general", generalRecommendations);

router.get("/personalized", personalizedRecommendations);



export default router