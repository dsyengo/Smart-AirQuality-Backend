import { config } from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

config(); // Load environment variables from .env file

// Initialize the Google Generative AI client using the API key from environment variables.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Select the Gemini model to generate content.
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Uses the Gemini NLP model to analyze environmental data.
 * This service constructs a prompt that includes system instructions and the provided input data,
 * and then uses the Gemini model to generate a comprehensive analysis.
 *
 * @param {Object} inputData - An object containing sensorData, modelResponse, and AQI.
 * @returns {Promise<string>} - The analysis text generated by the Gemini NLP model.
 */
export async function analyzeDataWithGemini(inputData) {
    // Build a system message that instructs the model about its role and required output.
    const systemPrompt = `You are an advanced AI data analyst specialized in environmental and air quality monitoring for the Smart AiQuality Management System.
Analyze the provided sensor data, including pollutant levels, AQI, and health risk indicators.
- Identify trends over time (e.g., rising or falling pollution levels).
- Detect anomalies (e.g., sudden spikes in pollutants or unusual patterns).
- Provide insights into possible causes of observed trends based on data.
- Offer health and safety recommendations based on AQI levels and health risks.
- Do not alter or modify any numerical sensor measurements.
- Format your response in clear, structured paragraphs, making it easy to understand for non-technical users.
- Keep the explanation precise, actionable, and based on the latest available data.
- Also make sure that the response is in 10 lines and categorize them making sure that i can easily use them on the frontend`;

    // Format the input data as a JSON string for clarity.
    const userPrompt = JSON.stringify(inputData, null, 2);

    // Combine the system instructions with the user data to form the complete prompt.
    const prompt = `${systemPrompt}\n\n${userPrompt}`;

    // Generate content using the Gemini model.
    const result = await model.generateContent(prompt);

    // Return the generated analysis text.
    return result.response.text();
}