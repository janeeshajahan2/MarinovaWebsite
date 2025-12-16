
import React from 'react';
import { 
  CheckCircle2, 
  Lock,
  Globe,
  IndianRupee,
  Building2,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { subscribeUser } from '../services/usageService';

interface Props {
  onSubscribe: () => void;
}

const SubscriptionPage: React.FC<Props> = ({ onSubscribe }) => {
  
  const handleSubscribe = () => {
    // Simulate payment/registration process
    subscribeUser();
    onSubscribe();
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] -ml-32 -mb-32"></div>
      </div>

      <div className="relative z-10 max-w-7xl w-full">
        
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-3 bg-slate-800/50 rounded-full mb-6 border border-slate-700 backdrop-blur-sm">
             <Lock className="w-5 h-5 text-red-400 mr-2" />
             <span className="text-slate-300 font-medium text-sm">Free Preview Limit Reached</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Unlock Full <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Ocean Intelligence</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Choose a plan to access real-time global monitoring, AI-powered captain's briefs, and advanced forecasting models.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          
          {/* Retail - India */}
          <div className="bg-[#1e293b]/80 backdrop-blur-sm border border-slate-700 rounded-3xl p-6 md:p-8 hover:border-cyan-500/30 transition-all duration-300 flex flex-col h-full relative group">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-800 text-slate-300 text-xs font-bold px-4 py-1 rounded-full border border-slate-700 uppercase tracking-wider whitespace-nowrap">
               Individual
             </div>
             <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Retail India</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">₹499</span>
                  <span className="text-slate-500">/month</span>
                </div>
                <p className="text-sm text-slate-400 mt-2">For individual researchers & enthusiasts in India.</p>
             </div>
             <hr className="border-slate-700/50 mb-6" />
             <ul className="space-y-4 mb-8 flex-1">
                {[
                  "Real-time Ocean & Weather Data",
                  "AI Forecast Intelligence",
                  "Captain's Brief (Situation, Advisory, Outlook)",
                  "Interactive Visualizations",
                  "Email Risk Notifications"
                ].map((feat, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span className="leading-tight">{feat}</span>
                  </li>
                ))}
             </ul>
             <button 
               onClick={handleSubscribe}
               className="w-full py-4 bg-slate-700 hover:bg-cyan-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-cyan-500/25 border border-transparent hover:border-cyan-400/50 flex items-center justify-center gap-2"
             >
               <IndianRupee className="w-4 h-4" />
               Subscribe Now
             </button>
          </div>

          {/* Retail - International */}
          <div className="bg-gradient-to-b from-[#1e293b] to-[#0f172a] border border-cyan-500/50 rounded-3xl p-6 md:p-8 shadow-2xl shadow-cyan-900/20 relative transform md:-translate-y-4 flex flex-col h-full">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyan-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg uppercase tracking-wider flex items-center gap-1 whitespace-nowrap">
               <Globe className="w-3 h-3" /> Global Best Seller
             </div>
             <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">International</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">$20</span>
                  <span className="text-slate-500">/month</span>
                </div>
                <p className="text-sm text-slate-400 mt-2">For global maritime professionals & analysts.</p>
             </div>
             <hr className="border-slate-700/50 mb-6" />
             <ul className="space-y-4 mb-8 flex-1">
                {[
                  "Global Real-time Data Access",
                  "Advanced AI Forecast Intelligence",
                  "Unlimited Captain's Briefs",
                  "48-hour Outlook & Ocean Facts",
                  "Priority Email Alerts",
                  "Multi-device Sync"
                ].map((feat, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                    <span className="leading-tight">{feat}</span>
                  </li>
                ))}
             </ul>
             <button 
               onClick={handleSubscribe}
               className="w-full py-4 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
             >
               <Zap className="w-4 h-4" />
               Start Global Plan
             </button>
          </div>

          {/* Enterprise */}
          <div className="bg-[#1e293b]/80 backdrop-blur-sm border border-slate-700 rounded-3xl p-6 md:p-8 hover:border-indigo-500/30 transition-all duration-300 flex flex-col h-full relative group">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-800 text-slate-300 text-xs font-bold px-4 py-1 rounded-full border border-slate-700 uppercase tracking-wider whitespace-nowrap">
               Institutional
             </div>
             <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">Contact Us</span>
                </div>
                <p className="text-sm text-slate-400 mt-2">Universities, NGOs, Gov & Research Bodies.</p>
             </div>
             <hr className="border-slate-700/50 mb-6" />
             <ul className="space-y-4 mb-8 flex-1">
                {[
                  "Multi-user Organization Access",
                  "Extended Historical Datasets",
                  "Raw API Access & Integration",
                  "Custom Dashboards & Reports",
                  "Sovereign Data Security",
                  "Dedicated Priority Support"
                ].map((feat, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                    <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
                    <span className="leading-tight">{feat}</span>
                  </li>
                ))}
             </ul>
             <button 
               onClick={handleSubscribe}
               className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-all border border-slate-600 hover:border-indigo-400/50 flex items-center justify-center gap-2"
             >
               <Building2 className="w-4 h-4" />
               Contact Us
             </button>
          </div>

        </div>

        <div className="mt-16 border-t border-slate-800 pt-8">
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
               {/* Just placeholders for logos or trust indicators */}
               <div className="text-lg font-bold text-slate-400 flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> SOC2 Compliant</div>
               <div className="text-lg font-bold text-slate-400 flex items-center gap-2"><Globe className="w-5 h-5" /> 150+ Countries</div>
               <div className="text-lg font-bold text-slate-400 flex items-center gap-2"><Zap className="w-5 h-5" /> 99.9% Uptime</div>
            </div>
            <p className="text-center text-slate-600 text-sm mt-8">
                Secure SSL Encrypted Payment • Cancel Anytime • 24/7 Enterprise Support
            </p>
        </div>

      </div>
    </div>
  );
};

export default SubscriptionPage;
