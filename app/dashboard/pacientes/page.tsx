"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Users, Eye, TrendingUp, History, Loader2, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { getPatients } from "./actions";
import Link from "next/link";

const classificationColors: Record<string, string> = {
  normal: "bg-emerald-500",
  elevada: "bg-amber-500",
  anormal: "bg-rose-500",
};

export default function PacientesPage() {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [classFilter, setClassFilter] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPatients(page, pageSize, search, {
        classification: classFilter || undefined
      });
      setPatients(res.patients);
      setTotal(res.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, classFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [search, classFilter, pageSize]);

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900  tracking-tight">Pacientes</h1>
          <p className="text-slate-500  mt-1">Directorio clínico y evolución histórica de pacientes.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500" />
            <input 
              type="text" 
              placeholder="Nombre o cédula..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white  border rounded-xl py-2.5 pl-11 pr-4 text-sm w-[250px] outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
            />
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 border rounded-xl px-4 py-2.5 text-sm font-bold transition-all shadow-sm ${showFilters ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              <Filter className="w-4 h-4" />
              Filtros
              {classFilter && <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />}
            </button>

            <AnimatePresence>
              {showFilters && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowFilters(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-72 glass rounded-[2.5rem] shadow-2xl p-7 z-50 border border-white/50"
                  >
                    <div className="flex items-center justify-between mb-6">
                       <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Filtros</h3>
                       <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-slate-100 rounded-full">
                         <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                         </svg>
                       </button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clasificación Reciente</label>
                        <select 
                          value={classFilter}
                          onChange={(e) => setClassFilter(e.target.value)}
                          className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="">Todos los pacientes</option>
                          <option value="normal">Normal</option>
                          <option value="elevada">PA Elevada</option>
                          <option value="anormal">HTA Confirmada</option>
                        </select>
                      </div>
                      <div className="pt-4 border-t border-slate-100">
                         <button 
                           onClick={() => { setClassFilter(""); setShowFilters(false); }}
                           className="w-full py-3 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-rose-100"
                         >
                           Limpiar filtros
                         </button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="glass rounded-[2rem] overflow-hidden shadow-xl">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 ">
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-slate-400">Paciente</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-slate-400 w-[140px]">Edad / Sexo</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-slate-400 text-center w-[100px]">Estudios</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-slate-400 w-[140px]">Última Visita</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-slate-400 w-[160px]">Estado Reciente</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-slate-400 text-right w-[100px]">Detalles</th>
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
                    {p.ultimo_estudio_id ? (
                      <Link 
                        href={`/dashboard/estudios/${p.ultimo_estudio_id}`}
                        className="inline-flex p-2 bg-slate-50  rounded-lg shadow-sm border border-slate-100 hover:bg-white hover:border-slate-200 transition-all"
                        title="Ver último estudio"
                      >
                        <History className="w-4 h-4 text-slate-400" />
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-300 italic">Sin estudios</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Footer / Pagination */}
        <div className="p-8 border-t border-slate-100  flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <p className="text-sm text-slate-500 font-medium">
              Mostrando <span className="text-slate-900  font-bold">{Math.min((page - 1) * pageSize + 1, total)} - {Math.min(page * pageSize, total)}</span> de <span className="text-slate-900  font-bold">{total}</span> pacientes
            </p>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Filas:</label>
              <select 
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-slate-50 border-none rounded-lg text-xs font-black py-1 px-2 outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-4 py-2 border rounded-xl hover:bg-slate-50 transition-all font-bold text-xs text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>
            <div className="flex items-center px-4">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Página <span className="text-slate-900">{page}</span></span>
            </div>
            <button 
              onClick={() => setPage(p => p + 1)}
              disabled={page * pageSize >= total || loading}
              className="px-4 py-2 border rounded-xl hover:bg-slate-50 transition-all font-bold text-xs text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
