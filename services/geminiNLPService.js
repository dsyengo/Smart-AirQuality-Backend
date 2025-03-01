import fetch from 'node-fetch';

// URL for the Gemini NLP API (set in your .env file).
const GEMINI_NLP_API_URL = process.env.GEMINI_NLP_API_URL;

/**
 * Uses the Gemini NLP model to refine and simplify the provided weather forecast text into layman's language.
 *
 * @param {string} forecastText - The original weather forecast description.
 * @returns {Promise<string>} A refined version of the forecast in layman's language.
 */
export async function refineForecast(forecastText) {
    try {
        const response = await fetch(GEMINI_NLP_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: forecastText }),
        });
        if (!response.ok) {
            throw new Error(`Gemini NLP API error! Status: ${response.status}`);
        }
        const result = await response.json();
        // Assuming the API returns an object with a 'refinedText' property.
        return result.refinedText;
    } catch (error) {
        console.error('Error refining forecast with Gemini NLP model:', error);
        throw error;
    }
}