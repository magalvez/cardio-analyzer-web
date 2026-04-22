"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  CheckCircle,
  Check,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Info
} from "lucide-react";
import { getStudies, exportStudyWord, signStudy } from "./actions";
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
  normal: "bg-blue-100 text-blue-800 ",
};

export function EstudiosContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || "";
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState(initialSearch);

  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedIdForSign, setSelectedIdForSign] = useState<string | null>(null);
  const [showStatus, setShowStatus] = useState<{ type: 'success' | 'error', title: string, message: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStudies(page, pageSize, search, {
        status: statusFilter || undefined,
        classification: classFilter || undefined
      });
      setData(res.studies);
      setTotal(res.total);
    } catch (error) {
      console.error("Error fetching studies:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, classFilter, pageSize]);

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, classFilter, pageSize]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 500); // Debounce search
    return () => clearTimeout(timer);
  }, [fetchData]);

  const [signingId, setSigningId] = useState<string | null>(null);

  const handleSign = async () => {
    if (!selectedIdForSign) return;
    setSigningId(selectedIdForSign);
    try {
      await signStudy(selectedIdForSign);
      await fetchData(); // Refresh list to show new status
      setShowConfirm(false);
      setShowStatus({
        type: 'success',
        title: 'Estudio Firmado',
        message: 'El examen ha sido formalizado y firmado correctamente.'
      });
    } catch (e) {
      console.error("Error signing:", e);
      setShowConfirm(false);
      setShowStatus({
        type: 'error',
        title: 'Fallo en Firma',
        message: 'Hubo un problema al intentar firmar el estudio.'
      });
    } finally {
      setSigningId(null);
      setSelectedIdForSign(null);
    }
  };

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
          <div className="relative">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 border rounded-xl px-4 py-2.5 text-sm font-bold transition-all shadow-sm ${showFilters ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              <Filter className="w-4 h-4" />
              Filtros
              {(statusFilter || classFilter) && (
                <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
              )}
            </button>

            <AnimatePresence>
              {showFilters && (
                <>
                  {/* Backdrop for click outside */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowFilters(false)} 
                  />
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 glass rounded-[2.5rem] shadow-2xl p-7 z-50 border border-white/50"
                  >
                    <div className="flex items-center justify-between mb-6">
                       <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800">Filtros Avanzados</h3>
                       <button 
                         onClick={() => setShowFilters(false)}
                         className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                       >
                         <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                         </svg>
                       </button>
                    </div>

                    <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado del Estudio</label>
                      <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full bg-slate-50  border-none rounded-xl py-3 px-4 text-sm font-bold outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="">Cualquier estado</option>
                        <option value="recibido">Recibido</option>
                        <option value="procesando">Procesando</option>
                        <option value="revision">Revisión</option>
                        <option value="firmado">Firmado</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Clasificación</label>
                      <select 
                        value={classFilter}
                        onChange={(e) => setClassFilter(e.target.value)}
                        className="w-full bg-slate-50  border-none rounded-xl py-3 px-4 text-sm font-bold outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="">Cualquier clasificación</option>
                        <option value="normal">Normal</option>
                        <option value="elevada">PA Elevada</option>
                        <option value="anormal">HTA Confirmada</option>
                      </select>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                       <button 
                         onClick={() => { setStatusFilter(""); setClassFilter(""); setShowFilters(false); }}
                         className="w-full py-3 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-rose-100"
                       >
                         Limpiar todos los filtros
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
                        {study.estado !== 'cancelado' && (
                          <div className="flex items-center justify-end gap-2 transition-opacity">
                            <Link href={`/dashboard/estudios/${study.id}`} className="p-2 hover:bg-white  rounded-lg shadow-sm border border-transparent hover:border-slate-200  transition-all text-slate-600 ">
                              <Eye className="w-4 h-4" />
                            </Link>
                            {study.estado === 'normal' && (
                              <button 
                                onClick={(e) => { 
                                  e.preventDefault(); 
                                  e.stopPropagation(); 
                                  setSelectedIdForSign(study.id);
                                  setShowConfirm(true);
                                }}
                                className="p-2 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-slate-200 transition-all text-emerald-600 disabled:opacity-30 flex items-center justify-center min-w-[36px] cursor-pointer"
                                disabled={study.estado === 'firmado' || signingId === study.id}
                                title="Firma Rápida (Solo Normales)"
                              >
                                {signingId === study.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                              </button>
                            )}
                            <button 
                              onClick={(e) => { 
                                e.preventDefault(); 
                                e.stopPropagation(); 
                                handleDownloadQuick(study.id, study.patient); 
                              }}
                              className="p-2 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-slate-200 transition-all text-blue-600 cursor-pointer"
                              title="Descargar Word"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="p-8 border-t border-slate-100  flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <p className="text-sm text-slate-500 font-medium">
              Mostrando <span className="text-slate-900  font-bold">{Math.min((page - 1) * pageSize + 1, total)} - {Math.min(page * pageSize, total)}</span> de <span className="text-slate-900  font-bold">{total}</span> estudios
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

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <Portal>
            <ConfirmModal
              onConfirm={handleSign}
              onCancel={() => setShowConfirm(false)}
              loading={!!signingId}
            />
          </Portal>
        )}
      </AnimatePresence>
      {/* Status Modal */}
      <AnimatePresence>
        {showStatus && (
          <Portal>
            <StatusModal
              {...showStatus}
              onClose={() => setShowStatus(null)}
            />
          </Portal>
        )}
      </AnimatePresence>
    </div>
  );
}

function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return require("react-dom").createPortal(children, document.body);
}

function ConfirmModal({ onConfirm, onCancel, loading }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-md">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-[0_30px_100px_rgba(0,0,0,0.5)] space-y-6">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
          <Info className={`w-8 h-8 ${loading ? 'animate-pulse' : ''}`} />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-black text-slate-900">¿Firmar Estudio?</h3>
          <p className="text-slate-500 text-sm leading-relaxed">Esta acción formaliza y firma el examen de forma definitiva.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all">Cancelar</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sí, Firmar"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatusModal({ type, title, message, onClose }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-slate-950/50 backdrop-blur-sm">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-[0_30px_100px_rgba(0,0,0,0.5)] text-center space-y-6">
        <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center ${type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
          {type === 'success' ? <Check className="w-10 h-10" /> : <Info className="w-10 h-10 rotate-180" />}
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-slate-900">{title}</h3>
          <p className="text-slate-500 text-sm leading-relaxed">{message}</p>
        </div>
        <button onClick={onClose} className="w-full bg-slate-900 text-white px-6 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
          Entendido
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function EstudiosPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center"><Loader2 className="animate-spin mx-auto w-10 h-10" /></div>}>
      <EstudiosContent />
    </Suspense>
  );
}
