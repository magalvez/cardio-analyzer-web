"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Download, CheckCircle, Clock, User, FileText,
  LineChart, Image as ImageIcon, Save, Info, Heart, Loader2, Eye,
  Check, ZoomIn, ZoomOut, Maximize2
} from "lucide-react";
import Link from "next/link";
import ReportEditor from "@/components/editor";
import { getStudyDetail, saveStudyReport, approveStudy, type StudyDetail } from "./actions";
import { exportStudyWord } from "@/app/dashboard/estudios/actions";

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
  procesando: "bg-slate-100 text-slate-500 border-slate-200",
  completado: "bg-blue-100 text-blue-600 border-blue-200",
  revision: "bg-amber-100 text-amber-600 border-amber-200",
  firmado: "bg-emerald-100 text-emerald-600 border-emerald-200",
  cancelado: "bg-rose-100 text-rose-600 border-rose-200",
};

export default function EstudioDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [study, setStudy] = useState<StudyDetail | null>(null);
  const [activeTab, setActiveTab] = useState("analisis");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [reportContent, setReportContent] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showStatus, setShowStatus] = useState<{ type: 'success' | 'error', title: string, message: string } | null>(null);

  useEffect(() => {
    getStudyDetail(id).then(data => {
      setStudy(data);
      if (data?.informe_html) {
        setReportContent(data.informe_html);
      } else {
        setReportContent(`<h2>INFORME MAPA</h2><p>Paciente: ${data?.patient_name}</p>`);
      }
    }).finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!study) return;
    setSaving(true);
    try {
      await saveStudyReport(id, reportContent);
      setShowStatus({ type: 'success', title: 'Cambios Guardados', message: 'El informe se ha actualizado correctamente.' });
    } catch (e) {
      setShowStatus({ type: 'error', title: 'Error', message: 'No se pudo guardar el informe.' });
    }
    setSaving(false);
  };

  const handleApprove = async () => {
    if (!study) return;
    setApproving(true);
    try {
      await approveStudy(id, reportContent);
      const updated = await getStudyDetail(id);
      setStudy(updated);
      setShowConfirm(false); // Close confirmation only on success
      setShowStatus({
        type: 'success',
        title: 'Estudio Firmado',
        message: 'El examen ha sido formalizado y firmado correctamente.'
      });
    } catch (err) {
      setShowConfirm(false); // Close confirmation to show error
      setShowStatus({
        type: 'error',
        title: 'Fallo en Aprobación',
        message: 'Hubo un problema al intentar aprobar el estudio.'
      });
    }
    setApproving(false);
  };

  const handleDownload = async () => {
    if (!study) return;
    setDownloading(true);
    const base64 = await exportStudyWord(id, reportContent);
    const link = document.createElement('a');
    link.href = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${base64}`;
    link.download = `Reporte_MAPA_${study.patient_name.replace(/\s/g, '_')}.docx`;
    link.click();
    setDownloading(false);
  };

  if (loading) return (
    <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      <p className="font-bold text-slate-400 tracking-widest uppercase">Cargando expediente clínico...</p>
    </div>
  );

  if (!study) return <div className="p-20 text-center font-bold text-rose-500">Estudio no encontrado o sin acceso.</div>;

  return (
    <div className="space-y-6 animate-in">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/estudios" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm group">
          <div className="p-2 border rounded-xl transition-all"><ArrowLeft className="w-4 h-4" /></div>
          Volver a Estudios
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 bg-white  border rounded-xl px-4 py-2 text-sm font-bold shadow-sm hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Word
          </button>
          {study.estado !== 'firmado' && (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={approving}
              className="flex items-center gap-2 bg-blue-600 text-white rounded-xl px-6 py-2 text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Firmar
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-1 space-y-6">
          <div className="glass p-6 rounded-[2rem] shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl">{study.patient_name?.[0]}</div>
              <div>
                <h2 className="font-bold text-lg leading-tight">{study.patient_name}</h2>
                <p className="text-xs font-bold text-slate-400 tracking-tighter uppercase">{study.patient_id}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50  p-3 rounded-2xl border border-slate-100 ">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Edad</p>
                <p className="font-bold">{study.patient_age} años</p>
              </div>
              <div className="bg-slate-50  p-3 rounded-2xl border border-slate-100 ">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sexo</p>
                <p className="font-bold">{study.patient_sex}</p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-[2rem] shadow-lg border-2 transition-all duration-500 ${study.results?.clasificacion === 'anormal' ? 'bg-rose-50 border-rose-200 text-rose-600' :
              study.results?.clasificacion === 'elevada' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                study.results?.clasificacion === 'normal' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                  'bg-slate-50 border-slate-200 text-slate-400'
            }`}>
            <p className="text-xs font-bold opacity-60 uppercase tracking-widest mb-1">Resultado IA</p>
            <h3 className="text-xl font-bold">{classificationLabels[study.results?.clasificacion] || "Sin procesar"}</h3>
          </div>

          <div className="glass p-6 rounded-[2rem] space-y-4">
            <MetricRow label="Calidad" val={study.results?.porcentaje_lecturas_validas ? `${study.results.porcentaje_lecturas_validas}%` : "---"} sub="Válidas" />
            <MetricRow label="Patrón" val={study.results?.patron_circadiano} sub="Dipper/Non" />
            <MetricRow label="Carga PAS" val={study.results?.carga_tensional_pas} sub="Umbral" />
          </div>

          <div className="glass p-6 rounded-[2rem] space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha Recepción</p>
              <p className="text-sm font-bold">
                {new Date(study.recibido_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Motivo</p>
              <p className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg inline-block border border-blue-100">{study.motivo_consulta || '---'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado Actual</p>
              <div className="mt-1">
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${statusStyles[study.estado] || 'bg-slate-100'}`}>
                  {study.estado}
                </span>
              </div>
            </div>
            {study.estado === 'firmado' && study.firmado_at && (
              <div className="space-y-1 animate-in slide-in-from-top-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Firmado el</p>
                <p className="text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg inline-block border border-emerald-100">
                  {new Date(study.firmado_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Guía Clínica</p>
              <p className="text-xs font-bold text-slate-500">{study.guia_usada || 'ESC 2024 (Default)'}</p>
            </div>
          </div>
        </div>

        <div className="xl:col-span-3 space-y-6">
          <div className="flex bg-white  p-1 rounded-2xl border max-w-fit shadow-sm">
            <TabButton active={activeTab === "analisis"} onClick={() => setActiveTab("analisis")} icon={LineChart} label="Análisis" />
            <TabButton active={activeTab === "imagenes"} onClick={() => setActiveTab("imagenes")} icon={ImageIcon} label="Imágenes" />
            <TabButton active={activeTab === "informe"} onClick={() => setActiveTab("informe")} icon={FileText} label="Editor" />
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "analisis" && (
              <motion.div key="analisis" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <ResultCard label="24 Horas" val={study.results?.promedio_24h || "---"} alert={study.results?.clasificacion === 'anormal'} />
                  <ResultCard label="Actividad" val={study.results?.promedio_despierto || "---"} alert={study.results?.clasificacion === 'anormal'} />
                  <ResultCard label="Sueño" val={study.results?.promedio_sueno || "---"} alert={false} />
                </div>
                <div className="glass p-8 rounded-[2.5rem] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10"><Heart className="w-24 h-24 text-blue-500" /></div>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">Narrativa IA <span className="text-[10px] bg-blue-500/10 px-2 py-0.5 rounded-full">Gemini</span></h3>
                  <p className="text-slate-600  leading-relaxed text-lg italic">"{study.results?.narrativa_analisis || "No hay narrativa disponible."}"</p>
                </div>
              </motion.div>
            )}

            {activeTab === "informe" && (
              <motion.div key="informe" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-bold flex items-center gap-2">Editor de Informe</h3>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 text-blue-600 font-bold text-sm bg-blue-50  px-4 py-2 rounded-xl transition-all hover:scale-105 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
                <ReportEditor content={reportContent} onChange={setReportContent} />
              </motion.div>
            )}

            {activeTab === "imagenes" && (
              <motion.div key="imagenes" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {study.imageUrls?.map((url: string, i: number) => (
                  <div key={i} className="glass aspect-[3/4] rounded-3xl overflow-hidden group relative">
                    <ImageWithLoader
                      src={url}
                      alt={`Report page ${i + 1}`}
                      onClick={() => setSelectedImage(url)}
                    />
                    <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/20 transition-all flex items-center justify-center pointer-events-none">
                      <div className="bg-white/90 p-4 rounded-2xl shadow-xl scale-0 group-hover:scale-100 transition-all cursor-pointer pointer-events-auto" onClick={() => setSelectedImage(url)}>
                        <Eye className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <Portal>
            <Lightbox
              src={selectedImage}
              onClose={() => setSelectedImage(null)}
            />
          </Portal>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <Portal>
            <ConfirmModal
              onConfirm={handleApprove}
              onCancel={() => setShowConfirm(false)}
              loading={approving}
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
          <Info className="w-8 h-8" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-black text-slate-900">¿Firmar Estudio?</h3>
          <p className="text-slate-500 text-sm leading-relaxed">Esta acción formaliza y firma el examen. No se podrá revertir.</p>
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

function Lightbox({ src, onClose }: { src: string, onClose: () => void }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleZoomIn = (step: any = 0.5) => {
    const s = typeof step === 'number' ? step : 0.5;
    setScale(prev => Math.min(prev + s, 4));
  };
  const handleZoomOut = (step: any = 0.5) => {
    const s = typeof step === 'number' ? step : 0.5;
    setScale(prev => Math.max(prev - s, 1));
  };
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setResetKey(prev => prev + 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center overflow-hidden"
    >
      {/* High Contrast Controls */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 z-[10001] bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <button
          onClick={handleZoomOut}
          className="p-3 hover:bg-white/10 rounded-xl transition-all text-white/70 hover:text-white"
          title="Alejar"
        >
          <ZoomOut className="w-5 h-5" />
        </button>

        <button
          onClick={handleReset}
          className="px-4 py-2 min-w-[70px] text-xs font-black text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all tracking-tighter"
          title="Restablecer"
        >
          {Math.round(scale * 100)}%
        </button>

        <button
          onClick={handleZoomIn}
          className="p-3 hover:bg-white/10 rounded-xl transition-all text-white/70 hover:text-white"
          title="Acercar"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
      </div>

      <button
        onClick={onClose}
        className="absolute top-8 right-8 p-4 bg-white/5 hover:bg-rose-500/20 text-white/50 hover:text-rose-400 rounded-2xl backdrop-blur-md border border-white/10 transition-all group z-[10001]"
      >
        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
      </button>

      <motion.div
        className="relative w-full h-full flex items-center justify-center p-10 select-none overflow-hidden"
        onWheel={(e) => {
          if (e.deltaY < 0) handleZoomIn(0.2);
          else if (scale > 1) handleZoomOut(0.2);
        }}
      >
        <motion.div
          key={resetKey}
          drag={scale > 1}
          dragMomentum={false}
          initial={{ x: 0, y: 0, scale: 1 }}
          animate={{
            scale,
            x: position.x,
            y: position.y,
            cursor: scale > 1 ? "grab" : "default"
          }}
          whileTap={{ cursor: "grabbing" }}
          transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
          className="relative max-w-4xl w-full h-full flex items-center justify-center shadow-2xl"
        >
          <img
            src={src}
            className="w-full h-full object-contain pointer-events-none rounded-lg"
            alt="Clinical report detailed view"
          />
        </motion.div>
      </motion.div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
        <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Modo Diagnóstico</p>
        <div className="flex items-center gap-4 text-[9px] text-white/60 font-bold uppercase tracking-widest">
          <span>Wheel: Zoom</span>
          <div className="w-1 h-1 bg-white/20 rounded-full" />
          <span>Drag: Move</span>
        </div>
      </div>
    </motion.div>
  );
}

function ImageWithLoader({ src, alt, onClick }: any) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative w-full h-full bg-slate-50 flex items-center justify-center">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onClick={onClick}
        className={`w-full h-full object-cover transition-opacity duration-700 cursor-pointer ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}

function MetricRow({ label, val, sub }: any) {
  return (
    <div className="flex items-center justify-between group">
      <div><p className="text-sm font-bold leading-none">{label}</p><p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{sub}</p></div>
      <span className="text-lg font-black text-blue-600">{val}</span>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-bold text-sm ${active ? "bg-slate-900 text-white  shadow-md" : "text-slate-500 hover:bg-slate-50"}`}>
      <Icon className="w-4 h-4" /> {label}
    </button>
  );
}

function ResultCard({ label, val, alert }: any) {
  return (
    <div className={`glass p-6 rounded-[2rem] border-l-[6px] shadow-sm ${alert ? 'border-l-rose-500' : 'border-l-emerald-500'}`}>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-2xl font-black">{val}</h3>
    </div>
  );
}
