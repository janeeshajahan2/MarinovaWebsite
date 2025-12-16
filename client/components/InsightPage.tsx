
import React, { useEffect, useState } from 'react';
import { OceanInsight } from '../types';
import { getMonthlyInsights } from '../services/insightService';
import { 
  Loader2, 
  TrendingUp, 
  AlertTriangle, 
  Eye, 
  Calendar, 
  Radio, 
  Sparkles,
  Search,
  X,
  Tag
} from 'lucide-react';

const InsightPage: React.FC = () => {
  const [insights, setInsights] = useState<OceanInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Critical' | 'Prediction'>('All');
  const [selectedInsight, setSelectedInsight] = useState<OceanInsight | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await getMonthlyInsights();
      setInsights(data);
      setLoading(false);
    };
    loadData();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  
  // Find "Today's" insight, or the most recent one
  const featuredInsight = insights.find(i => i.date === todayStr) || insights[0];
  
  const filteredInsights = insights.filter(item => {
    if (filter === 'All') return true;
    if (filter === 'Critical') return item.severity === 'Critical';
    if (filter === 'Prediction') return item.type === 'Prediction';
    return true;
  });

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'Critical': return 'text-red-400 border-red-500/50 bg-red-500/10';
      case 'Medium': return 'text-orange-400 border-orange-500/50 bg-orange-500/10';
      case 'Positive': return 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10';
      default: return 'text-blue-400 border-blue-500/50 bg-blue-500/10';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
        case 'Prediction': return <TrendingUp className="w-4 h-4" />;
        case 'Anomaly': return <AlertTriangle className="w-4 h-4" />;
        case 'Observation': return <Eye className="w-4 h-4" />;
        default: return <Radio className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0f172a] overflow-y-auto relative">
      
      {/* Insight Detail Modal */}
      {selectedInsight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedInsight(null)}>
           <div 
             className="relative w-full max-w-2xl bg-[#1e293b] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]"
             onClick={(e) => e.stopPropagation()}
           >
              <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-start mb-6 gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-2 ${getSeverityColor(selectedInsight.severity)}`}>
                                {getTypeIcon(selectedInsight.type)}
                                {selectedInsight.type.toUpperCase()}
                            </span>
                             <span className="text-slate-400 text-sm flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(selectedInsight.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
                            {selectedInsight.title}
                        </h2>
                        <div className="flex items-center gap-2 text-indigo-400">
                             <Radio className="w-4 h-4" />
                             <span className="font-semibold">{selectedInsight.region}</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => setSelectedInsight(null)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50 mb-6">
                    <p className="text-lg text-slate-200 leading-relaxed">
                        {selectedInsight.description}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                     {selectedInsight.type === 'Prediction' && (
                         <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                             <p className="text-sm text-slate-400 mb-1">Confidence Score</p>
                             <div className="flex items-center gap-3">
                                 <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                     <div className="h-full bg-indigo-500" style={{ width: `${selectedInsight.confidence}%` }}></div>
                                 </div>
                                 <span className="font-bold text-white">{selectedInsight.confidence}%</span>
                             </div>
                         </div>
                     )}
                     <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                         <p className="text-sm text-slate-400 mb-1">Impact Level</p>
                         <p className={`font-bold ${
                             selectedInsight.severity === 'Critical' ? 'text-red-400' : 
                             selectedInsight.severity === 'Medium' ? 'text-orange-400' : 'text-blue-400'
                         }`}>
                             {selectedInsight.severity} Severity
                         </p>
                     </div>
                </div>

                {selectedInsight.tags && selectedInsight.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {selectedInsight.tags.map((tag, idx) => (
                            <div key={idx} className="flex items-center gap-1 px-3 py-1 bg-slate-800 text-slate-400 rounded-full text-xs font-medium border border-slate-700">
                                <Tag className="w-3 h-3" />
                                {tag}
                            </div>
                        ))}
                    </div>
                )}
              </div>
              
              <div className="p-4 bg-slate-800/50 border-t border-slate-700/50 flex justify-end">
                  <button 
                    onClick={() => setSelectedInsight(null)}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
                  >
                      Close Report
                  </button>
              </div>
           </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-[#1e293b] border-b border-slate-700/50 p-6 sticky top-0 z-20 shadow-xl">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-400" />
              Global Insights & Predictions
            </h2>
            <p className="text-slate-400 text-sm">
              30-day AI analysis of oceanographic trends, anomalies, and forecasts.
            </p>
          </div>

          <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
             {['All', 'Prediction', 'Critical'].map(f => (
               <button
                 key={f}
                 onClick={() => setFilter(f as any)}
                 className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                   filter === f 
                   ? 'bg-slate-700 text-white shadow-sm' 
                   : 'text-slate-400 hover:text-slate-200'
                 }`}
               >
                 {f}
               </button>
             ))}
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {loading ? (
             <div className="flex flex-col items-center justify-center py-32 text-slate-500 space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-purple-400" />
                <p className="animate-pulse">Aggregating global sensor networks...</p>
             </div>
          ) : (
             <>
                {/* Hero / Featured */}
                {featuredInsight && (
                  <div 
                    onClick={() => setSelectedInsight(featuredInsight)}
                    className="cursor-pointer relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 to-purple-900 border border-indigo-500/30 shadow-2xl p-8 group transition-all hover:scale-[1.01] hover:shadow-indigo-500/20"
                  >
                     <div className="absolute top-0 right-0 p-32 bg-purple-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                     
                     <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                           <span className="bg-indigo-500/20 text-indigo-200 text-xs font-bold px-3 py-1 rounded-full border border-indigo-500/30 uppercase tracking-wider flex items-center gap-2">
                             <Calendar className="w-3 h-3" />
                             Today's Highlight
                           </span>
                           {featuredInsight.severity === 'Critical' && (
                               <span className="bg-red-500/20 text-red-200 text-xs font-bold px-3 py-1 rounded-full border border-red-500/30 animate-pulse">
                                 CRITICAL ALERT
                               </span>
                           )}
                        </div>

                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight group-hover:text-purple-200 transition-colors">
                           {featuredInsight.title}
                        </h1>
                        <p className="text-indigo-100 text-lg md:text-xl max-w-3xl mb-6 leading-relaxed opacity-90 line-clamp-3">
                           {featuredInsight.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-6 text-sm text-indigo-200/80">
                           <div className="flex items-center gap-2">
                              <Radio className="w-4 h-4" />
                              <span className="font-semibold text-white">{featuredInsight.region}</span>
                           </div>
                           {featuredInsight.type === 'Prediction' && (
                             <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                <span>Confidence: <span className="text-white font-bold">{featuredInsight.confidence}%</span></span>
                             </div>
                           )}
                        </div>
                     </div>
                  </div>
                )}

                {/* Timeline Grid */}
                <div>
                   <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                     <Calendar className="w-5 h-5 text-slate-400" />
                     30-Day Ocean Log
                   </h3>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredInsights.map((item) => (
                         <div 
                           key={item.id} 
                           onClick={() => setSelectedInsight(item)}
                           className={`cursor-pointer bg-[#1e293b] border rounded-xl p-5 hover:bg-slate-800 transition-all group hover:shadow-lg hover:-translate-y-1 ${
                               item.date === todayStr ? 'border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]' : 'border-slate-700/50'
                           }`}
                         >
                            <div className="flex justify-between items-start mb-3">
                               <div className="flex flex-col">
                                  <span className="text-xs font-mono text-slate-500 mb-1">
                                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit flex items-center gap-1 ${getSeverityColor(item.severity)}`}>
                                     {getTypeIcon(item.type)}
                                     {item.type.toUpperCase()}
                                  </div>
                               </div>
                               {item.type === 'Prediction' && (
                                   <div className="radial-progress text-[10px] font-bold text-slate-400" style={{"--value":item.confidence} as any}>
                                      {item.confidence}%
                                   </div>
                               )}
                            </div>

                            <h4 className="text-lg font-bold text-slate-200 mb-2 group-hover:text-purple-300 transition-colors line-clamp-2">
                               {item.title}
                            </h4>
                            <p className="text-sm text-slate-400 mb-4 line-clamp-3">
                               {item.description}
                            </p>

                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-700/50">
                               <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide truncate pr-2">
                                  {item.region}
                               </span>
                               <span className="text-xs text-indigo-400 flex items-center gap-1">
                                   View Report <Eye className="w-3 h-3" />
                               </span>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             </>
          )}

        </div>
      </div>
    </div>
  );
};

export default InsightPage;
