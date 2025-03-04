import express from 'express';
import { getHuaweiCloudData } from '../controllers/huaweiCloudController.js';

const router = express.Router();

// API Endpoint: GET /api/huawei-cloud
// Returns the latest data fetched from Huawei Cloud.
router.get('/huawei-cloud', getHuaweiCloudData);

// router.get('/sensor-data',)

// router.get('/recommendations')

// router.get('/analysis')

// router.get()

export default router;