"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  Loader2
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { getDashboardStats } from "./actions";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    getDashboardStats().then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) {
     return (
       <div className="h-[80vh] flex flex-col items-center justify-center p-8 gap-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="font-bold text-slate-400 uppercase tracking-widest text-sm">Sincronizando con la red MAPA...</p>
       </div>
     );
  }

  // Safety check for empty stats
  const safeStats = stats || {
    kpis: { total: 0, pendientes: 0, aprobados: 0 },
    distribution: [],
    volumeData: []
  };

  const kpiData = [
    { name: "Total Estudios", value: safeStats.kpis.total, change: "+12%", trend: "up", icon: Activity, color: "text-blue-600", bg: "bg-blue-500/10" },
    { name: "Pendientes", value: safeStats.kpis.pendientes, change: "-2", trend: "down", icon: Clock, color: "text-amber-600", bg: "bg-amber-500/10" },
    { name: "Aprobados", value: safeStats.kpis.aprobados, change: "+8%", trend: "up", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10" },
    { name: "Siguiente Forecast", value: Math.round(safeStats.kpis.total * 1.15), change: "+15%", trend: "up", icon: Users, color: "text-rose-600", bg: "bg-rose-500/10" },
  ];

  return (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900  tracking-tight">Panel de Control</h1>
          <p className="text-slate-500  mt-1">Sincronizado con datos reales de la clínica.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95 text-sm tracking-wide">
            Exportar Informe Anual
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((stat, i) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-6 rounded-[2rem] shadow-sm hover:shadow-2xl hover:scale-[1.02] transition-all group cursor-default"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} p-3 rounded-2xl`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className={`flex items-center gap-1 text-sm font-bold ${stat.trend === "up" ? "text-emerald-500" : "text-amber-500"}`}>
                {stat.change}
                {stat.trend === "up" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400  uppercase tracking-widest">{stat.name}</p>
              <h3 className="text-3xl font-bold text-slate-900  mt-1 leading-none tracking-tight">
                {stat.value}
              </h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass p-8 rounded-[2.5rem] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold tracking-tight">Volumen de Estudios (30d)</h3>
          </div>
          <div className="h-[300px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={safeStats.volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                   <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                   </linearGradient>
                   <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                     <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                   </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f033" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '16px', 
                    fontSize: '12px', 
                    color: '#0f172a',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                  }} 
                />
                
                {/* Real Data Line (Solid) */}
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                />

                {/* Forecast Line (Dotted) - Overlaid on top with subtle fill */}
                <Area 
                  type="monotone" 
                  dataKey="forecast" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  strokeDasharray="5 5"
                  fillOpacity={1} 
                  fill="url(#colorForecast)"
                  connectNulls={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-8 rounded-[2.5rem] flex flex-col">
          <h3 className="text-xl font-bold tracking-tight mb-8">Distribución Clínica</h3>
          <div className="space-y-8 flex-1 flex flex-col justify-center">
             {safeStats.distribution.length > 0 ? safeStats.distribution.map((dist: any) => (
               <ClassificationItem key={dist.clasificacion} label={dist.clasificacion} value={parseFloat(dist.percentage)} />
             )) : (
               <p className="text-center text-slate-400 text-sm italic">Sin datos de distribución</p>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClassificationItem({ label, value }: { label: string; value: number }) {
  const color = label === 'normal' ? 'bg-status-normal' : label === 'elevada' ? 'bg-status-elevated' : 'bg-status-anormal';
  const labelMap: any = { normal: 'Normal', elevada: 'PA Elevada', anormal: 'HTA Confirmada' };
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <span className="text-sm font-bold text-slate-700  tracking-tight capitalize">{labelMap[label] || label}</span>
        <span className="text-lg font-black text-slate-900  leading-none">{value}%</span>
      </div>
      <div className="h-2.5 w-full bg-slate-100  rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 1.5 }} className={`h-full ${color}`} />
      </div>
    </div>
  );
}
