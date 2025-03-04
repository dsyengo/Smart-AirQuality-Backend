import axios from 'axios';
import fs from 'fs-extra';
import moment from 'moment';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Define your location
const latitude = 52.52; // Example: Berlin
const longitude = 13.41;

// Resolve __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read CDS API configuration
const homeDir = process.env.HOME || process.env.USERPROFILE;
const configPath = path.join(homeDir, '.cdsapirc');
const config = fs.readFileSync(configPath, 'utf8');
const apiKey = config.match(/key\s*:\s*([^\s]+)/)[1];

// Function to execute Python script for NetCDF processing
// This is a hybrid approach using Python just for the NetCDF processing
async function getWeatherData() {
    try {
        // Create a temporary Python script to process the data
        const pythonScript = `
import sys
import xarray as xr
import numpy as np
import json

lat = float(sys.argv[1])
lon = float(sys.argv[2])
file_path = sys.argv[3]

# Process the NetCDF file
ds = xr.open_dataset(file_path)

# Extract data for the specific point
temp = float(ds['t2m'].sel(latitude=lat, longitude=lon, method='nearest').values - 273.15)
u_wind = float(ds['u10'].sel(latitude=lat, longitude=lon, method='nearest').values)
v_wind = float(ds['v10'].sel(latitude=lat, longitude=lon, method='nearest').values)
wind_speed = float(np.sqrt(u_wind**2 + v_wind**2))

# Calculate relative humidity from dewpoint
td = float(ds['d2m'].sel(latitude=lat, longitude=lon, method='nearest').values - 273.15)
temp_c = temp
# Magnus formula for estimating relative humidity
rh = float(100 * np.exp((17.625 * td) / (243.04 + td)) / np.exp((17.625 * temp_c) / (243.04 + temp_c)))

# Output as JSON
result = {
    "temperature": round(temp, 1),
    "wind_speed": round(wind_speed, 1),
    "humidity": round(rh, 1)
}

print(json.dumps(result))
    `;

        fs.writeFileSync('process_weather.py', pythonScript);

        // Use Python API for CDS retrieval
        console.log('Requesting weather data...');

        // Call the Python script with CDS API
        const pythonCdsScript = `
import cdsapi
import sys

c = cdsapi.Client()

c.retrieve(
    'reanalysis-era5-single-levels',
    {
        'product_type': 'reanalysis',
        'variable': [
            '2m_temperature', '10m_u_component_of_wind', 
            '10m_v_component_of_wind', '2m_dewpoint_temperature',
        ],
        'year': '2025',
        'month': '02',
        'day': '25',
        'time': '12:00',
        'format': 'netcdf',
    },
    'output.nc')

print('Data downloaded successfully')
    `;

        fs.writeFileSync('download_weather.py', pythonCdsScript);

        // Execute Python script to download data
        console.log('Downloading weather data...');
        execSync('python download_weather.py', { stdio: 'inherit' });

        // Now process the data with our other Python script
        console.log('Processing weather data...');
        const result = execSync(`python process_weather.py ${latitude} ${longitude} output.nc`).toString();

        // Parse the JSON result
        const weatherData = JSON.parse(result);

        console.log(`Temperature: ${weatherData.temperature}°C`);
        console.log(`Wind Speed: ${weatherData.wind_speed} m/s`);
        console.log(`Relative Humidity: ${weatherData.humidity}%`);

        // Clean up temporary files
        fs.removeSync('process_weather.py');
        fs.removeSync('download_weather.py');

        return weatherData;
    } catch (error) {
        console.error('Error:', error.message);
        throw error;
    }
}

// Run the function
getWeatherData();
