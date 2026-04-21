"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, MoreVertical, Shield, Mail, Activity,
  Ban, CheckCircle2, Stethoscope, Edit2, Loader2, BellRing
} from "lucide-react";
import { createPortal } from "react-dom";
import { getDoctors, toggleUserStatus, createUser, updateUser } from "./actions";

export default function MedicosPage() {
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "medico",
    specialty: "",
    telegram_user_id: "",
    telegram_username: ""
  });

  const fetchData = () => {
    setLoading(true);
    getDoctors().then(setDoctors).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    setMounted(true);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (editingId) {
      await updateUser(editingId, form);
    } else {
      await createUser(form);
    }
    setForm({ name: "", email: "", role: "medico", specialty: "", telegram_user_id: "", telegram_username: "" });
    setEditingId(null);
    setShowModal(false);
    setSaving(false);
    fetchData();
  };

  const handleEdit = (doctor: any) => {
    setForm({
      name: doctor.name || "",
      email: doctor.email || "",
      role: doctor.rol || "medico",
      specialty: doctor.specialty || "",
      telegram_user_id: doctor.telegram_user_id || "",
      telegram_username: doctor.telegram_username || ""
    });
    setEditingId(doctor.id);
    setShowModal(true);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setTogglingIds(prev => new Set(prev).add(id));
    await toggleUserStatus(id, currentStatus);
    await fetchData();
    setTogglingIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

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
        <button
          onClick={() => {
            setEditingId(null);
            setForm({ name: "", email: "", role: "medico", specialty: "", telegram_user_id: "", telegram_username: "" });
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6 py-3 text-sm font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
        >
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
                      {doctor.rol === 'admin' ? (
                        <Shield className="w-7 h-7 text-blue-600" />
                      ) : (
                        <Stethoscope className="w-7 h-7 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900  leading-tight">
                        {doctor.name || (doctor.rol === 'admin' ? 'Administrador' : 'Médico Sin Nombre')}
                      </h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        {doctor.rol === 'admin' ? 'Equipo Administrativo' : (doctor.specialty || 'Médico General')}
                      </p>
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

                  <div className="flex items-center gap-2 transition-opacity">
                    <button
                      onClick={() => handleEdit(doctor)}
                      className="p-2.5 bg-slate-100  rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(doctor.id, doctor.activo)}
                      disabled={togglingIds.has(doctor.id)}
                      className={`p-2.5 rounded-xl transition-all ${doctor.activo ? 'hover:bg-status-anormal hover:text-white bg-slate-100' : 'bg-status-normal text-white'} disabled:opacity-50`}
                    >
                      {togglingIds.has(doctor.id) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        doctor.activo ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />
                      )}
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

      {mounted && createPortal(
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowModal(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white  rounded-[3rem] p-10 shadow-2xl w-full max-w-2xl relative z-[10000] border border-slate-100  overflow-y-auto max-h-[95vh]"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-blue-500/10 rounded-2xl">
                    {editingId ? <Edit2 className="w-6 h-6 text-blue-600" /> : <Plus className="w-6 h-6 text-blue-600" />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 ">{editingId ? 'Editar Perfil' : 'Nuevo Usuario'}</h2>
                    <p className="text-slate-500 text-sm">{editingId ? 'Modifica los datos del usuario seleccionado.' : 'Configura un nuevo perfil para tu clínica.'}</p>
                  </div>
                </div>

                <form onSubmit={handleCreate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Nombre Completo</label>
                      <input
                        required
                        placeholder="Ej: Dr. Alejandro Gálvez"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        className="w-full bg-slate-50  border border-slate-200  rounded-2xl p-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Correo Electrónico</label>
                      <input
                        required
                        type="email"
                        placeholder="email@ejemplo.com"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        className="w-full bg-slate-50  border border-slate-200  rounded-2xl p-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Rol en la Plataforma</label>
                      <select
                        value={form.role}
                        onChange={e => setForm({ ...form, role: e.target.value })}
                        className="w-full bg-slate-50  border border-slate-200  rounded-2xl p-4 outline-none appearance-none font-bold text-blue-600 cursor-pointer focus:ring-4 focus:ring-blue-500/10"
                      >
                        <option value="medico">👨‍⚕️ Médico Especialista</option>
                        <option value="admin">🔑 Administrador</option>
                      </select>
                    </div>
                    {form.role === 'medico' && (
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Especialidad</label>
                        <input
                          placeholder="Ej: Cardiología"
                          value={form.specialty}
                          onChange={e => setForm({ ...form, specialty: e.target.value })}
                          className="w-full bg-slate-50  border border-slate-200  rounded-2xl p-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-medium"
                        />
                      </div>
                    )}
                  </div>

                  {form.role === 'medico' && (
                    <div className="p-8 bg-blue-50/50 rounded-3xl space-y-6 border border-blue-100/50">
                      <div className="flex items-center gap-3 text-blue-600">
                        <BellRing className="w-5 h-5" />
                        <h3 className="text-xs font-bold uppercase tracking-wider">Integración Automatizada (Telegram)</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-blue-400 uppercase tracking-wider ml-1">ID de Usuario (Chat ID)</label>
                          <input
                            placeholder="Ej: 12345678"
                            value={form.telegram_user_id}
                            onChange={e => setForm({ ...form, telegram_user_id: e.target.value })}
                            className="w-full bg-white  border border-blue-100  rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-500/10 font-mono text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-blue-400 uppercase tracking-wider ml-1">Username (@usuario)</label>
                          <input
                            placeholder="Ej: alejo_med"
                            value={form.telegram_username}
                            onChange={e => setForm({ ...form, telegram_username: e.target.value })}
                            className="w-full bg-white  border border-blue-100  rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-500/10 font-medium text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {form.role === 'admin' && (
                    <div className="flex items-center justify-center p-6 bg-slate-50  rounded-[2rem] border border-dashed border-slate-200 ">
                      <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-[0.2em] leading-relaxed max-w-xs">
                        Los administradores tienen acceso total a la configuración y facturación.
                      </p>
                    </div>
                  )}

                  <div className="pt-6 flex gap-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 py-4 px-6 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all focus:ring-4 focus:ring-slate-100"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-[2] bg-blue-600 text-white rounded-2xl py-4 px-6 font-bold shadow-xl shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingId ? <CheckCircle2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />)}
                      {editingId ? 'Actualizar Registro' : 'Finalizar Registro'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
