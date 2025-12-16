import { DashboardOceanData } from '../types';
import { FIVE_OCEANS } from '../constants';
import { fetchDashboardWeather } from './weatherService';

export const getGlobalOceanSnapshot = async (isRealTime: boolean = false): Promise<DashboardOceanData[]> => {
  const now = new Date();
  
  // If not real-time, calculate time 5 hours ago
  const targetDate = isRealTime ? now : new Date(now.getTime() - (5 * 60 * 60 * 1000));
  
  // Format timestamp for display (e.g. 07:45 UTC)
  const timeString = targetDate.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false,
    timeZone: 'UTC'
  });
  const displayTimestamp = `${timeString} UTC`;

  // Fetch data for all oceans in parallel
  const promises = FIVE_OCEANS.map(async (ocean, index) => {
    
    let realTemp = 0;
    let realWind = 0;

    try {
      // Use the Open-Meteo API to get hourly conditions (past + forecast)
      const weather = await fetchDashboardWeather(ocean.lat, ocean.lon);
      
      // Find the hourly data point closest to target time
      const timeArray = weather.hourly.time; // ISO strings
      const targetTimeMs = targetDate.getTime();
      
      let closestIndex = 0;
      let minDiff = Infinity;

      // Simple linear search for the closest time slot
      for(let i = 0; i < timeArray.length; i++) {
          // Open-Meteo with &timezone=UTC returns ISO strings ending in 'Z' or simple ISO
          const tStr = timeArray[i].endsWith('Z') ? timeArray[i] : `${timeArray[i]}Z`;
          const t = new Date(tStr).getTime();
          const diff = Math.abs(t - targetTimeMs);
          
          if (diff < minDiff) {
              minDiff = diff;
              closestIndex = i;
          }
      }

      realTemp = weather.hourly.temperature_2m[closestIndex];
      realWind = weather.hourly.wind_speed_10m[closestIndex];

    } catch (e) {
      console.warn(`Dashboard API fetch failed for ${ocean.name}, falling back to estimation.`);
      // Fallback: Estimate based on latitude if API fails
      realTemp = Number((25 - Math.abs(ocean.lat) * 0.4).toFixed(1));
      realWind = 15; // Average wind
    }

    // --- Chemistry & Derived Dynamics (Simulated/Calculated) ---
    // Since standard forecast API doesn't provide Salinity/pH, we use realistic baselines
    
    let baseSalinity = 35; // Average PSU
    let basePh = 8.1; // Average Ocean pH
    
    switch(ocean.id) {
      case 'arctic':
        baseSalinity = 31.5; 
        basePh = 8.05; 
        break;
      case 'southern':
        baseSalinity = 34.2;
        basePh = 8.08;
        break;
      case 'indian':
        baseSalinity = 34.8;
        basePh = 8.10;
        break;
      case 'pacific':
        baseSalinity = 34.5;
        basePh = 8.08;
        break;
      case 'atlantic':
        baseSalinity = 35.2; 
        basePh = 8.09;
        break;
    }

    // Add subtle randomization to chemistry
    const salinity = Number((baseSalinity + (Math.random() * 0.2 - 0.1)).toFixed(1));
    const ph = Number((basePh + (Math.random() * 0.02 - 0.01)).toFixed(2));
    
    // Derive Hydrodynamics from Real Wind
    // Surface Current Speed (Knots) approx 2-3% of Wind Speed + base drift
    // 1 km/h = 0.54 knots
    const windKnots = realWind * 0.54;
    const currentSpeed = Number((windKnots * 0.03 + 0.2).toFixed(1)); 
    
    // Significant Wave Height (m) approximation for open ocean based on wind speed (m/s)
    // Formula approximation: H ≈ 0.2 * (Wind_m/s) (very rough, for visual only)
    const windMs = realWind / 3.6;
    const waveHeight = Number((0.5 + (windMs * 0.25)).toFixed(1)); 

    return {
      oceanId: ocean.id,
      name: ocean.name,
      timestamp: displayTimestamp,
      temperature: realTemp,
      salinity: salinity,
      currentSpeed: currentSpeed, 
      ph: ph,
      waveHeight: waveHeight
    };
  });

  return Promise.all(promises);
};