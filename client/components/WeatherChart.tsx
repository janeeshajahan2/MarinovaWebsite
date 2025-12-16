import React, { useState } from 'react';
    import {
      LineChart,
      Line,
      XAxis,
      YAxis,
      CartesianGrid,
      Tooltip,
      ResponsiveContainer,
      Legend,
      AreaChart,
      Area
    } from 'recharts';
    import { Download } from 'lucide-react';
    import { WeatherDataPoint } from '../types';
    
    interface WeatherChartProps {
      data: WeatherDataPoint[];
    }
    
    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-slate-900/90 border border-slate-700 p-3 rounded-lg shadow-xl text-xs backdrop-blur-md">
            <p className="font-bold text-slate-200 mb-2 border-b border-slate-700 pb-1">{label}</p>
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4 mb-1">
                <span style={{ color: entry.color }}>{entry.name}:</span>
                <span className="font-mono text-slate-200">
                  {entry.value} {entry.unit}
                </span>
              </div>
            ))}
          </div>
        );
      }
      return null;
    };
    
    const WeatherChart: React.FC<WeatherChartProps> = ({ data }) => {
      const [activeTab, setActiveTab] = useState<'temp' | 'wind' | 'atmos' | 'precip'>('temp');
      
      // Check if this is historical data (mostly zeros for wind/atmos)
      const isHistorical = data.length > 100 && data.every(d => d.pressure_msl === 0);

      const tabs = [
        { id: 'temp', label: 'Temperature' },
        { id: 'precip', label: 'Precipitation' },
        // Only show Wind/Atmos if we have valid data (not historical archive which is limited)
        ...(!isHistorical ? [
            { id: 'wind', label: 'Wind Dynamics' },
            { id: 'atmos', label: 'Atmosphere' }
        ] : [])
      ];

      const handleExport = () => {
        if (!data.length) return;
        
        // Create CSV Content
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => Object.values(row).join(','));
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
        
        // Trigger Download
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `marinova_weather_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
    
      return (
        <div className="w-full">
          {/* Tabs & Actions */}
          <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
            <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                    activeTab === tab.id
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                >
                    {tab.label}
                </button>
                ))}
            </div>

            <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors border border-slate-700"
                title="Export Data (CSV)"
            >
                <Download className="w-3 h-3" />
                Export CSV
            </button>
          </div>
    
          <div className="h-[300px] w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              {activeTab === 'temp' ? (
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#94a3b8" 
                    tick={{ fontSize: 10 }} 
                    tickMargin={10} 
                    minTickGap={isHistorical ? 50 : 0} // Avoid crowding for historical data
                  />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} unit="°C" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="temperature_2m"
                    name="Temperature"
                    unit="°C"
                    stroke="#38bdf8"
                    fillOpacity={1}
                    fill="url(#colorTemp)"
                    strokeWidth={isHistorical ? 1 : 2}
                    dot={!isHistorical}
                  />
                  {!isHistorical && (
                    <>
                    <Line
                        type="monotone"
                        dataKey="apparent_temperature"
                        name="Feels Like"
                        unit="°C"
                        stroke="#f472b6"
                        strokeDasharray="5 5"
                        dot={false}
                    />
                    <Line
                        type="monotone"
                        dataKey="dew_point_2m"
                        name="Dew Point"
                        unit="°C"
                        stroke="#a78bfa"
                        strokeWidth={1}
                        dot={false}
                    />
                    </>
                  )}
                </AreaChart>
              ) : activeTab === 'wind' ? (
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 10 }} tickMargin={10} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} unit=" km/h" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="wind_speed_10m" name="Wind (10m)" unit="km/h" stroke="#34d399" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="wind_gusts_10m" name="Gusts" unit="km/h" stroke="#facc15" strokeWidth={1} dot={false} strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="wind_speed_80m" name="Wind (80m)" unit="km/h" stroke="#60a5fa" strokeWidth={1} dot={false} />
                </LineChart>
              ) : activeTab === 'precip' ? (
                <AreaChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#94a3b8" 
                    tick={{ fontSize: 10 }} 
                    tickMargin={10} 
                    minTickGap={isHistorical ? 50 : 0}
                  />
                  <YAxis yAxisId="left" stroke="#94a3b8" tick={{ fontSize: 10 }} unit="mm" />
                  <YAxis yAxisId="right" orientation="right" stroke="#64748b" tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="step"
                    dataKey="precipitation"
                    name="Precipitation"
                    unit="mm"
                    stroke="#60a5fa"
                    fill="#60a5fa"
                    fillOpacity={0.3}
                  />
                  {!isHistorical && (
                      <>
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="precipitation_probability"
                        name="Chance of Rain"
                        unit="%"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="cloud_cover"
                        name="Cloud Cover"
                        unit="%"
                        stroke="#e2e8f0"
                        strokeDasharray="3 3"
                        dot={false}
                      />
                      </>
                  )}
                </AreaChart>
              ) : (
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 10 }} tickMargin={10} />
                  <YAxis yAxisId="left" stroke="#94a3b8" domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="pressure_msl" name="Pressure" unit="hPa" stroke="#fbbf24" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="relative_humidity_2m" name="Humidity" unit="%" stroke="#22d3ee" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="visibility" name="Visibility" unit="km" stroke="#a78bfa" strokeDasharray="3 3" dot={false} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      );
    };
    
    export default WeatherChart;