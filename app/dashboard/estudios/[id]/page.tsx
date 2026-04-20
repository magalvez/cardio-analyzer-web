"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Download, CheckCircle, Clock, User, FileText, 
  LineChart, Image as ImageIcon, Save, Info, Heart, Loader2, Eye,
  Check
} from "lucide-react";
import Link from "next/link";
import ReportEditor from "@/components/editor";
import { getStudyDetail, saveStudyReport, approveStudy, exportStudyWord } from "./actions";

export default function EstudioDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [study, setStudy] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("analisis");
  const [reportContent, setReportContent] = useState("");

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
    setSaving(true);
    await saveStudyReport(id, reportContent);
    setSaving(false);
  };

  const handleApprove = async () => {
    if (!confirm("¿Estás seguro de aprobar este estudio? Esta acción es definitiva.")) return;
    setApproving(true);
    await approveStudy(id, reportContent);
    setStudy({ ...study, estado: 'aprobado' });
    setApproving(false);
  };

  const handleDownload = async () => {
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
          {study.estado !== 'aprobado' && (
            <button 
              onClick={handleApprove}
              disabled={approving}
              className="flex items-center gap-2 bg-blue-600 text-white rounded-xl px-6 py-2 text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Aprobar
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

          <div className={`p-6 rounded-[2rem] shadow-lg border-2 ${study.results?.clasificacion === 'anormal' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
            <p className="text-xs font-bold opacity-60 uppercase tracking-widest mb-1">Resultado IA</p>
            <h3 className="text-xl font-bold capitalize">{study.results?.clasificacion || "Sin procesar"}</h3>
          </div>
          
          <div className="glass p-6 rounded-[2rem] space-y-4">
             <MetricRow label="Calidad" val={study.results?.porcentaje_lecturas_validas + "%"} sub="Válidas" />
             <MetricRow label="Patrón" val={study.results?.patron_circadiano || "---"} sub="Dipper/Non" />
             <MetricRow label="Carga PAS" val={study.results?.carga_tensional_pas + "%"} sub="Umbral" />
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
                     <img src={url} alt={`Report page ${i+1}`} className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/20 transition-all flex items-center justify-center">
                        <button className="bg-white/90 p-4 rounded-2xl shadow-xl scale-0 group-hover:scale-100 transition-all"><Eye className="w-6 h-6 text-blue-600" /></button>
                     </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
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
