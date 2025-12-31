"use client";

import useSWR, { mutate } from "swr";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ShieldCheck, ShieldAlert, Activity, Server } from "lucide-react";

// 1. The Fetcher (Standard SWR boilerlate)
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Dashboard() {
  // 2. Poll the API every 2 seconds
  const { data, error } = useSWR("http://127.0.0.1:8000/metrics", fetcher, {
    refreshInterval: 2000,
  });

  // 3. Handle Loading/Error States
  if (error) return <div className="p-10 text-red-500">Failed to load backend. Is Python running?</div>;
  if (!data) return <div className="p-10 text-gray-500">Loading Intelligence...</div>;

  // 4. Determine Status Color
  const isDanger = data.prediction === "ANOMALY DETECTED";
  const statusColor = isDanger ? "bg-red-500" : "bg-green-500";
  const statusText = isDanger ? "THREAT DETECTED" : "SYSTEM SECURE";

  const handleMitigation = async () => {
    try {
      await fetch("http://127.0.0.1:8000/mitigate");
      alert("Counter-measures deployed! Threat neutralized.");
      // Force a refresh of the data immediately
      mutate("http://127.0.0.1:8000/metrics"); 
    } catch (err) {
      console.error(err);
      alert("Failed to execute mitigation.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-10 font-mono">
      {/* Header */}
      <div className="flex justify-between items-center mb-10 border-b border-slate-800 pb-5">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Server className="w-8 h-8 text-blue-400" />
          OpsGuard<span className="text-slate-500 text-sm">v1.0</span>
        </h1>
	
	{/* Header Controls */}
        <div className="flex items-center gap-4">
        
        {/* The Kill Switch - Only shows if Danger is detected */}
        {isDanger && (
          <button 
            onClick={handleMitigation}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-bold animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.7)] transition-all"
          >
            MITIGATE THREAT
          </button>
        )}

        {/* Status Badge */}
        <div className={`px-4 py-2 rounded-full font-bold flex items-center gap-2 ${isDanger ? 'bg-red-900 text-red-100' : 'bg-green-900 text-green-100'}`}>
          {isDanger ? <ShieldAlert className="w-5 h-5"/> : <ShieldCheck className="w-5 h-5"/>}
          {statusText}
        </div>
      </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CPU Card */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity size={100} />
          </div>
          <h2 className="text-slate-400 mb-2">CPU Usage</h2>
          <div className="text-5xl font-bold mb-4">{data.cpu}%</div>
          <div className="h-2 w-full bg-slate-800 rounded-full">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${data.cpu > 50 ? 'bg-orange-500' : 'bg-blue-500'}`} 
              style={{ width: `${Math.min(data.cpu, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Memory Card */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <h2 className="text-slate-400 mb-2">Memory Available</h2>
          <div className="text-5xl font-bold text-purple-400">{data.memory_gb} GB</div>
          <p className="text-sm text-slate-500 mt-2">Allocated Reserve</p>
        </div>

      </div>

      {/* AI Console Log (Fake Terminal) */}
      <div className="mt-6 bg-black p-4 rounded-xl border border-slate-800 font-mono text-sm h-48 overflow-y-auto">
        <div className="text-green-500 mb-2">$ systemctl status ops-guard</div>
        <div className="text-slate-400">
          [LOG] Connected to Prometheus... OK <br/>
          [LOG] AI Model Loaded (IsolationForest)... OK <br/>
          [AI]  Current Anomaly Score: {isDanger ? <span className="text-red-500 font-bold">CRITICAL</span> : "0.02 (Normal)"} <br/>
          [AI]  Training Status: {data.trained ? "MODEL TRAINED" : "LEARNING..."}
        </div>
      </div>
    </div>
  );
}
