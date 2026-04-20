"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Plus, Search, MoreVertical, Shield, Mail, Activity, 
  Ban, CheckCircle2, Stethoscope, Edit2, Loader2
} from "lucide-react";
import { getDoctors, toggleUserStatus } from "./actions";

export default function MedicosPage() {
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    getDoctors().then(setDoctors).finally(() => setLoading(false));
  }, []);

  const filteredDoctors = doctors.filter(d => 
    d.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900  tracking-tight">Médicos y Usuarios</h1>
          <p className="text-slate-500  mt-1">Gestión de accesos y perfiles profesionales de la clínica.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6 py-3 text-sm font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95">
          <Plus className="w-5 h-5" /> Nuevo Usuario
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="glass p-4 rounded-2xl flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white  border rounded-xl py-2 pl-11 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
          </div>
        </div>

        {loading ? (
             <div className="py-20 text-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-4">
            {filteredDoctors.map((doctor, i) => (
              <motion.div
                key={doctor.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="group glass p-6 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:scale-[1.02] transition-all relative border border-slate-100  overflow-hidden"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100  flex items-center justify-center relative group-hover:scale-110 transition-transform duration-500">
                      <Stethoscope className="w-7 h-7 text-slate-400" />
                      {doctor.rol === 'admin' && (
                        <div className="absolute -top-1 -right-1 p-1 bg-blue-600 rounded-lg shadow-lg">
                          <Shield className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900  leading-tight">{doctor.name || 'Usuario Admin'}</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mt-1">{doctor.specialty || 'Administración'}</p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-white  rounded-xl transition-all text-slate-400">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                    <Mail className="w-4 h-4 opacity-50" /> {doctor.email}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                    <Activity className="w-4 h-4 opacity-50" /> {doctor.studies_count} estudios procesados
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-100 ">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${doctor.activo ? 'bg-status-normal' : 'bg-status-anormal'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${doctor.activo ? 'text-status-normal' : 'text-status-anormal'}`}>
                      {doctor.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button className="p-2.5 bg-slate-100  rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Edit2 className="w-4 h-4" /></button>
                     <button onClick={() => toggleUserStatus(doctor.id, doctor.activo)} className={`p-2.5 rounded-xl transition-all ${doctor.activo ? 'hover:bg-status-anormal hover:text-white bg-slate-100' : 'bg-status-normal text-white'}`}>
                        {doctor.activo ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                     </button>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 h-1 bg-blue-600 transition-all w-0 group-hover:w-full" />
              </motion.div>
            ))}
          </div>
        )
        }
      </div>
    </div>
  );
}
