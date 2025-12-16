import React from 'react';
import { OceanLocation } from '../types';
import { MapPin, Info } from 'lucide-react';

interface OceanCardProps {
  ocean: OceanLocation;
  isSelected: boolean;
  onClick: (ocean: OceanLocation) => void;
}

const OceanCard: React.FC<OceanCardProps> = ({ ocean, isSelected, onClick }) => {
  return (
    <button
      onClick={() => onClick(ocean)}
      className={`relative group flex flex-col p-4 rounded-xl border transition-all duration-300 w-full text-left
        ${isSelected 
          ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
          : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-500'
        }`}
    >
      <div className="flex items-center justify-between w-full mb-2">
        <h3 className={`text-lg font-bold ${isSelected ? 'text-blue-400' : 'text-slate-200'}`}>
          {ocean.name}
        </h3>
        <MapPin className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
      </div>
      
      <div className="text-xs text-slate-400 font-mono mb-2">
        LAT: {ocean.lat.toFixed(2)}, LON: {ocean.lon.toFixed(2)}
      </div>

      <p className="text-sm text-slate-400 line-clamp-2">
        {ocean.description}
      </p>

      {/* Decorative gradient overlay */}
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'group-hover:opacity-50'}`} />
    </button>
  );
};

export default OceanCard;
