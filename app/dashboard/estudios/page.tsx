"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  CheckCircle,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react";
import { getStudies, exportStudyWord } from "./actions";
import Link from "next/link";

const classificationColors: Record<string, string> = {
  normal: "bg-emerald-500",
  elevada: "bg-amber-500",
  anormal: "bg-rose-500",
};

const classificationLabels: Record<string, string> = {
  normal: "Normal",
  elevada: "PA Elevada",
  anormal: "HTA Confirmada",
};

const statusStyles: Record<string, string> = {
  procesando: "bg-slate-100 text-slate-500 ",
  completado: "bg-blue-100 text-blue-600 ",
  revision: "bg-amber-100 text-amber-600 ",
  firmado: "bg-emerald-100 text-emerald-600 ",
  cancelado: "bg-rose-100 text-rose-600 ",
};

export default function EstudiosPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const pageSize = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStudies(page, pageSize, search);
      setData(res.studies);
      setTotal(res.total);
    } catch (error) {
      console.error("Error fetching studies:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 500); // Debounce search
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleDownloadQuick = async (id: string, patientName: string) => {
    try {
      const base64 = await exportStudyWord(id); // Use existing server report
      const link = document.createElement('a');
      link.href = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${base64}`;
      link.download = `Reporte_MAPA_${patientName.replace(/\s/g, '_')}.docx`;
      link.click();
    } catch (e) {
      console.error("Error downloading:", e);
    }
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900  tracking-tight">Estudios</h1>
          <p className="text-slate-500  mt-1">
            Gestiona y revisa los reportes MAPA procesados de la clínica.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar paciente o cédula..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white  border rounded-xl py-2.5 pl-11 pr-4 text-sm w-[250px] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
          </div>
          <button className="flex items-center gap-2 bg-white  border rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700  hover:bg-slate-50  transition-all shadow-sm">
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="glass rounded-[2rem] shadow-xl border-slate-100  relative overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 ">
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-slate-400 text-left min-w-[250px]">Paciente</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-slate-400 text-left w-[140px]">Fecha</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-slate-400 text-left">Motivo</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-slate-400 text-left w-[180px]">Clasificación</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-slate-400 text-left w-[140px]">Estado</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-slate-400 text-right w-[160px]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100  relative">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  <tr key="loading">
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cargando estudios...</p>
                      </div>
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr key="empty">
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-slate-100  rounded-2xl flex items-center justify-center">
                          <Search className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No se encontraron estudios</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.map((study, i) => (
                    <motion.tr 
                      key={study.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="hover:bg-blue-50/30  transition-colors cursor-pointer group"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100  flex items-center justify-center font-bold text-slate-500 group-hover:scale-110 transition-transform duration-500">
                            {study.patient?.[0] || "?"}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900  leading-tight">{study.patient}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{study.id_number}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-medium text-slate-600 ">
                          {study.recibido_at ? new Date(study.recibido_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-bold bg-slate-100  text-slate-500 px-3 py-1 rounded-lg">
                          {study.motivo_consulta}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${classificationColors[study.clasificacion] || 'bg-slate-300'}`} />
                          <span className="text-xs font-bold tracking-tight">
                            {classificationLabels[study.clasificacion] || "Sin Clasificar"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${statusStyles[study.estado] || 'bg-slate-100'}`}>
                          {study.estado}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/dashboard/estudios/${study.id}`} className="p-2 hover:bg-white  rounded-lg shadow-sm border border-transparent hover:border-slate-200  transition-all text-slate-600 ">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            className="p-2 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-slate-200 transition-all text-emerald-600 disabled:opacity-30"
                            disabled={study.estado === 'firmado'}
                            title="Firmar estudio"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { 
                              e.preventDefault(); 
                              e.stopPropagation(); 
                              handleDownloadQuick(study.id, study.patient); 
                            }}
                            className="p-2 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-slate-200 transition-all text-blue-600"
                            title="Descargar Word"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="p-6 border-t border-slate-100  flex items-center justify-between">
          <p className="text-sm text-slate-500 font-medium">
            Mostrando <span className="text-slate-900  font-bold">{Math.min((page - 1) * pageSize + 1, total)} - {Math.min(page * pageSize, total)}</span> de <span className="text-slate-900  font-bold">{total}</span> estudios
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="p-2 border rounded-xl hover:bg-slate-50  transition-colors disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold px-4">Página {page}</span>
            </div>
            <button 
              onClick={() => setPage(p => p + 1)}
              disabled={page * pageSize >= total || loading}
              className="p-2 border rounded-xl hover:bg-slate-50  transition-colors disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
