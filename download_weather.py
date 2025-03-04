
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
    