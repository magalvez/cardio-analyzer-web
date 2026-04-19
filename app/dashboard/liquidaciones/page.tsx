"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Plus, FileText, Calendar, ArrowUpRight, CheckCircle2, Clock, Printer, Loader2
} from "lucide-react";
import { getLiquidations } from "./actions";

const statusStyles: Record<string, string> = {
  borrador: "bg-slate-100 text-slate-500",
  enviado: "bg-blue-100 text-blue-600",
  pagado: "bg-emerald-100 text-emerald-600",
};

export default function LiquidacionesPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    getLiquidations().then(setData).finally(() => setLoading(false));
  }, []);

  const totalPaid = data.filter(l => l.estado === 'pagado').reduce((acc, curr) => acc + Number(curr.total), 0);
  const totalPending = data.filter(l => l.estado !== 'pagado').reduce((acc, curr) => acc + Number(curr.total), 0);

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Liquidaciones</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gestión financiera de honorarios médicos por estudios realizados.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6 py-3 text-sm font-bold active:scale-95 shadow-lg shadow-blue-500/20 transition-all">
          <Plus className="w-5 h-5" /> Nueva Liquidación
        </button>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Por Pagar" value={`$${(totalPending / 1000000).toFixed(2)}M`} icon={Clock} color="text-amber-600" bg="bg-amber-500/10" />
          <StatCard label="Total Pagado" value={`$${(totalPaid / 1000000).toFixed(2)}M`} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-500/10" />
          <StatCard label="Liquidaciones" value={data.length.toString()} icon={FileText} color="text-blue-600" bg="bg-blue-500/10" />
          <StatCard label="Periodo" value="Abril 2024" icon={Calendar} color="text-slate-600" bg="bg-slate-500/10" />
       </div>

      <div className="glass rounded-[2.5rem] overflow-hidden shadow-xl">
        <div className="p-8 border-b">
          <h3 className="font-bold text-lg tracking-tight">Registro de Liquidaciones</h3>
        </div>
        
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
             <div className="py-20 text-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" /></div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Médico</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Estudios</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Total</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Estado</th>
                  <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.map((liq, i) => (
                  <motion.tr key={liq.id} className="hover:bg-slate-50/20 transition-colors group">
                    <td className="px-8 py-5">
                      <p className="text-sm font-bold">{liq.doctor}</p>
                      <p className="text-[10px] uppercase font-bold text-slate-400">MAPA Service</p>
                    </td>
                    <td className="px-6 py-5"><span className="text-sm font-black">{liq.total_estudios}</span></td>
                    <td className="px-6 py-5"><div className="font-black text-blue-600">${Number(liq.total).toLocaleString()}</div></td>
                    <td className="px-6 py-5"><span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${statusStyles[liq.estado]}`}>{liq.estado}</span></td>
                    <td className="px-8 py-5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2.5 bg-white border rounded-xl hover:scale-110 transition-transform"><Printer className="w-4 h-4" /></button>
                        <button className="p-2.5 bg-white border rounded-xl hover:scale-110 transition-transform text-emerald-600"><ArrowUpRight className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg }: any) {
  return (
    <div className="glass p-6 rounded-[2rem] shadow-sm group">
      <div className="flex items-center justify-between mb-4">
        <div className={`${bg} p-3 rounded-2xl group-hover:rotate-6 transition-transform`}><Icon className={`w-5 h-5 ${color}`} /></div>
      </div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">{label}</p>
      <h3 className="text-2xl font-black leading-none tracking-tight">{value}</h3>
    </div>
  );
}
