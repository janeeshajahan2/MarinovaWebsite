
import { WeatherResponse, WeatherDataPoint, DailyForecast } from '../types';

export const fetchWeatherData = async (lat: number, lon: number): Promise<WeatherResponse> => {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    // Hourly variables
    hourly: [
      'temperature_2m',
      'relative_humidity_2m',
      'dew_point_2m',
      'apparent_temperature',
      'precipitation_probability',
      'precipitation',
      'weather_code',
      'pressure_msl',
      'surface_pressure',
      'cloud_cover',
      'visibility',
      'wind_speed_10m',
      'wind_speed_80m',
      'wind_direction_10m',
      'wind_direction_80m',
      'wind_gusts_10m'
    ].join(','),
    // Daily variables
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'apparent_temperature_max',
      'apparent_temperature_min',
      'sunrise',
      'sunset',
      'uv_index_max',
      'precipitation_sum',
      'precipitation_probability_max',
      'wind_speed_10m_max',
      'wind_gusts_10m_max',
      'wind_direction_10m_dominant'
    ].join(','),
    // Current variables
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'is_day',
      'precipitation',
      'rain',
      'showers',
      'snowfall',
      'weather_code',
      'cloud_cover',
      'pressure_msl',
      'surface_pressure',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m'
    ].join(','),
    timezone: 'auto',
    forecast_days: '7'
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch weather data');
  }

  return response.json();
};

// Lightweight fetch for dashboard snapshots (Data for 5 hours ago)
export const fetchDashboardWeather = async (lat: number, lon: number) => {
  // Retrieve hourly data including yesterday to ensure we can find the T-5h time slot
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,wind_speed_10m&past_days=1&forecast_days=1&timezone=UTC`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard weather');
  }

  return response.json();
};

export const fetchHistoricalData = async (lat: number, lon: number, startDate: string, endDate: string): Promise<any> => {
  const response = await fetch(
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_mean,precipitation_sum,wind_speed_10m_max&timezone=auto`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch historical data');
  }

  return response.json();
};

export const transformToChartData = (data: WeatherResponse): WeatherDataPoint[] => {
  const { 
    time, 
    temperature_2m, 
    apparent_temperature,
    dew_point_2m,
    wind_speed_10m, 
    wind_speed_80m,
    wind_gusts_10m,
    wind_direction_10m,
    relative_humidity_2m,
    pressure_msl,
    visibility,
    cloud_cover,
    precipitation,
    precipitation_probability
  } = data.hourly;
  
  // Return first 48 hours for detail view
  return time.slice(0, 48).map((t, index) => ({
    time: new Date(t).toLocaleString('en-US', { weekday: 'short', hour: 'numeric' }),
    temperature_2m: temperature_2m[index],
    apparent_temperature: apparent_temperature[index],
    dew_point_2m: dew_point_2m[index],
    wind_speed_10m: wind_speed_10m[index],
    wind_speed_80m: wind_speed_80m[index],
    wind_gusts_10m: wind_gusts_10m[index],
    wind_direction_10m: wind_direction_10m[index],
    relative_humidity_2m: relative_humidity_2m[index],
    pressure_msl: pressure_msl[index],
    visibility: visibility[index] / 1000, // Convert to km
    cloud_cover: cloud_cover[index],
    precipitation: precipitation[index],
    precipitation_probability: precipitation_probability[index]
  }));
};

export const transformToDailyForecast = (data: WeatherResponse): DailyForecast[] => {
  const {
    time,
    weather_code,
    temperature_2m_max,
    temperature_2m_min,
    sunrise,
    sunset,
    uv_index_max,
    precipitation_sum,
    precipitation_probability_max,
    wind_speed_10m_max,
    wind_direction_10m_dominant
  } = data.daily;

  return time.map((t, index) => ({
    time: t,
    weather_code: weather_code[index],
    temperature_2m_max: temperature_2m_max[index],
    temperature_2m_min: temperature_2m_min[index],
    sunrise: sunrise[index],
    sunset: sunset[index],
    uv_index_max: uv_index_max[index],
    precipitation_sum: precipitation_sum[index],
    precipitation_probability: precipitation_probability_max[index],
    precipitation_probability_max: precipitation_probability_max[index],
    wind_speed_10m_max: wind_speed_10m_max[index],
    wind_direction_10m_dominant: wind_direction_10m_dominant[index]
  }));
};
