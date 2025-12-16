import React from 'react';
import { WeatherResponse } from '../types';
import { 
  Droplets, 
  Eye, 
  Gauge, 
  Sun, 
  CloudRain, 
  Wind, 
  Cloud,
  Compass
} from 'lucide-react';

interface Props {
  data: WeatherResponse;
}

const ConditionItem = ({ icon: Icon, label, value, unit, subtext }: any) => (
  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 flex flex-col justify-between hover:bg-slate-800 transition-colors">
    <div className="flex items-center gap-2 text-slate-400 mb-1">
      <Icon className="w-4 h-4" />
      <span className="text-xs font-medium uppercase">{label}</span>
    </div>
    <div className="flex items-end justify-between">
      <span className="text-xl font-bold text-slate-100">
        {value} <span className="text-xs font-normal text-slate-500">{unit}</span>
      </span>
    </div>
    {subtext && <span className="text-[10px] text-slate-500 mt-1">{subtext}</span>}
  </div>
);

const CurrentConditions: React.FC<Props> = ({ data }) => {
  const { current, daily } = data;
  const today = daily.time[0] === current.time.split('T')[0] ? 0 : 0; // Simple check

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <ConditionItem 
        icon={Gauge} 
        label="Pressure" 
        value={current.pressure_msl} 
        unit="hPa" 
        subtext={`${current.surface_pressure} hPa surface`}
      />
      <ConditionItem 
        icon={Droplets} 
        label="Humidity" 
        value={current.relative_humidity_2m} 
        unit="%" 
        subtext={`Dew Point: ${data.hourly.dew_point_2m[0]}°C`}
      />
      <ConditionItem 
        icon={Eye} 
        label="Visibility" 
        value={data.hourly.visibility[0] / 1000} 
        unit="km" 
      />
      <ConditionItem 
        icon={Sun} 
        label="UV Index" 
        value={daily.uv_index_max[today]} 
        unit="" 
        subtext={daily.uv_index_max[today] > 5 ? "High Exposure" : "Low Exposure"}
      />
      <ConditionItem 
        icon={Cloud} 
        label="Cloud Cover" 
        value={current.cloud_cover} 
        unit="%" 
      />
      <ConditionItem 
        icon={CloudRain} 
        label="Precipitation" 
        value={current.precipitation} 
        unit="mm" 
        subtext={`${daily.precipitation_probability_max[today]}% chance today`}
      />
       <ConditionItem 
        icon={Compass} 
        label="Direction" 
        value={current.wind_direction_10m} 
        unit="°" 
        subtext={getCardinalDirection(current.wind_direction_10m)}
      />
      <ConditionItem 
        icon={Wind} 
        label="Wind Gusts" 
        value={current.wind_gusts_10m} 
        unit="km/h" 
      />
    </div>
  );
};

function getCardinalDirection(angle: number) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return directions[Math.round(angle / 45) % 8];
}

export default CurrentConditions;
