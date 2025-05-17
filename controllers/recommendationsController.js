

export const generalRecommendations = async (req, res) => {
    const { aqi } = req.query;
    const aqiValue = parseInt(aqi) || 0;

    let riskLevel = "good";
    if (aqiValue > 300) riskLevel = "hazardous";
    else if (aqiValue > 200) riskLevel = "veryUnhealthy";
    else if (aqiValue > 150) riskLevel = "unhealthy";
    else if (aqiValue > 100) riskLevel = "unhealthySensitive";
    else if (aqiValue > 50) riskLevel = "moderate";

    const healthData = {
        good: {
            level: "Low Risk",
            description:
                "Air quality is considered satisfactory, and air pollution poses little or no risk.",
            recommendations: [
                "Enjoy outdoor activities as usual",
                "Keep windows open for fresh air",
                "Monitor local air quality updates",
            ],
            affectedGroups: ["Generally safe for all groups"],
            alertLevel: "Low",
            alertDescription:
                "Air quality is good and poses little to no health risk.",
            alertColor: "green-500",
        },
        moderate: {
            level: "Moderate Risk",
            description: "Some individuals may experience health effects.",
            recommendations: [
                "Reduce prolonged outdoor activities if you experience symptoms",
                "Keep windows closed during peak pollution hours",
                "Monitor symptoms if you have respiratory conditions",
            ],
            affectedGroups: [
                "Sensitive individuals",
                "People with respiratory conditions",
            ],
            alertLevel: "Moderate",
            alertDescription: "Air quality may pose risks for sensitive groups.",
            alertColor: "yellow-600",
        },
        // ... Add other levels as needed
    };

    res.json({
        current: healthData[riskLevel] || healthData.good,
        risks: Object.values(healthData).slice(0, 3),
    });
};


export const personalizedRecommendations = async (req, res) => {
    const { aqi } = req.query;
    const aqiValue = parseInt(aqi) || 0;

    let riskLevel = "good";
    if (aqiValue > 300) riskLevel = "hazardous";
    else if (aqiValue > 200) riskLevel = "veryUnhealthy";
    else if (aqiValue > 150) riskLevel = "unhealthy";
    else if (aqiValue > 100) riskLevel = "unhealthySensitive";
    else if (aqiValue > 50) riskLevel = "moderate";

    const healthData = {
        good: {
            level: "Low Risk",
            description:
                "Air quality is considered satisfactory, and air pollution poses little or no risk.",
            recommendations: [
                "Enjoy outdoor activities as usual",
                "Keep windows open for fresh air",
                "Monitor local air quality updates",
            ],
            affectedGroups: ["Generally safe for all groups"],
            alertLevel: "Low",
            alertDescription:
                "Air quality is good and poses little to no health risk.",
            alertColor: "green-500",
        },
        moderate: {
            level: "Moderate Risk",
            description: "Some individuals may experience health effects.",
            recommendations: [
                "Reduce prolonged outdoor activities if you experience symptoms",
                "Keep windows closed during peak pollution hours",
                "Monitor symptoms if you have respiratory conditions",
            ],
            affectedGroups: [
                "Sensitive individuals",
                "People with respiratory conditions",
            ],
            alertLevel: "Moderate",
            alertDescription: "Air quality may pose risks for sensitive groups.",
            alertColor: "yellow-600",
        },
        // ... Add other levels as needed
    };

    res.json({
        current: healthData[riskLevel] || healthData.good,
        risks: Object.values(healthData).slice(0, 3),
    });
};

