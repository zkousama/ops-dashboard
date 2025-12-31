"use client";

import { useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  YAxis,
} from "recharts";
import { ShieldAlert, ShieldCheck, Activity, Zap, Cpu, MemoryStick, XCircle, CheckCircle } from "lucide-react";

// standard fetcher for swr
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// define modal types for type safety
type ModalState = {
  isOpen: boolean;
  type: "success" | "error" | "neutral";
  title: string;
  message: string;
};

export default function Dashboard() {
  const [mitigating, setMitigating] = useState(false);
  const [chartHistory, setChartHistory] = useState<any[]>([]);
  
  // NEW: State for the custom modal
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: "neutral",
    title: "",
    message: "",
  });

  const { data, error } = useSWR("http://localhost:8000/metrics", fetcher, {
    refreshInterval: 2000,
  });

  useEffect(() => {
    if (data) {
      setChartHistory((prev) => {
        const newHistory = [...prev, data];
        if (newHistory.length > 30) return newHistory.slice(newHistory.length - 30);
        return newHistory;
      });
    }
  }, [data]);

  const closeModal = () => setModal((prev) => ({ ...prev, isOpen: false }));

  const handleMitigation = async () => {
    setMitigating(true);
    try {
      const secret = process.env.NEXT_PUBLIC_API_SECRET || "default-insecure-secret";
      
      const res = await fetch("http://localhost:8000/mitigate", {
        headers: {
          "x-api-key": secret
        }
      });

      if (!res.ok) throw new Error("unauthorized");

      const result = await res.json();
      
      // REPLACED ALERT WITH MODAL
      setModal({
        isOpen: true,
        type: "success",
        title: "EXECUTION_REPORT",
        message: `:: ${result.message} :: TARGET_ELIMINATED`,
      });
      
      mutate("http://localhost:8000/metrics");
    } catch (err) {
      console.error(err);
      // REPLACED ALERT WITH MODAL
      setModal({
        isOpen: true,
        type: "error",
        title: "ACCESS_DENIED",
        message: ":: CRITICAL_FAILURE :: INVALID_SECURITY_TOKEN_OR_NETWORK_ERROR",
      });
    } finally {
      setMitigating(false);
    }
  };

  if (error)
    return (
      <div className="flex h-screen items-center justify-center bg-black text-red-600 font-mono uppercase text-2xl tracking-widest border-4 border-red-900 m-4">
        [FATAL_ERROR] :: BACKEND_CONNECTION_LOST
      </div>
    );
  if (!data)
    return (
      <div className="flex h-screen items-center justify-center bg-black text-gray-500 font-mono uppercase text-2xl tracking-widest animate-pulse">
        [BOOT_SEQUENCE] :: ESTABLISHING_UPLINK...
      </div>
    );

  const isThreat = data.prediction === "ANOMALY DETECTED";

  return (
    <main className="min-h-screen bg-black text-gray-200 font-mono p-4 md:p-8 relative selection:bg-green-500 selection:text-black">
      
      {/* --- CUSTOM BRUTALIST MODAL --- */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div 
            className={`
              max-w-xl w-full border-4 p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)]
              ${modal.type === 'error' ? 'border-red-600 bg-red-950/20' : 'border-green-600 bg-green-950/20'}
            `}
          >
            <div className="flex items-center gap-4 mb-6 border-b-2 border-white/10 pb-4">
              {modal.type === 'error' ? <XCircle className="w-10 h-10 text-red-500" /> : <CheckCircle className="w-10 h-10 text-green-500" />}
              <h3 className={`text-3xl font-black uppercase tracking-widest ${modal.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                {modal.title}
              </h3>
            </div>
            
            <p className="text-xl md:text-2xl font-bold uppercase text-white mb-10 leading-relaxed">
              {modal.message}
            </p>

            <button
              onClick={closeModal}
              className={`
                w-full py-4 text-xl font-black uppercase tracking-[0.2em] border-2 transition-all hover:translate-x-1 hover:-translate-y-1
                ${modal.type === 'error' 
                  ? 'bg-red-600 border-red-500 hover:bg-red-500 text-black' 
                  : 'bg-green-600 border-green-500 hover:bg-green-500 text-black'
                }
              `}
            >
              [ ACKNOWLEDGE ]
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="border-b-4 border-white/20 pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase text-white leading-none">
            OPSGUARD
            <span className={isThreat ? "text-red-600" : "text-green-600"}>_CORE</span>
          </h1>
          <p className="text-sm uppercase tracking-[0.3em] text-gray-500 mt-2">
            :: HOST_INTRUSION_PREVENTION_SYSTEM :: V1.0.4
          </p>
        </div>
        <div className="flex items-center gap-3 border-2 border-white/10 p-2 px-4 bg-white/5">
          <div className={`w-3 h-3 ${isThreat ? 'bg-red-600 animate-[ping_1s_ease-in-out_infinite]' : 'bg-green-600'}`}></div>
          <span className="text-sm uppercase font-bold tracking-wider">
            SYSTEM_{isThreat ? 'CRITICAL' : 'NOMINAL'}
          </span>
        </div>
      </header>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* THREAT PANEL */}
        <section 
          className={`border-4 p-6 flex flex-col justify-between min-h-[400px] relative transition-all duration-300 ${
            isThreat 
              ? "border-red-600 bg-red-950/30 shadow-[0_0_30px_rgba(220,38,38,0.2)]" 
              : "border-white/20 bg-white/5"
          }`}
        >
          <div>
            <h2 className="text-xl font-bold uppercase mb-8 tracking-wider flex items-center gap-3">
              {isThreat ? <ShieldAlert className="w-6 h-6 text-red-500" /> : <ShieldCheck className="w-6 h-6 text-green-500" />}
              THREAT_VECTOR_ANALYSIS
            </h2>
            
            <div className="mb-12">
              <span className="block text-sm uppercase text-gray-500 mb-2">CURRENT_STATUS //</span>
              <span 
                className={`text-5xl md:text-6xl font-black uppercase tracking-tight leading-none ${
                  isThreat ? "text-red-500 drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]" : "text-green-500"
                }`}
              >
                {data.prediction}
              </span>
            </div>

            <div>
              <span className="block text-sm uppercase text-gray-500 mb-2">MODEL_STATE //</span>
              <span className="text-2xl font-bold uppercase text-white">
                {data.trained ? "[TRAINED_&_ACTIVE]" : "[CALIBRATING_WAIT...]"}
              </span>
            </div>
          </div>
            
          {/* ACTION BUTTON */}
          {isThreat && (
            <button
              onClick={handleMitigation}
              disabled={mitigating}
              className={`
                mt-8 w-full p-6 text-xl font-black uppercase tracking-widest
                border-4 transition-all active:translate-y-1 flex items-center justify-center gap-4
                ${mitigating 
                  ? "bg-gray-800 border-gray-600 text-gray-400 cursor-not-allowed" 
                  : "bg-red-600 border-red-800 text-white hover:bg-red-700 hover:border-red-500 hover:shadow-[0_0_20px_rgba(220,38,38,0.6)]"
                }
              `}
            >
              <Zap className={`w-8 h-8 ${mitigating ? 'animate-spin' : ''}`} />
              {mitigating ? "EXECUTING_PURGE..." : "INITIATE_MITIGATION"}
            </button>
          )}
        </section>

        {/* METRICS PANEL */}
        <section className="border-4 border-white/20 bg-white/5 p-6 flex flex-col h-full">
          <h2 className="text-xl font-bold uppercase mb-8 tracking-wider flex items-center gap-3">
            <Activity className="w-6 h-6" />
            LIVE_TELEMETRY_FEED
          </h2>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="border-2 border-white/10 bg-black/40 p-4 relative overflow-hidden group hover:border-white/30 transition-colors">
              <div className="flex items-center gap-2 text-sm uppercase text-gray-500 mb-2">
                <Cpu className="w-4 h-4" /> CPU_LOAD
              </div>
              <div className="text-4xl font-black text-white">{data.cpu}%</div>
              {/* background decorative bar */}
              <div className="absolute bottom-0 left-0 h-1 bg-white/20 w-full">
                 <div className="h-full bg-green-500" style={{ width: `${data.cpu}%` }}></div>
              </div>
            </div>
            <div className="border-2 border-white/10 bg-black/40 p-4 group hover:border-white/30 transition-colors">
              <div className="flex items-center gap-2 text-sm uppercase text-gray-500 mb-2">
                <MemoryStick className="w-4 h-4" /> RAM_AVAIL
              </div>
              <div className="text-4xl font-black text-white">{data.memory_gb} GB</div>
            </div>
          </div>
          
          {/* CHART */}
          <div className="flex-grow border-2 border-white/10 bg-black/40 p-2 relative min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartHistory}>
                <YAxis domain={[0, 100]} hide />
                <Line
                  type="step" 
                  dataKey="cpu"
                  stroke={isThreat ? "#dc2626" : "#16a34a"} 
                  strokeWidth={3}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="absolute bottom-2 right-2 text-xs uppercase text-gray-600 tracking-widest">
              // REALTIME_BUFFER_1M
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}