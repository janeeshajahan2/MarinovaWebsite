
export interface WeatherDataPoint {
  time: string;
  // Temps
  temperature_2m: number;
  apparent_temperature: number;
  dew_point_2m: number;
  // Wind
  wind_speed_10m: number;
  wind_gusts_10m: number;
  wind_direction_10m: number;
  wind_speed_80m: number;
  // Atmosphere
  relative_humidity_2m: number;
  pressure_msl: number;
  visibility: number;
  cloud_cover: number;
  // Precipitation
  precipitation: number;
  precipitation_probability: number;
}

export interface DailyForecast {
  time: string;
  weather_code: number;
  temperature_2m_max: number;
  temperature_2m_min: number;
  sunrise: string;
  sunset: string;
  uv_index_max: number;
  precipitation_sum: number;
  precipitation_probability: number;
  precipitation_probability_max: number;
  wind_speed_10m_max: number;
  wind_direction_10m_dominant: number;
}

export interface OceanLocation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  description: string;
}

export interface WeatherResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  utc_offset_seconds: number;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    is_day: number;
    precipitation: number;
    rain: number;
    showers: number;
    snowfall: number;
    weather_code: number;
    cloud_cover: number;
    pressure_msl: number;
    surface_pressure: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    wind_gusts_10m: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    dew_point_2m: number[];
    apparent_temperature: number[];
    precipitation_probability: number[];
    precipitation: number[];
    weather_code: number[];
    pressure_msl: number[];
    surface_pressure: number[];
    cloud_cover: number[];
    visibility: number[];
    wind_speed_10m: number[];
    wind_speed_80m: number[];
    wind_direction_10m: number[];
    wind_direction_80m: number[];
    wind_gusts_10m: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    apparent_temperature_max: number[];
    apparent_temperature_min: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
    wind_gusts_10m_max: number[];
    wind_direction_10m_dominant: number[];
  };
}

export interface DashboardOceanData {
  oceanId: string;
  name: string;
  timestamp: string; // T-5 hours
  temperature: number;
  salinity: number; // PSU
  currentSpeed: number; // m/s
  ph: number; // Acidity
  waveHeight: number; // meters
}

export interface ChatAttachment {
  type: 'image' | 'video' | 'file' | 'audio';
  url: string;
  file: File;
  mimeType: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  attachments?: ChatAttachment[];
  timestamp: number;
  // For visualizations
  visualizations?: {
    type: 'chart' | 'map' | 'image';
    data: any;
  }[];
}

export interface ResearchReport {
  id: string;
  topic: string;
  timestamp: number;
  content: string; // Markdown
  sources: { title: string; url: string }[];
  locationContext?: {
    name: string;
    lat: number;
    lon: number;
    weather: WeatherResponse;
  };
  generatedImage?: {
    url: string;
    prompt: string;
  };
}

export interface OceanInsight {
  id: string;
  date: string;
  title: string;
  type: 'Prediction' | 'Observation' | 'Anomaly' | 'Event';
  region: string;
  description: string;
  confidence: number; // 0-100
  severity: 'Low' | 'Medium' | 'Critical' | 'Positive';
  tags: string[];
}
