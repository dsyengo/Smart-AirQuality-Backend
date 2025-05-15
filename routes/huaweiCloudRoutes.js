import express from 'express';
import { getHuaweiCloudData } from '../controllers/huaweiCloudController.js';
import { getHuaweiCloudDataSim } from '../testCodes/simulatedData.js'
import { getRecommendations } from '../controllers/recommendationController.js';
import { getLatestData } from '../controllers/dataMonitor.js';
const router = express.Router();

// API Endpoint: GET /api/huawei-cloud
// Returns the latest data fetched from Huawei Cloud.
router.get('/huawei-cloud', getHuaweiCloudData);


// API Endpoint: GET /api/recommendation
// Returns the latest NLP analysis from the database
router.get('/recommendations', getRecommendations)


//API Endpoint: GET /api/simulate
//Uses simulated data 
router.get('/simulate', getHuaweiCloudDataSim)

//API Endpoint: GET /api/real-time-data
//Returns real-time data from the OBS
router.get('/air-quality/current', getLatestData)




export default router;