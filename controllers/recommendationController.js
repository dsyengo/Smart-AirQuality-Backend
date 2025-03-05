import DataModel from "../models/data.js";

/**
 * Controller that retrieves the latest consolidated sensor data and breaks down 
 * the NLP analysis into several recommendation parts.
 *
 * This controller:
 *  - Retrieves the most recent data entry (including NLP analysis) from the database.
 *  - Extracts the NLP analysis results.
 *  - Breaks down the analysis into parts such as summary, detailed insights, 
 *    and actionable recommendations.
 *  - Returns the structured recommendations to the client.
 *
 * Assumes that the stored data (in DataModel) includes a property "nlpAnalysis" 
 * which might have keys like "summary", "details", and "recommendations".
 */
export const getRecommendations = async (req, res, next) => {
    try {
        // Retrieve the latest saved data entry from the database.
        // Adjust query as needed if you use timestamps or other sorting criteria.
        const latestEntry = await DataModel.findOne().sort({ createdAt: -1 });
        if (!latestEntry || !latestEntry.data) {
            return res.status(404).json({
                success: false,
                message: "No sensor data with NLP analysis available.",
            });
        }

        const { nlpAnalysis } = latestEntry.data;

        if (!nlpAnalysis) {
            return res.status(404).json({
                success: false,
                message: "NLP analysis data not available in the latest entry.",
            });
        }

        // Breakdown the NLP analysis into several parts.
        // The structure of nlpAnalysis depends on your Gemini NLP service output.
        // Here, we're assuming it contains keys such as 'summary', 'details', and 'recommendations'.
        const recommendations = {
            summary: nlpAnalysis.summary || "No summary available.",
            detailedAnalysis: nlpAnalysis.details || "No detailed analysis provided.",
            actionableRecommendations: nlpAnalysis.recommendations || "No actionable recommendations provided."
        };

        // Return the structured recommendations to the client.
        res.json({
            success: true,
            recommendations
        });
    } catch (error) {
        console.error("Error retrieving recommendations:", error);
        next(error);
    }
};