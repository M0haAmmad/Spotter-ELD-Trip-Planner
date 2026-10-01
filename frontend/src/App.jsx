import React, { useState, useEffect } from 'react';
import { 
  Map, 
  MapPin, 
  Navigation, 
  Clock, 
  Truck, 
  Calendar, 
  AlertCircle,
  Play,
  Pause,
  Coffee,
  BarChart2,
  Loader2,
  CheckCircle2,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';

const INITIAL_LOGS = [
  { duty_status: "Off Duty", hours: 10.0, location: "Chicago, IL", remark: "10-hour mandatory rest" },
  { duty_status: "On Duty (Not Driving)", hours: 1.0, location: "Chicago, IL", remark: "Pre-trip inspection & Loading" },
  { duty_status: "Driving", hours: 8.5, location: "En Route", remark: "Driving to dropoff" },
  { duty_status: "On Duty (Not Driving)", hours: 1.0, location: "Nashville, TN", remark: "Unloading & Post-trip" }
];

function App() {
  // Real-time Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Form Input State
  const [tripInput, setTripInput] = useState({
    current_location: 'Chicago, IL',
    pickup_location: 'Indianapolis, IN',
    dropoff_location: 'Nashville, TN',
    current_cycle_used: '45'
  });

  // API Async States
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [apiData, setApiData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const handleInputChange = (e) => {
    setTripInput({ ...tripInput, [e.target.name]: e.target.value });
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setApiError(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/calculate-trip/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_location: tripInput.current_location,
          pickup_location: tripInput.pickup_location,
          dropoff_location: tripInput.dropoff_location,
          current_cycle_used: parseFloat(tripInput.current_cycle_used) || 0
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setApiData(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('API Connection Error:', err);
      setApiError(err.message || 'Unable to connect to Django API at http://127.0.0.1:8000/api/calculate-trip/');
    } finally {
      setLoading(false);
    }
  };

  // Metrics extraction from API or fallbacks
  const metrics = apiData?.calculated_metrics;
  const tripDetails = apiData?.trip_details;
  const eldLogs = apiData?.eld_logs || INITIAL_LOGS;

  const drivingHours = metrics ? metrics.estimated_driving_hours : 8.5;
  const onDutyHours = metrics ? metrics.total_on_duty_hours : 10.5;
  const cycleUsed = parseFloat(tripInput.current_cycle_used) || 45;
  
  // Dynamic remaining hours calculation from API or local fallback
  const remainingCycleHours = metrics ? metrics.remaining_cycle_hours : (70 - (cycleUsed + onDutyHours));

  // Determine compliance level & status text
  let complianceLevel = metrics?.compliance_level;
  let complianceStatusText = metrics?.compliance_status;

  if (!complianceLevel) {
    if (remainingCycleHours > 15) {
      complianceLevel = "Normal";
      complianceStatusText = "Compliant: Normal operation";
    } else if (remainingCycleHours > 0) {
      complianceLevel = "Warning";
      complianceStatusText = "Warning: Cycle Limit Approaching";
    } else {
      complianceLevel = "Action Req";
      complianceStatusText = "Action Req: 70-hour limit exceeded";
    }
  }

  const formatHoursMinutes = (decimalHours) => {
    const isNegative = decimalHours < 0;
    const absHours = Math.abs(decimalHours);
    const hrs = Math.floor(absHours);
    const mins = Math.round((absHours - hrs) * 60);
    const formatted = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    return isNegative ? `-${formatted}` : formatted;
  };

  // Helper for compliance styling
  const getComplianceStyle = (level) => {
    if (level === 'Normal') {
      return {
        badge: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
        banner: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200/90',
        icon: 'text-emerald-400',
        bar: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]'
      };
    }
    if (level === 'Warning') {
      return {
        badge: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
        banner: 'bg-amber-500/10 border-amber-500/20 text-amber-200/90',
        icon: 'text-amber-400',
        bar: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]'
      };
    }
    // Action Req
    return {
      badge: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
      banner: 'bg-rose-500/10 border-rose-500/20 text-rose-200/90',
      icon: 'text-rose-400',
      bar: 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]'
    };
  };

  const styleConfig = getComplianceStyle(complianceLevel);

  // Status badge styling helper for ELD logs
  const getStatusBadge = (status) => {
    const lower = (status || '').toLowerCase();
    if (lower.includes('driving')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold shadow-sm">
          <Truck className="w-3 h-3" /> {status}
        </span>
      );
    }
    if (lower.includes('on duty')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold shadow-sm">
          <Coffee className="w-3 h-3" /> {status}
        </span>
      );
    }
    if (lower.includes('sleeper')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold shadow-sm">
          <Pause className="w-3 h-3" /> {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-500/10 text-slate-400 border border-slate-500/20 text-xs font-bold shadow-sm">
        <Pause className="w-3 h-3" /> {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
      
      {/* Dynamic Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-emerald-400">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">ELD Trip Planner</h1>
            <p className="text-sm text-slate-400 font-medium">Logistics & Fleet Management Dashboard</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-lg border border-slate-700 shadow-inner">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-white">
              {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-lg border border-slate-700 shadow-inner">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-white font-mono">
              {currentTime.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form & Metrics */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Trip Configuration Form */}
          <form onSubmit={handleCalculate} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors duration-500"></div>
            
            <h2 className="text-lg font-bold text-white mb-5 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-emerald-400" /> 
                Trip Configuration
              </span>
              {lastUpdated && (
                <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 text-emerald-400" /> {lastUpdated}
                </span>
              )}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Current Location</label>
                <div className="relative group/input">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-emerald-400 transition-colors" />
                  <input 
                    type="text" 
                    name="current_location"
                    value={tripInput.current_location}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
                    placeholder="e.g. Chicago, IL"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Pickup Location</label>
                <div className="relative group/input">
                  <Play className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500/70 group-focus-within/input:text-emerald-400 transition-colors" />
                  <input 
                    type="text" 
                    name="pickup_location"
                    value={tripInput.pickup_location}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
                    placeholder="e.g. Indianapolis, IN"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Dropoff Location</label>
                <div className="relative group/input">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-rose-500/70 group-focus-within/input:text-rose-400 transition-colors" />
                  <input 
                    type="text" 
                    name="dropoff_location"
                    value={tripInput.dropoff_location}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
                    placeholder="e.g. Nashville, TN"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Current Cycle Used (Hours)</label>
                <div className="relative group/input">
                  <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-emerald-400 transition-colors" />
                  <input 
                    type="number" 
                    step="0.5"
                    name="current_cycle_used"
                    value={tripInput.current_cycle_used}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
                    placeholder="e.g. 45"
                  />
                </div>
              </div>

              {/* Error Alert Box */}
              {apiError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-400 leading-relaxed flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{apiError}</span>
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-slate-900 disabled:text-slate-400 font-bold py-3 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-900" /> 
                    <span>Calculating Route & HOS...</span>
                  </>
                ) : (
                  'Calculate Route & HOS'
                )}
              </button>
            </div>
          </form>

          {/* Results & Metrics Panel */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden group">
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors duration-500"></div>

            <div className="flex justify-between items-center mb-5 relative z-10">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-emerald-400" /> 
                HOS Metrics
              </h2>
              {apiData ? (
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Live API Connected
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded border border-slate-600">
                  Default View
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col gap-1 shadow-inner hover:border-slate-600 transition-colors">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Est. Driving Time</span>
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-bold text-emerald-400">{formatHoursMinutes(drivingHours)}</span>
                  <span className="text-sm font-medium text-slate-500 mb-0.5">hrs</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)] transition-all duration-500"
                    style={{ width: `${Math.min(100, (drivingHours / 11) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col gap-1 shadow-inner hover:border-slate-600 transition-colors">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total On-Duty Time</span>
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-bold text-emerald-400">{formatHoursMinutes(onDutyHours)}</span>
                  <span className="text-sm font-medium text-slate-500 mb-0.5">hrs</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)] transition-all duration-500"
                    style={{ width: `${Math.min(100, (onDutyHours / 14) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col gap-1 col-span-2 shadow-inner hover:border-slate-600 transition-colors">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">70-Hour Cycle Remaining</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${styleConfig.badge}`}>
                    {complianceLevel}
                  </span>
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-bold text-white">{formatHoursMinutes(remainingCycleHours)}</span>
                  <span className="text-sm font-medium text-slate-500 mb-0.5">hrs remaining</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${styleConfig.bar}`}
                    style={{ width: `${Math.max(0, Math.min(100, (remainingCycleHours / 70) * 100))}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className={`mt-5 p-4 rounded-xl flex items-start gap-3 border transition-colors relative z-10 ${styleConfig.banner}`}>
              {complianceLevel === 'Action Req' ? (
                <ShieldAlert className={`w-5 h-5 flex-shrink-0 mt-0.5 animate-bounce ${styleConfig.icon}`} />
              ) : (
                <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 animate-pulse ${styleConfig.icon}`} />
              )}
              <p className="text-sm leading-relaxed">
                <strong className={`font-bold ${styleConfig.icon}`}>Status: </strong>
                {complianceStatusText}
              </p>
            </div>
          </div>
          
        </div>

        {/* Right Column: ELD & Map */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Map / Route View */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl h-[380px] relative overflow-hidden flex flex-col group">
            <div className="p-4 bg-slate-800/90 backdrop-blur-md border-b border-slate-700 z-10 flex justify-between items-center absolute top-0 w-full transition-colors group-hover:bg-slate-800/95">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Map className="w-4 h-4 text-emerald-400" /> 
                Interactive Route View
              </h2>
              <div className="flex gap-2">
                <span className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-md text-xs font-semibold text-slate-300 shadow-inner">
                  Origin: {tripDetails ? tripDetails.current_location : tripInput.current_location}
                </span>
                <span className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-md text-xs font-semibold text-slate-300 shadow-inner">
                  Pickup: {tripDetails ? tripDetails.pickup_location : tripInput.pickup_location}
                </span>
                <span className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-md text-xs font-semibold text-slate-300 shadow-inner">
                  Dropoff: {tripDetails ? tripDetails.dropoff_location : tripInput.dropoff_location}
                </span>
              </div>
            </div>
            
            {/* Map Mock Graphic */}
            <div className="flex-1 w-full h-full bg-[#0f172a] relative overflow-hidden">
               <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.5 }}></div>
               
               <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 100 240 C 200 240, 250 140, 400 190 S 550 90, 700 140" fill="transparent" stroke="#10b981" strokeWidth="4" strokeDasharray="8 4" className="animate-[dash_10s_linear_infinite]" />
               </svg>
               
               <style dangerouslySetInnerHTML={{__html: `
                 @keyframes dash {
                   to {
                     stroke-dashoffset: -100;
                   }
                 }
               `}} />

               {/* Origin */}
               <div className="absolute top-[230px] left-[90px] flex flex-col items-center group/point cursor-pointer hover:scale-110 transition-transform">
                 <div className="w-4 h-4 bg-emerald-500 rounded-full border-4 border-slate-900 shadow-[0_0_15px_rgba(16,185,129,0.5)] group-hover/point:shadow-[0_0_20px_rgba(16,185,129,0.8)] transition-shadow"></div>
                 <span className="mt-2 text-xs font-bold bg-slate-900/80 px-2 py-1 rounded text-white border border-slate-700 backdrop-blur-sm shadow-md">
                   {tripInput.current_location || 'Current'}
                 </span>
               </div>

               {/* Pickup / Rest Stop */}
               <div className="absolute top-[180px] left-[390px] flex flex-col items-center group/point cursor-pointer hover:scale-110 transition-transform">
                 <div className="w-6 h-6 bg-slate-800 border-2 border-amber-500 rounded-full flex items-center justify-center shadow-lg z-10 group-hover/point:shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-shadow">
                   <Coffee className="w-3 h-3 text-amber-500" />
                 </div>
                 <span className="mt-2 text-[10px] font-bold bg-slate-900/80 px-2 py-1 rounded text-amber-400 border border-slate-700 whitespace-nowrap backdrop-blur-sm shadow-md">
                   Pickup: {tripInput.pickup_location || 'Pickup'}
                 </span>
               </div>

               {/* Destination */}
               <div className="absolute top-[130px] left-[690px] flex flex-col items-center group/point cursor-pointer hover:scale-110 transition-transform">
                 <div className="w-4 h-4 bg-rose-500 rounded-full border-4 border-slate-900 shadow-[0_0_15px_rgba(244,63,94,0.5)] group-hover/point:shadow-[0_0_20px_rgba(244,63,94,0.8)] transition-shadow"></div>
                 <span className="mt-2 text-xs font-bold bg-slate-900/80 px-2 py-1 rounded text-white border border-slate-700 backdrop-blur-sm shadow-md">
                   {tripInput.dropoff_location || 'Dropoff'}
                 </span>
               </div>
            </div>
          </div>

          {/* ELD Daily Log Sheets Component */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl overflow-hidden relative">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 relative z-10">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-400" /> 
                  ELD Daily Log Sheets
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Automated Hours of Service Duty Status Breakdown</p>
              </div>
              
              <div className="flex flex-wrap gap-3 bg-slate-900/50 p-2 rounded-lg border border-slate-700">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-slate-500 shadow-[0_0_5px_rgba(100,116,139,0.5)]"></div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Off</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_5px_rgba(99,102,241,0.5)]"></div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SB</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Drv</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]"></div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">On</span></div>
              </div>
            </div>

            {/* Visual Timeline Header */}
            <div className="relative pt-4 pb-2 z-10">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-10">
                <span>M</span><span>2</span><span>4</span><span>6</span><span>8</span><span>10</span><span>N</span>
                <span>2</span><span>4</span><span>6</span><span>8</span><span>10</span><span>M</span>
              </div>
              
              {/* Grid Lines */}
              <div className="absolute top-10 left-10 right-0 h-[120px] pointer-events-none flex justify-between">
                {[...Array(25)].map((_, i) => (
                  <div key={i} className={`w-px h-full ${i % 4 === 0 ? 'bg-slate-700/80' : 'bg-slate-700/30'} `}></div>
                ))}
              </div>

              {/* Status Rows */}
              <div className="relative h-[120px] border-l border-b border-r border-slate-700 bg-slate-900/50 rounded-b-lg ml-10 shadow-inner">
                <div className="absolute left-0 -ml-10 w-8 h-full flex flex-col justify-around text-[10px] font-bold text-slate-400 text-right pr-2">
                  <span>OFF</span>
                  <span>SB</span>
                  <span>DRV</span>
                  <span>ON</span>
                </div>
                
                {/* SVG Graph Line */}
                <svg className="w-full h-full absolute inset-0 z-10 drop-shadow-md" preserveAspectRatio="none" viewBox="0 0 240 120">
                  <path d="M 0 15 L 40 15 L 40 45 L 80 45 L 80 105 L 90 105 L 90 75 L 130 75 L 130 15 L 140 15 L 140 75 L 180 75 L 180 105 L 200 105 L 200 45 L 240 45" 
                        fill="transparent" 
                        stroke="url(#gradient)" 
                        strokeWidth="2.5" 
                        strokeLinejoin="round" />
                  
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#64748b" />
                      <stop offset="25%" stopColor="#6366f1" />
                      <stop offset="50%" stopColor="#10b981" />
                      <stop offset="75%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>

                  <line x1="0" y1="15" x2="40" y2="15" stroke="#64748b" strokeWidth="2.5" />
                  <line x1="40" y1="45" x2="80" y2="45" stroke="#6366f1" strokeWidth="2.5" />
                  <line x1="80" y1="105" x2="90" y2="105" stroke="#f59e0b" strokeWidth="2.5" />
                  <line x1="90" y1="75" x2="130" y2="75" stroke="#10b981" strokeWidth="2.5" />
                  <line x1="130" y1="15" x2="140" y2="15" stroke="#64748b" strokeWidth="2.5" />
                  <line x1="140" y1="75" x2="180" y2="75" stroke="#10b981" strokeWidth="2.5" />
                  <line x1="180" y1="105" x2="200" y2="105" stroke="#f59e0b" strokeWidth="2.5" />
                  <line x1="200" y1="45" x2="240" y2="45" stroke="#6366f1" strokeWidth="2.5" />
                </svg>
              </div>
            </div>

            {/* Dynamic Table populated from backend response */}
            <div className="mt-8 overflow-x-auto relative z-10">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/50">
                    <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider rounded-tl-lg">Duty Status</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Duration</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Location</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider rounded-tr-lg">Remarks</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-700/50">
                  {eldLogs.map((log, index) => (
                    <tr key={index} className="hover:bg-slate-700/30 transition-colors group">
                      <td className="py-3 px-4">
                        {getStatusBadge(log.duty_status)}
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-medium group-hover:text-white transition-colors">
                        {log.hours} {log.hours === 1 ? 'hr' : 'hrs'}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-medium group-hover:text-slate-300 transition-colors">
                        {log.location || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-slate-300 group-hover:text-white transition-colors">
                        {log.remark || 'Standard duty status log'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
        
      </div>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-slate-800 text-center text-sm text-slate-500 flex flex-col gap-1">
        <p>© 2026 Spotter AI — Fleet Management & Logistics Demo System. All rights reserved.</p>
        <p className="text-xs font-semibold text-emerald-400/90 tracking-wide">Developed by Mohammad BaniYounis</p>
      </footer>
    </div>
  );
}

export default App;
