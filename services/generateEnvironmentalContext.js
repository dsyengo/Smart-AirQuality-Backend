import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * Uses Gemini to estimate environmental context based on location coordinates.
 * Returns numeric estimates for proximity to industrial areas (in meters)
 * and population density (people per square kilometer).
 *
 * @param {Object} coordinates - Object with `lat` and `lng` properties.
 * @returns {Promise<{ Proximity_to_Industrial_Areas: number, Population_Density: number }>}
 */

export async function getEnvironmentalContextFromCoordinates() {
    const coordinates = {
        lat: -1.2806933977171824,
        lng: 36.770635314136115
    };
    const prompt = `
You are an expert in geographic and environmental analysis. Based on a location's latitude and longitude, estimate the following:

1. Proximity_to_Industrial_Areas: estimated distance in **meters** to the nearest major industrial area.
2. Population_Density: estimated number of people per square kilometer in that specific region.

Respond **strictly** in JSON format like this:
{
  "Proximity_to_Industrial_Areas": number,
  "Population_Density": number
}

Latitude: ${coordinates.lat}
Longitude: ${coordinates.lng}
Do not explain or elaborate — just return the JSON.
    `.trim();

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    try {
        // Parse the AI's response as JSON
        const parsed = JSON.parse(responseText);
        return {
            Proximity_to_Industrial_Areas: parsed.Proximity_to_Industrial_Areas,
            Population_Density: parsed.Population_Density
        };
    } catch (err) {
        console.error("Failed to parse Gemini response:", responseText);
        throw new Error("Gemini response could not be parsed as JSON.");
    }
}



