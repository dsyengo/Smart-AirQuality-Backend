import ObsClient from 'esdk-obs-nodejs';
import dotenv from 'dotenv';

dotenv.config();
const OBS_BUCKET = process.env.OBS_BUCKET;
const FILE_KEY = process.env.FILE_KEY;

// Initialize Huawei OBS Client if not already initialized
if (!global.obsClient) {
    global.obsClient = new ObsClient({
        access_key_id: process.env.OBS_AK,
        secret_access_key: process.env.OBS_SK,
        server: process.env.OBS_ENDPOINT,
    });
    console.log("[INFO] Huawei OBS Client Initialized");
}


// Function to fetch data from OBS Bucket
export async function fetchFromOBS() {
    console.log("[INFO] Fetching data from OBS...");
    const params = {
        Bucket: OBS_BUCKET,
        Key: FILE_KEY,
    };
    try {
        // Retrieve data from OBS
        const result = await global.obsClient.getObject(params);
        if (result.CommonMsg.Status <= 300) {
            console.log("[INFO] Data successfully retrieved from OBS", result);
            return JSON.parse(result.InterfaceResult.Content.toString());
        } else {
            console.error("[ERROR] Failed to retrieve data from OBS: ", result.CommonMsg);
            return null;
        }
    } catch (error) {
        console.error(`[ERROR] OBS Fetch Error: ${error.message}`);
        return null;
    }
}

fetchFromOBS()
