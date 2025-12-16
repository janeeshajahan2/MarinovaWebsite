import React from 'react';
import { DailyForecast } from '../types';
import { CloudRain, Sun, Cloud, Wind, Sunrise, Sunset } from 'lucide-react';

interface Props {
  data: DailyForecast[];
}

const getWeatherIcon = (code: number) => {
  if (code === 0) return <Sun className="w-5 h-5 text-yellow-400" />;
  if (code < 40) return <Cloud className="w-5 h-5 text-slate-400" />;
  return <CloudRain className="w-5 h-5 text-blue-400" />;
};

const DailyForecastList: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
      <h3 className="text-lg font-semibold text-slate-200 mb-4">7-Day Outlook</h3>
      <div className="space-y-4">
        {data.map((day, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/60 transition-colors">
            
            {/* Date & Icon */}
            <div className="flex items-center gap-4 w-1/4">
              {getWeatherIcon(day.weather_code)}
              <div>
                <p className="font-bold text-slate-200 text-sm">
                  {new Date(day.time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                   <Sunrise className="w-3 h-3" /> {day.sunrise.split('T')[1]}
                </div>
              </div>
            </div>

            {/* Temp Range */}
            <div className="flex flex-col items-center w-1/4">
               <div className="flex gap-2 text-sm">
                 <span className="text-blue-300 font-bold">{day.temperature_2m_max.toFixed(0)}°</span>
                 <span className="text-slate-600">/</span>
                 <span className="text-slate-500">{day.temperature_2m_min.toFixed(0)}°</span>
               </div>
               <div className="w-16 h-1 bg-slate-700 rounded-full mt-1 overflow-hidden">
                 <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-yellow-500" 
                    style={{ width: '100%' }} // Simplified vis for now
                 />
               </div>
            </div>

            {/* Wind & Rain */}
            <div className="flex items-center gap-6 w-1/3 justify-end">
              <div className="text-right">
                <div className="flex items-center justify-end gap-1 text-slate-300 text-xs font-medium">
                  <Wind className="w-3 h-3 text-teal-500" />
                  {day.wind_speed_10m_max} km/h
                </div>
                <div className="text-[10px] text-slate-500">Max Gust</div>
              </div>
              
              <div className="text-right w-12">
                <div className="flex items-center justify-end gap-1 text-slate-300 text-xs font-medium">
                  <CloudRain className="w-3 h-3 text-blue-500" />
                  {day.precipitation_sum}
                </div>
                <div className="text-[10px] text-slate-500">mm</div>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};

export default DailyForecastList;
