import express from 'express';
import { saveFcmToken, sendAirQualityAlert } from '../controllers/notificationController.js';
import { userAuth } from '../middleware/userAuth.js';

const router = express.Router();

// Save FCM token
router.post('/users/fcm-token', userAuth, saveFcmToken);

// Send air quality alert
router.post('/air-quality', sendAirQualityAlert);

export default router;