import { NotificationService } from '../services/notificationService.js';
import userModel from '../models/userModel.js';

const notificationService = new NotificationService();

export const saveFcmToken = async (req, res) => {
    try {
        const { fcmToken } = req.body;
        if (!fcmToken) {
            return res.status(400).json({ message: 'FCM token is required' });
        }

        const user = await UserModel.findByIdAndUpdate(
            req.user.id,
            { fcmToken },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'FCM token updated successfully' });
    } catch (error) {
        console.error('Error saving FCM token:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const sendAirQualityAlert = async (req, res) => {
    try {
        const { userId, iotData, riskLevel } = req.body;

        if (!userId || !iotData || !riskLevel) {
            return res.status(400).json({ message: 'userId, iotData, and riskLevel are required' });
        }

        const user = await User.findById(userId);
        if (!user || !user.fcmToken) {
            return res.status(404).json({ message: 'User or FCM token not found' });
        }

        const payload = notificationService.createAirQualityAlert(user, iotData, riskLevel);
        const messageId = await notificationService.sendNotification(user.fcmToken, payload);

        res.status(200).json({ message: 'Notification sent', messageId });
    } catch (error) {
        console.error('Error sending air quality alert:', error);
        res.status(500).json({ message: 'Server error' });
    }
};