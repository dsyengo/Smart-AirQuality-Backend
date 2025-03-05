import { fetchLatestCloudData } from '../services/huaweiCloudService.js'
import { calculateAQI } from '../utils/aqiCalculator.js';
import OBSData from '../models/sensor-data.js';
import { formToJSON } from 'axios';


export const getData = async (req, res, next) => {
    try {
        const data = await fetchLatestCloudData()
        if (data) {
            //calculateAQI
            const AQI = calculateAQI(data)

            //save to database
            const UIData = {
                data,
                AQI
            }

            const frontendData = await OBSData.create({ data: UIData });

            //return to client
            res.json({
                success: true,
                data: frontendData,
            })
            console.log('Data sent to user:', frontendData)
        } else {
            res.status(503).json({
                success: false,
                message: 'Error fetching data from the OBS'
            })
        }
    } catch (error) {
        next(error)
    }
}