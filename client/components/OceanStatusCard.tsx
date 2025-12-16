import React from 'react';
import { DashboardOceanData } from '../types';
import { 
  Thermometer, 
  FlaskConical, 
  Waves, 
  Globe, 
  Grip, 
  MoveHorizontal 
} from 'lucide-react';

interface Props {
  data: DashboardOceanData;
}

const MetricRow = ({ icon: Icon, label, value, unit }: any) => (
  <div className="flex items-center justify-between py-3 border-b border-white/10 last:border-0 hover:bg-white/5 px-2 rounded transition-colors">
    <div className="flex items-center gap-3 text-slate-300">
      <Icon className="w-5 h-5 text-cyan-400" />
      <span className="text-sm font-medium">{label}</span>
    </div>
    <div className="text-right">
      <span className="text-base font-bold text-white">{value}</span>
      <span className="text-sm text-slate-400 ml-1 font-medium">{unit}</span>
    </div>
  </div>
);

const OceanStatusCard: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-[#1e293b] rounded-xl overflow-hidden shadow-2xl border border-slate-700/50">
      {/* Card Header */}
      <div className="bg-[#0f172a]/50 p-4 text-center border-b border-slate-700/50">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Globe className="w-5 h-5 text-cyan-400" />
          <h3 className="text-xl font-bold text-white tracking-wide">{data.name}</h3>
        </div>
        <p className="text-xs text-cyan-500/80 font-mono tracking-wider">
          Data taken at {data.timestamp}
        </p>
      </div>

      {/* Metrics Body */}
      <div className="p-4 bg-gradient-to-b from-[#1e293b] to-[#1e293b]/90">
        <MetricRow 
          icon={Thermometer} 
          label="Temperature" 
          value={data.temperature} 
          unit="°C" 
        />
        <MetricRow 
          icon={Grip} // Using Grip to simulate the "dots" icon for Salinity
          label="Salinity" 
          value={data.salinity} 
          unit="PSU" 
        />
        <MetricRow 
          icon={MoveHorizontal} // Represents current flow
          label="Current" 
          value={data.currentSpeed} 
          unit="knots" 
        />
        <MetricRow 
          icon={FlaskConical} 
          label="Acidity" 
          value={data.ph} 
          unit="pH" 
        />
        <MetricRow 
          icon={Waves} 
          label="Wave Height" 
          value={data.waveHeight} 
          unit="m" 
        />
      </div>
    </div>
  );
};

export default OceanStatusCard;
