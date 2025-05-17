import admin from 'firebase-admin';

// Initialize Firebase Admin SDK with service account
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

export class NotificationService {
    constructor() {
        this.messaging = admin.messaging();
    }

    async sendNotification(fcmToken, payload) {
        try {
            const message = {
                token: fcmToken,
                notification: {
                    title: payload.title,
                    body: payload.body
                },
                data: payload.data || {},
                android: {
                    priority: 'high'
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1
                        }
                    }
                }
            };

            const response = await this.messaging.send(message);
            return response;
        } catch (error) {
            console.error('Error sending notification:', error);
            throw error;
        }
    }

    createAirQualityAlert(user, iotData, riskLevel) {
        const title = `Air Quality ${riskLevel.toUpperCase()} Alert`;
        const body = this.generateAlertBody(user, iotData, riskLevel);

        return {
            title,
            body,
            data: {
                type: 'air_quality_alert',
                riskLevel,
                timestamp: new Date().toISOString(),
                pm25: iotData.pm25?.toString(),
                userId: user.id
            }
        };
    }

    generateAlertBody(user, iotData, riskLevel) {
        const userName = user.name || 'User';
        const pm25 = iotData.pm25 || 'N/A';

        switch (riskLevel.toLowerCase()) {
            case 'critical':
                return `${userName}! Critical air quality (PM2.5: ${pm25}µg/m³). Seek cleaner air immediately.`;
            case 'high':
                return `Caution ${userName}! Unhealthy air (PM2.5: ${pm25}µg/m³). Limit outdoor activity.`;
            case 'moderate':
                return `${userName}, air quality is moderate (PM2.5: ${pm25}µg/m³). Sensitive groups be cautious.`;
            default:
                return `Air quality update: PM2.5 at ${pm25}µg/m³.`;
        }
    }
}