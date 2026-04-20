"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Users, Eye, TrendingUp, History, Loader2 } from "lucide-react";
import { getPatients } from "./actions";

const classificationColors: Record<string, string> = {
  normal: "bg-emerald-500",
  elevada: "bg-amber-500",
  anormal: "bg-rose-500",
};

export default function PacientesPage() {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getPatients(search).then(setPatients).finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900  tracking-tight">Pacientes</h1>
          <p className="text-slate-500  mt-1">Directorio clínico y evolución histórica de pacientes.</p>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500" />
          <input 
            type="text" 
            placeholder="Nombre o cédula..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white  border rounded-xl py-2.5 pl-11 pr-4 text-sm w-[300px] outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
          />
        </div>
      </div>

      <div className="glass rounded-[2rem] overflow-hidden shadow-xl">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 ">
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-slate-400">Paciente</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-slate-400">Edad / Sexo</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-slate-400 text-center">Estudios</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-slate-400">Última Visita</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-slate-400">Estado Reciente</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-slate-400 text-right">Detalles</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                   <td colSpan={6} className="py-20 text-center">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                   </td>
                </tr>
              ) : patients.map((p, i) => (
                <motion.tr 
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-slate-50/50  transition-colors cursor-pointer group"
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50  text-blue-600 flex items-center justify-center font-bold">
                        {p.nombre_completo[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900  leading-tight">{p.nombre_completo}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{p.cedula}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-medium text-slate-600 ">{p.edad} años • {p.sexo}</p>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-sm font-black text-slate-900  bg-slate-100  px-3 py-1 rounded-lg">
                      {p.total_estudios}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-medium text-slate-600 ">
                      {p.ultimo_estudio ? new Date(p.ultimo_estudio).toLocaleDateString() : "---"}
                    </p>
                  </td>
                  <td className="px-6 py-5">
                    {p.clasificacion_reciente ? (
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${classificationColors[p.clasificacion_reciente]}`} />
                        <span className="text-xs font-bold uppercase tracking-tight">{p.clasificacion_reciente}</span>
                      </div>
                    ) : <span className="text-xs text-slate-400">-</span>}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="p-2 hover:bg-white  rounded-lg shadow-sm border border-transparent hover:border-slate-200 transition-all opacity-0 group-hover:opacity-100">
                      <History className="w-4 h-4 text-slate-400" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
