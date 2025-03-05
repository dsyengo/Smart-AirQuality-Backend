import express from 'express';
import { getHuaweiCloudData } from '../controllers/huaweiCloudController.js';
import { getData } from '../controllers/dataMonitor.js';
import { getHuaweiCloudDataSim } from '../testCodes/simulatedData.js'
import { getRecommendations } from '../controllers/recommendationController.js';
const router = express.Router();

// API Endpoint: GET /api/huawei-cloud
// Returns the latest data fetched from Huawei Cloud.
router.get('/huawei-cloud', getHuaweiCloudData);

//API Endpoint: GET /api/sensor-data
//Returns sensor data from the OBS and serve it to the client
router.get('/sensor-data', getData)

// API Endpoint: GET /api/recommendation
// Returns the latest NLP analysis from the database
router.get('/recommendations', getRecommendations)


//API Endpoint: GET /api/simulate
//Uses simulated data 
router.get('/simulate', getHuaweiCloudDataSim)



// router.get()

export default router;