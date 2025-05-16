import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
console.log("Using API Key:", apiKey); // Should log a real key

const genAI = new GoogleGenerativeAI(apiKey);

async function testGemini() {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = "Say Hello";

    try {
        const result = await model.generateContent(prompt);
        console.log("Gemini Response:", result.response.text());
    } catch (err) {
        console.error("Gemini Error:", err);
    }
}

testGemini();
