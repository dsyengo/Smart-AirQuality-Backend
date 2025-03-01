import fetch from 'node-fetch';

// Huawei Cloud model API URL (set in your .env file).
const HUAWEI_MODEL_API_URL = process.env.HUAWEI_MODEL_API_URL;

// Function to process data with the Huawei Cloud model.
export async function processDataWithModel(data) {
    try {
        const response = await fetch(HUAWEI_MODEL_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(`Model API error! Status: ${response.status}`);
        }
        const result = await response.json();
        console.log('Data processed by Huawei Cloud model:', result);
        return result;
    } catch (error) {
        console.error('Error processing data with Huawei Cloud model:', error);
    }
}