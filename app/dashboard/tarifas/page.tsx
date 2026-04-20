"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Plus, Search, DollarSign, Calendar, Activity, History,
  MoreVertical, Stethoscope, Loader2
} from "lucide-react";
import { getTariffs } from "./actions";

export default function TarifasPage() {
  const [loading, setLoading] = useState(true);
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    getTariffs().then(setTariffs).finally(() => setLoading(false));
  }, []);

  const filteredTariffs = tariffs.filter(t => 
    t.doctor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const avgTariff = tariffs.length > 0 
    ? tariffs.reduce((acc, curr) => acc + Number(curr.precio), 0) / tariffs.length 
    : 0;

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900  tracking-tight">Tarifas por Médico</h1>
          <p className="text-slate-500  mt-1">Configura y gestiona el valor a pagar por cada estudio procesado.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6 py-3 text-sm font-bold active:scale-95 shadow-lg shadow-blue-500/20 transition-all">
          <Plus className="w-5 h-5" /> Nueva Tarifa
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <OverviewStat label="Estudio Principal" val="MAPA" icon={Activity} color="text-blue-600" bg="bg-blue-500/10" />
        <OverviewStat label="Tarifa Promedio" val={`$${Math.round(avgTariff).toLocaleString()}`} sub="COP / estudio" icon={DollarSign} color="text-emerald-600" bg="bg-emerald-500/10" />
        <OverviewStat label="Tarifas Activas" val={tariffs.length.toString()} sub="Médicos configurados" icon={History} color="text-amber-600" bg="bg-amber-500/10" />
      </div>

      <div className="glass rounded-[2.5rem] overflow-hidden shadow-xl">
        <div className="p-8 border-b flex items-center justify-between">
          <h3 className="font-bold text-lg">Historial de Tarifas Activas</h3>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filtrar médico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50  border-none rounded-xl py-2 pl-11 pr-4 text-sm font-medium outline-none"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
             <div className="py-20 text-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" /></div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 ">
                  <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Médico</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Tipo</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Valor</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Desde</th>
                  <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 ">
                {filteredTariffs.map((tariff, i) => (
                  <motion.tr key={tariff.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Stethoscope className="w-5 h-5 text-blue-600" /></div>
                        <span className="text-sm font-bold">{tariff.doctor}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5"><span className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-lg uppercase">MAPA</span></td>
                    <td className="px-6 py-5"><div className="font-black">${Number(tariff.precio).toLocaleString()} <span className="text-[10px] text-slate-400 uppercase">{tariff.moneda}</span></div></td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-500">{new Date(tariff.active_from).toLocaleDateString()}</td>
                    <td className="px-8 py-5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-white rounded-lg shadow-sm border"><MoreVertical className="w-4 h-4 text-slate-400" /></button>
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

function OverviewStat({ label, val, sub, icon: Icon, color, bg }: any) {
  return (
    <div className="glass p-6 rounded-[2rem] shadow-sm relative overflow-hidden group">
      <div className="flex items-center gap-4">
        <div className={`${bg} p-4 rounded-2xl group-hover:rotate-12 transition-transform duration-500`}><Icon className={`w-7 h-7 ${color}`} /></div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          <div className="flex items-end gap-2 mt-1"><h3 className="text-2xl font-black">{val}</h3>{sub && <span className="text-xs font-bold text-slate-400 mb-0.5">{sub}</span>}</div>
        </div>
      </div>
    </div>
  );
}
