import express from 'express';
import {
    updateProfile,
    getProfile,
} from '../controllers/userController.js';
import { userAuth } from '../middleware/userAuth.js'

const router = express.Router();



router.patch('/profile', userAuth, updateProfile);
router.get('/profile', userAuth, getProfile);

export default router;