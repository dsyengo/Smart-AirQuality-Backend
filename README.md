# 🌍 Smart Outdoor Air Quality Monitoring System – Backend (`aircura-bc`)

## 📘 Abstract

This project presents a **smart outdoor air quality monitoring system** designed for **real-time environmental data acquisition, analysis, and cloud-based reporting** using **IoT** and **Huawei Cloud**.

The system integrates multiple sensors for monitoring air quality parameters such as particulate matter, volatile organic compounds (VOCs), gases (NOx, ozone, etc.), along with GPS for geolocation. Sensor data is transmitted via a 4G LTE module to Huawei's Object Storage Service (OBS) and visualized on a web-based dashboard. This backend service powers data ingestion, monitoring, alerting, and integration with AI models for analytics.

---

## 📦 Tech Stack

- **Node.js**, **Express** – Server & REST API
- **MongoDB** – Data storage
- **Huawei OBS SDK** – Data fetching from Object Storage
- **Generative AI APIs** – Gemini (Google), DeepSeek, Huawei Pangu
- **WebSocket (ws)** – Real-time communication
- **Security Middleware** – Helmet, rate limiting, HPP, Mongo sanitization
- **Dev Tools** – Nodemon, Morgan, Dotenv

---

## 🛠 Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/aircura-bc.git
cd aircura-bc
2. Install dependencies
bash
Copy
Edit
npm install
3. Create a .env file
Paste the following into .env and update the credentials:

env
Copy
Edit
PORT=5000
MONGO_URI=mongodb://localhost:27017/aircura

GEMINI_API_KEY=your_google_gemini_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key

HUAWEI_CLOUD_API_URL=https://gemini.huaweicloud.com
HUAWEI_MODEL_API_URL=https://...huaweicloudapis.com/v1/infers/your-model-id
HUAWEI_MODEL_SDK_AK=your_huawei_ak
HUAWEI_MODEL_SDK_SK=your_huawei_sk
HUAWEI_PREDICTION_MODEL_URL=https://...huaweicloudapis.com/v1/infers/your-prediction-model-id

PANGU_API_KEY=your_pangu_api_key
PANGU_EMAIL=your_email
PANGU_URL=https://www.api.ecmwf.int//v1/pangu-weather

OBS_AK=your_obs_ak
OBS_SK=your_obs_sk
OBS_ENDPOINT=obs.ap-southeast-2.myhuaweicloud.com
OBS_BUCKET=iot-sensor-data
4. Run the server
For development (with auto-restart):

bash
Copy
Edit
npm run start:dev
For production:

bash
Copy
Edit
npm start
✅ Features
Real-time sensor data polling from Huawei OBS

AI analytics via Gemini, DeepSeek, and Pangu APIs

MongoDB for data persistence

RESTful APIs for web dashboard

WebSocket for real-time updates

Environment variable validation

Secure and scalable backend architecture

🧪 Example Usage
js
Copy
Edit
import { startRealTimeMonitoring } from './services/realtimeService.js';

startRealTimeMonitoring();
📂 Project Structure
bash
Copy
Edit
.
├── server.js               # Entry point
├── .env                   # Environment variables
├── services/
│   └── realtimeService.js # Huawei OBS real-time polling
├── routes/
│   └── api.js             # REST API routes
├── utils/
│   └── validateEnv.js     # Environment checker
├── models/
│   └── DataEntry.js       # Mongoose schema
└── package.json
🛡 Security Tips
Keep .env out of source control.

Use HTTPS in production.

Use secrets management for production deployments.

📄 License
This project is licensed under the ISC License.

🤝 Acknowledgements
Huawei Cloud OBS & Model Inference APIs

Google Gemini Generative AI

ECMWF Pangu Weather Model

DeepSeek AI Labs

vbnet
Copy
Edit

Let me know if you’d like this README to include API documentation, Docker instructions, or a CI/CD workflow section.
```
