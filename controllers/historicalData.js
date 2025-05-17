


// Mock data
const stations = [
    {
        id: "1",
        name: "Lavington Station (Huawei Offices)",
        latitude: -1.2741,
        longitude: 36.7615,
        aqi: 45,
        lastUpdated: new Date().toISOString(),
    },
    {
        id: "2",
        name: "Kilimani Station",
        latitude: -1.2864,
        longitude: 36.7889,
        aqi: 52,
        lastUpdated: new Date().toISOString(),
    },
    {
        id: "3",
        name: "Westlands Station",
        latitude: -1.265,
        longitude: 36.7962,
        aqi: 68,
        lastUpdated: new Date().toISOString(),
    },
];


export const historicalData = async (req, res) => {
    const { stationId, range } = req.query;
    const data = [];
    const hours = range === "24h" ? 24 : 7 * 24;

    for (let i = 0; i < hours; i++) {
        const timestamp = new Date(Date.now() - i * 60 * 60 * 1000);
        data.push({
            timestamp: timestamp.toISOString(),
            aqi: 30 + Math.random() * 40,
            pollutants: {
                PM25: 15 + Math.random() * 20,
                PM10: 25 + Math.random() * 30,
                NO2: 0.4 + Math.random() * 0.4,
                CO: 0.03 + Math.random() * 0.03,
                SO2: 0.6 + Math.random() * 0.6,
                O3: 0.04 + Math.random() * 0.03,
            },
        });
    }

    res.json(data);
};
    



   
