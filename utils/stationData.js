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

// API endpoints
app.get("/api/stations", (req, res) => {
    res.json(stations);
});

app.get("/api/stations/:id", (req, res) => {
    const station = stations.find((s) => s.id === req.params.id);
    if (station) {
        res.json(station);
    } else {
        res.status(404).json({ error: "Station not found" });
    }
});

