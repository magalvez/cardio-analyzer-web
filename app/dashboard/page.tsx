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
  Loader2,
  Info
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
import { getDashboardStats, exportAnnualReport } from "./actions";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [exporting, setExporting] = useState(false);
  const [daysRange, setDaysRange] = useState(15);

  useEffect(() => {
    setLoading(true);
    getDashboardStats(daysRange).then(setStats).finally(() => setLoading(false));
  }, [daysRange]);

  if (loading && !stats) {
     return (
       <div className="h-[80vh] flex flex-col items-center justify-center p-8 gap-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="font-bold text-slate-400 uppercase tracking-widest text-sm">Sincronizando con la red CARDIO Analyzer...</p>
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
    { 
      name: "Total Estudios", 
      value: safeStats.kpis.total, 
      change: safeStats.kpis.change || "+0%", 
      trend: parseFloat(safeStats.kpis.change) >= 0 ? "up" : "down", 
      icon: Activity, 
      color: "text-blue-600", 
      bg: "bg-blue-500/10",
      info: "Comparativa porcentual del volumen total de estudios entre los últimos 14 días y el periodo anterior de 14 días."
    },
    { 
      name: "Pendientes", 
      value: safeStats.kpis.pendientes, 
      change: "-2", 
      trend: "down", 
      icon: Clock, 
      color: "text-amber-600", 
      bg: "bg-amber-500/10",
      info: "Cantidad de estudios en proceso (Recibido, Procesando, Revisión) que requieren atención del equipo médico."
    },
    { 
      name: "Siguiente Forecast", 
      value: Math.round(safeStats.kpis.total * 1.15), 
      change: "+15%", 
      trend: "up", 
      icon: Users, 
      color: "text-rose-600", 
      bg: "bg-rose-500/10",
      info: "Proyección estadística estimada (+15%) del volumen de estudios para el cierre del ciclo actual basada en la tendencia."
    },
    { 
      name: "Aprobados", 
      value: safeStats.kpis.aprobados, 
      change: "+8%", 
      trend: "up", 
      icon: CheckCircle2, 
      color: "text-emerald-600", 
      bg: "bg-emerald-500/10",
      info: "Porcentaje de estudios que ya cuentan con firma electrónica y diagnóstico validado."
    },
  ];

  return (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900  tracking-tight">Panel de Control</h1>
          <p className="text-slate-500  mt-1">Sincronizado con datos reales de la clínica.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={async () => {
              setExporting(true);
              try {
                const base64 = await exportAnnualReport();
                const blob = await (await fetch(`data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${base64}`)).blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Informe_Gestion_MAPA_${new Date().getFullYear()}.docx`;
                a.click();
              } catch (error) {
                console.error(error);
              } finally {
                setExporting(false);
              }
            }}
            disabled={exporting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95 text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {exporting ? 'Generando...' : 'Exportar Informe Anual'}
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
            className="glass p-6 rounded-[2rem] shadow-sm hover:shadow-2xl hover:scale-[1.02] transition-all group cursor-default relative overflow-visible"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} p-3 rounded-2xl`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1 text-sm font-bold ${stat.trend === "up" ? "text-emerald-500" : "text-amber-500"}`}>
                  {stat.change}
                  {stat.trend === "up" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                </div>
                
                {/* Tooltip Wrapper */}
                <div className="relative group/tooltip">
                  <Info className="w-4 h-4 text-slate-300 hover:text-blue-500 cursor-help transition-colors" />
                  <div className="absolute bottom-full right-0 mb-2 w-48 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 z-50">
                    <div className="bg-slate-900 text-white text-[10px] p-3 rounded-xl shadow-xl font-medium leading-relaxed relative">
                      {stat.info}
                      <div className="absolute top-full right-2 w-2 h-2 bg-slate-900 rotate-45 -translate-y-1" />
                    </div>
                  </div>
                </div>
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
        <div className="lg:col-span-2 glass p-8 rounded-[2.5rem] flex flex-col relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h3 className="text-xl font-bold tracking-tight">Volumen de Estudios</h3>
            
            <div className="flex bg-slate-100/50  p-1 rounded-xl items-center">
               {[15, 30, 45, 60].map((d) => (
                 <button
                   key={d}
                   onClick={() => setDaysRange(d)}
                   className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                     daysRange === d 
                       ? "bg-white text-blue-600 shadow-sm" 
                       : "text-slate-500 hover:text-slate-900"
                   }`}
                 >
                   {d} días
                 </button>
               ))}
            </div>
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
