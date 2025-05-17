import express from 'express'
import { historicalData } from '../controllers/historicalData.js';
import { userAuth } from '../middleware/userAuth.js';
const router = express.Router()

router.get("/historical", historicalData);

export default router