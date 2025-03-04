
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
    