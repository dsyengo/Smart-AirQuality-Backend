import { getLatestData } from '../services/huaweiCloudService.js';
import DataModel from '../models/data.js';

/**
 * Controller that handles API requests to retrieve the latest Huawei Cloud data.
 * If data is available, it saves the data to the database and returns it to the client;
 * otherwise, it sends a 503 status.
 */
export const getHuaweiCloudData = async (req, res, next) => {
    try {
        const data = getLatestData();
        if (data) {
            // Save the latest data in the database.
            const savedEntry = await DataModel.create({ data });
            res.json({
                success: true,
                data: savedEntry,
            });
        } else {
            res.status(503).json({
                success: false,
                message: 'No data available yet. Please try again later.',
            });
        }
    } catch (error) {
        next(error);
    }
};