import express from 'express';
import { getHuaweiCloudData } from '../controllers/huaweiCloudController.js';
import { getData } from '../controllers/dataMonitor.js';
import { getHuaweiCloudDataSim } from '../testCodes/simulatedData.js'
const router = express.Router();

// API Endpoint: GET /api/huawei-cloud
// Returns the latest data fetched from Huawei Cloud.
router.get('/huawei-cloud', getHuaweiCloudData);

//API Endpoint: GET /api/sensor-data
router.get('/sensor-data', getData)

// router.get('/recommendations')

router.get('/simulate', getHuaweiCloudDataSim)

// router.get()

export default router;