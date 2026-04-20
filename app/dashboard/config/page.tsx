"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Building2, ShieldCheck, Percent, BookOpen, Save, Globe, BellRing, Loader2, Check
} from "lucide-react";
import { getClinicConfig, updateClinicConfig } from "./actions";

export default function ConfigPage() {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);
  const [guia, setGuia] = useState("");
  const [name, setName] = useState("");
  const [iva, setIva] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getClinicConfig().then(data => {
      if (data) {
        setConfig(data);
        setGuia(data.guide || "ESH 2023");
        setName(data.name || "");
        setIva(data.iva || 0);
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await updateClinicConfig({ name, guide: guia, iva: Number(iva) });
    setSaving(false);
  };

  if (loading) return (
     <div className="h-[80vh] flex flex-col items-center justify-center p-8 gap-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="font-bold text-slate-400 uppercase tracking-widest text-sm text-center">Leyendo configuración de red...</p>
     </div>
  );

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900  tracking-tight">Configuración</h1>
          <p className="text-slate-500  mt-1">Sincronizado con los parámetros institucionales de tu clínica.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-8 py-3.5 text-sm font-bold shadow-lg shadow-blue-500/20 active:scale-95 group transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
          {saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <section className="glass p-8 rounded-[2.5rem] shadow-sm">
             <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-500/10 rounded-2xl"><Building2 className="w-6 h-6 text-blue-600" /></div>
                <h2 className="text-xl font-bold tracking-tight">Identidad de la Institución</h2>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Razón Social</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white  border rounded-2xl py-3 px-4 outline-none font-medium" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Dominio Seguro</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={`${(name || 'clinica').toLowerCase().replace(/\s/g, '')}.mapacardio.com`} 
                      readOnly 
                      className="w-full bg-slate-50  border rounded-2xl py-3 pl-11 pr-4 font-medium text-slate-500" 
                    />
                  </div>
                </div>
             </div>
          </section>

          <section className="glass p-8 rounded-[2.5rem] shadow-sm">
             <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-emerald-500/10 rounded-2xl"><ShieldCheck className="w-6 h-6 text-emerald-600" /></div>
                <h2 className="text-xl font-bold tracking-tight">Algoritmos Clínicos</h2>
             </div>
             <div className="space-y-4">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Guía Clínica de Referencia</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <GuiaOption id="ESC2024" title="ESC 2024" desc="European Soc. Cardio" active={guia === "ESC 2024"} onClick={() => setGuia("ESC 2024")} />
                   <GuiaOption id="ESH2023" title="ESH 2023" desc="European Soc. Hyper" active={guia === "ESH 2023"} onClick={() => setGuia("ESH 2023")} />
                   <GuiaOption id="ACC2017" title="ACC/AHA" desc="American College" active={guia === "ACC/AHA 2017"} onClick={() => setGuia("ACC/AHA 2017")} />
                </div>
             </div>
          </section>
        </div>

        <div className="xl:col-span-1 space-y-8">
          <section className="glass p-8 rounded-[2.5rem] border-l-4 border-l-blue-500">
             <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-500/10 rounded-2xl"><Percent className="w-6 h-6 text-blue-600" /></div>
                <h2 className="text-xl font-bold tracking-tight">Impuestos</h2>
             </div>
             <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">IVA Aplicable (%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={iva} 
                    onChange={(e) => setIva(Number(e.target.value))}
                    className="w-full bg-white  border rounded-2xl py-4 px-6 text-2xl font-black outline-none" 
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</div>
                </div>
             </div>
          </section>

          <section className="glass p-8 rounded-[2.5rem] shadow-sm">
             <div className="flex items-center gap-3 mb-6"><BellRing className="w-5 h-5 text-slate-400" /><h3 className="font-bold">Notificaciones</h3></div>
             <div className="space-y-4">
                <ToggleItem label="Informes procesados" active={true} />
                <ToggleItem label="Liquidaciones" active={false} />
             </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function GuiaOption({ id, title, desc, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`p-6 rounded-[2rem] border-2 text-left transition-all ${active ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white  border-slate-100 '}`}>
      <BookOpen className={`w-6 h-6 mb-4 ${active ? 'text-white' : 'text-blue-500'}`} />
      <h3 className="font-bold text-lg leading-tight mb-1">{title}</h3>
      <p className={`text-[10px] font-bold uppercase tracking-tighter ${active ? 'text-blue-100' : 'text-slate-400'}`}>{desc}</p>
    </button>
  );
}

function ToggleItem({ label, active }: any) {
  return (
    <div className="flex items-center justify-between group">
      <span className="text-sm font-medium text-slate-600 ">{label}</span>
      <div className={`w-10 h-6 rounded-full p-1 transition-colors ${active ? 'bg-blue-600' : 'bg-slate-200 '}`}>
        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${active ? 'translate-x-4' : 'translate-x-0'}`} />
      </div>
    </div>
  );
}
