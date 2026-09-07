import React, { useState, useMemo, useEffect } from "react";
import {
  collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc,
  arrayUnion, arrayRemove, writeBatch,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebaseConfig";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList,
} from "recharts";
import {
  LayoutDashboard, Database, Wallet, Table2, BookOpen, Plus, X,
  ChevronDown, ChevronUp, Activity, TrendingUp, Package, ClipboardCheck,
  AlertTriangle, CheckCircle2, Search, Trash2, SlidersHorizontal, Settings, Save, Cloud, CloudOff,
  ArrowUp, ArrowDown, ArrowUpDown, Pencil, KeyRound, Download, FileDown,
} from "lucide-react";

const AREAS_DEFAULT = ["Emergencias", "UCI", "Farmacia Interna", "Quirófano",
  "Imagenología", "Laboratorio Clínico", "Hospitalización",
  "Consulta Externa", "Compras", "Mantenimiento", "Administración", "Otros"];
const RESPONSABLES_DEFAULT = ["Bqf.Johana Guevara","Lcda.Diana Ramón","Lcda.Marcela Pesantez",
  "Lcda.Sandra Ortiz","Lcda.Mariela Peñalosa","Lcda.Martha Astudillo","Lcda.Isabel León",
  "Bqf.Gabriela Romero","Ing.Alan Ochoa","Aux.Paola Ucho"];
const TIPOS = ["Nuevo", "Reposición"];
const PRIORIDADES = ["Alta", "Media", "Baja"];
const CRITICIDADES = ["Crítica", "Alta", "Media", "Baja"];
const ESTADOS = ["Pendiente", "En Revisión", "Aprobado", "Rechazado", "Adquirido"];
const YEARS = [2025, 2026];
// Datos demostrativos iniciales para presentación administrativa. Se pueden editar/eliminar desde Base de Datos.
const DEMO_ROWS = [
["SOL-2026-001","2026-01-08","2026-02-12","UCI","UCI","Bqf.Johana Guevara","Ventilador mecánico","Nuevo","Crítica","Alta","Adquirido",28500,4,"Reposición de parque crítico por vida útil","Recepción e instalación completadas."],
["SOL-2026-002","2026-01-12","2026-03-02","Emergencias","Emergencias","Lcda.Diana Ramón","Monitor multiparamétrico","Nuevo","Alta","Alta","Adquirido",6200,8,"Ampliación de capacidad de atención",""],
["SOL-2026-003","2026-01-16","","Quirófano","Quirófano","Lcda.Marcela Pesantez","Máquina de anestesia","Nuevo","Crítica","Alta","Aprobado",32500,2,"Modernización de quirófanos","Pendiente coordinación de entrega."],
["SOL-2026-004","2026-01-21","","Imagenología","Imagenología","Ing.Alan Ochoa","Ecógrafo portátil","Nuevo","Alta","Alta","En Revisión",18400,3,"Cobertura de áreas críticas","En evaluación técnica."],
["SOL-2026-005","2026-01-27","","Laboratorio Clínico","Laboratorio Clínico","Bqf.Gabriela Romero","Analizador hematológico","Reposición","Alta","Media","Aprobado",21800,2,"Reemplazo por obsolescencia",""],
["SOL-2026-006","2026-02-03","","Hospitalización","Hospitalización","Lcda.Sandra Ortiz","Bomba de infusión","Reposición","Alta","Alta","Adquirido",1450,20,"Sustituir equipos antiguos e incrementar disponibilidad",""],
["SOL-2026-007","2026-02-10","","UCI","UCI","Lcda.Mariela Peñalosa","Monitor de signos vitales","Reposición","Alta","Media","En Revisión",5800,6,"Sustitución de equipos fuera de vida útil",""],
["SOL-2026-008","2026-02-18","","Emergencias","Emergencias","Lcda.Martha Astudillo","Desfibrilador bifásico","Reposición","Crítica","Alta","Pendiente",12400,3,"Garantizar disponibilidad para respuesta inmediata","Solicitud prioritaria."],
["SOL-2026-009","2026-02-25","","Farmacia Interna","Farmacia Interna","Lcda.Isabel León","Refrigerador para medicamentos","Nuevo","Alta","Media","Aprobado",6900,2,"Ampliación de capacidad de almacenamiento",""],
["SOL-2026-010","2026-03-04","","Quirófano","Quirófano","Lcda.Marcela Pesantez","Lámpara cialítica","Reposición","Alta","Media","En Revisión",9800,4,"Reemplazo por deterioro",""],
["SOL-2026-011","2026-03-11","","Laboratorio Clínico","Laboratorio Clínico","Bqf.Gabriela Romero","Centrífuga de laboratorio","Reposición","Media","Media","Adquirido",3600,3,"Renovación de equipos de apoyo",""],
["SOL-2026-012","2026-03-19","","Imagenología","Imagenología","Ing.Alan Ochoa","Equipo de rayos X digital","Nuevo","Crítica","Alta","Pendiente",142000,1,"Fortalecer capacidad diagnóstica institucional","Inversión estratégica."],
["SOL-2026-013","2026-03-28","","Hospitalización","Hospitalización","Lcda.Sandra Ortiz","Cama hospitalaria eléctrica","Reposición","Media","Media","Aprobado",4200,12,"Reemplazo de camas con desgaste",""],
["SOL-2026-014","2026-04-05","","Consulta Externa","Consulta Externa","Lcda.Diana Ramón","Electrocardiógrafo","Nuevo","Media","Baja","Adquirido",2800,4,"Ampliación de cartera de servicios",""],
["SOL-2026-015","2026-04-12","","UCI","UCI","Lcda.Mariela Peñalosa","Electrocardiógrafo","Reposición","Alta","Media","Pendiente",5200,2,"Sustitución de equipos obsoletos",""],
["SOL-2026-016","2026-04-20","","Emergencias","Emergencias","Lcda.Diana Ramón","Camilla de transporte","Reposición","Media","Media","En Revisión",3100,10,"Renovación de parque de transporte",""],
["SOL-2025-001","2025-02-10","2025-03-15","UCI","UCI","Bqf.Johana Guevara","Ventilador mecánico","Reposición","Crítica","Alta","Adquirido",26500,3,"Reposición de equipos antiguos",""],
["SOL-2025-002","2025-03-06","2025-04-02","Imagenología","Imagenología","Ing.Alan Ochoa","Ecógrafo estacionario","Nuevo","Alta","Alta","Adquirido",52000,2,"Fortalecimiento diagnóstico",""],
["SOL-2025-003","2025-04-18","2025-05-22","Laboratorio Clínico","Laboratorio Clínico","Bqf.Gabriela Romero","Analizador bioquímico","Nuevo","Alta","Alta","Adquirido",68000,1,"Incremento de capacidad diagnóstica",""],
["SOL-2025-004","2025-05-08","","Quirófano","Quirófano","Lcda.Marcela Pesantez","Mesa quirúrgica eléctrica","Reposición","Alta","Media","Aprobado",17500,3,"Reemplazo de equipos antiguos",""],
["SOL-2025-005","2025-06-02","","Hospitalización","Hospitalización","Lcda.Sandra Ortiz","Bomba de infusión","Reposición","Alta","Media","Adquirido",1350,15,"Renovación del parque de bombas",""],
["SOL-2025-006","2025-07-14","","Emergencias","Emergencias","Lcda.Martha Astudillo","Monitor multiparamétrico","Nuevo","Alta","Alta","Aprobado",6100,5,"Ampliación de capacidad",""],
];
const INITIAL_DATA = DEMO_ROWS.map(([id,fecha,fechaEntrega,area,servicio,responsable,equipo,tipo,criticidad,prioridad,estado,valorUnitario,cantidad,justificacion,observaciones]) => ({
  id, fecha, fechaEntrega, anio:Number(fecha.slice(0,4)), area, servicio, responsable, equipo, tipo, criticidad, prioridad, estado, valorUnitario, cantidad, total:valorUnitario*cantidad, justificacion, observaciones,
}));
const INITIAL_BUDGET = [
  {area:"UCI",anio:2025,presupuesto:145000},{area:"UCI",anio:2026,presupuesto:210000},
  {area:"Emergencias",anio:2025,presupuesto:105000},{area:"Emergencias",anio:2026,presupuesto:120000},
  {area:"Quirófano",anio:2025,presupuesto:95000},{area:"Quirófano",anio:2026,presupuesto:125000},
  {area:"Imagenología",anio:2025,presupuesto:150000},{area:"Imagenología",anio:2026,presupuesto:190000},
  {area:"Laboratorio Clínico",anio:2025,presupuesto:115000},{area:"Laboratorio Clínico",anio:2026,presupuesto:105000},
  {area:"Hospitalización",anio:2025,presupuesto:95000},{area:"Hospitalización",anio:2026,presupuesto:115000},
  ...AREAS_DEFAULT.filter(a=>!["UCI","Emergencias","Quirófano","Imagenología","Laboratorio Clínico","Hospitalización"].includes(a)).flatMap(area=>YEARS.map(anio=>({area,anio,presupuesto:45000})))
];

const INK = "#0B2A3D";
const INK_2 = "#123B52";
const TEAL = "#12A594";
const TEAL_DARK = "#0B6E64";
const AMBER = "#E3A008";
const CORAL = "#E4572E";
const VIOLET = "#7C6AE0";
const SLATE = "#445062";
const SLATE_LIGHT = "#7C8A9A";
const BORDER = "#E2E8ED";
const BG = "#F3F6F7";
const CARD = "#FFFFFF";

const STATUS_STYLE = {
  "Pendiente":   { bg: "#FDF3D8", text: "#8A6D00", dot: "#E3A008" },
  "En Revisión": { bg: "#DCEAFE", text: "#1E4E8C", dot: "#3D8BD4" },
  "Aprobado":    { bg: "#DCF5EF", text: "#0B6E64", dot: "#12A594" },
  "Rechazado":   { bg: "#FBE2DE", text: "#A3341E", dot: "#E4572E" },
  "Adquirido":   { bg: "#EAE6FC", text: "#4C3AA8", dot: "#7C6AE0" },
};
const PRIORITY_STYLE = {
  "Alta":  { bg: "#FBE2DE", text: "#A3341E" },
  "Media": { bg: "#FDF3D8", text: "#8A6D00" },
  "Baja":  { bg: "#DCF5EF", text: "#0B6E64" },
};
const TIPO_STYLE = {
  "Nuevo":      { bg: "#DCF5EF", text: "#0B6E64" },
  "Reposición": { bg: "#FDEBDC", text: "#B45A0F" },
};
const CRITICIDAD_STYLE = {
  "Crítica": { bg:"#FBE2DE", text:"#A3341E", dot:"#C83B22" },
  "Alta": { bg:"#FDEBDC", text:"#B45A0F", dot:"#E3A008" },
  "Media": { bg:"#FDF3D8", text:"#8A6D00", dot:"#D4A017" },
  "Baja": { bg:"#DCF5EF", text:"#0B6E64", dot:"#12A594" },
};
const CHART_PALETTE = [INK, TEAL, AMBER, CORAL, VIOLET, "#3D8BD4", "#8A6D00", SLATE_LIGHT, "#0B6E64", "#B45A0F"];

const fmtUSD = (n) => "$" + Math.round(n).toLocaleString("es-EC");
const fmtUSDk = (n) => {
  if (Math.abs(n) >= 1000000) return "$" + (n / 1000000).toFixed(1) + "M";
  if (Math.abs(n) >= 1000) return "$" + Math.round(n / 1000) + "k";
  return "$" + Math.round(n);
};
const fmtPct = (n) => (n * 100).toFixed(1) + "%";
const uid = () => Date.now().toString().slice(-6) + Math.floor(Math.random() * 90 + 10);
const APP_PASSWORD = "1a2b3c";

// --- Persistencia local (funciona en el sitio ya desplegado; en la vista previa de Claude.ai se ignora) ---
const STORAGE_PREFIX = "acq_equipos_medicos_";
const presupuestoId = (area, anio) =>`${area}_${anio}`.replace(/[\/\\]/g, "-");
function loadLocal(key, fallback) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return fallback;
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* localStorage no disponible: se usa el valor por defecto */ }
  return fallback;
}
function saveLocal(key, value) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) { /* almacenamiento lleno o no disponible: se ignora silenciosamente */ }
}
function escapeXml(value) { return String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;"); }
function downloadXML(rows) {
  const fields=["id","fecha","fechaEntrega","anio","area","servicio","responsable","equipo","tipo","criticidad","prioridad","estado","valorUnitario","cantidad","total","justificacion","observaciones"];
  const body=rows.map(r=>`    <solicitud>\n${fields.map(f=>`      <${f}>${escapeXml(r[f])}</${f}>`).join("\n")}\n    </solicitud>`).join("\n");
  const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<adquisiciones hospital="Gestión de Adquisiciones Biomédicas" fecha_exportacion="${new Date().toISOString()}">\n${body}\n</adquisiciones>`;
  const blob=new Blob([xml],{type:"application/xml;charset=utf-8"}), url=URL.createObjectURL(blob), a=document.createElement("a");
  a.href=url; a.download=`adquisiciones_biomedicas_${new Date().toISOString().slice(0,10)}.xml`; a.click(); URL.revokeObjectURL(url);
}

export default function App() {
  const cloudMode = isFirebaseConfigured;
  const [cloudReady, setCloudReady] = useState(!cloudMode);
  const [tab, setTab] = useState("dashboard");
  const [data, setData] = useState(() => { const saved = cloudMode ? null : loadLocal("data", null); return cloudMode ? [] : (Array.isArray(saved) && saved.length ? saved : INITIAL_DATA); });
  const [budget, setBudget] = useState(() => { const saved = cloudMode ? null : loadLocal("budget", null); return cloudMode ? [] : (Array.isArray(saved) && saved.length ? saved : INITIAL_BUDGET); });
  const [areas, setAreas] = useState(() => (cloudMode ? [] : loadLocal("areas", AREAS_DEFAULT)));
  const [responsables, setResponsables] = useState(() => (cloudMode ? [] : loadLocal("responsables", RESPONSABLES_DEFAULT)));
  const [filters, setFilters] = useState({ area: "Todos", estado: "Todos", responsable: "Todos", anio: "Todos", valorRango: "Todos" });
  const [showFilteredList, setShowFilteredList] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [dbSearch, setDbSearch] = useState("");
  const [dbFilterEstado, setDbFilterEstado] = useState("Todos");
  const [toast, setToast] = useState(null);
  const [newArea, setNewArea] = useState("");
  const [newResp, setNewResp] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, dir: null });
  const [areaMetric, setAreaMetric] = useState("inversion");
  const [authModal, setAuthModal] = useState(null); // { type: "delete"|"edit", id }
  const [authPass, setAuthPass] = useState("");
  const [authError, setAuthError] = useState("");
  const emptyForm = {
    id: "", fecha: new Date().toISOString().slice(0, 10), fechaEntrega: "", area: areas[0] || "", servicio: "", responsable: responsables[0] || "",
    equipo: "", tipo: "Nuevo", justificacion: "", criticidad: "Media", prioridad: "Media", estado: "Pendiente",
    valorUnitario: "", cantidad: 1, observaciones: "",
  };
  const [form, setForm] = useState(emptyForm);

  // --- Sincronización con Firestore (tiempo real, compartido entre todos los usuarios) ---
  useEffect(() => {
    if (!cloudMode) return;
    let gotSolicitudes = false, gotPresupuesto = false, gotConfig = false;
    const markReady = () => { if (gotSolicitudes && gotPresupuesto && gotConfig) setCloudReady(true); };

    const unsubSolicitudes = onSnapshot(collection(db, "solicitudes"), async (snap) => {
      if (snap.empty && !gotSolicitudes) {
        const batch = writeBatch(db);
        INITIAL_DATA.forEach((r) => batch.set(doc(db, "solicitudes", r.id), r));
        await batch.commit();
      } else {
        setData(snap.docs.map((d) => d.data()));
      }
      gotSolicitudes = true; markReady();
    });

    const unsubPresupuesto = onSnapshot(collection(db, "presupuesto"), async (snap) => {
      if (snap.empty && !gotPresupuesto) {
        const batch = writeBatch(db);
        INITIAL_BUDGET.forEach((b) => batch.set(doc(db, "presupuesto", presupuestoId(b.area, b.anio)), b));
        await batch.commit();
      } else {
        setBudget(snap.docs.map((d) => d.data()));
      }
      gotPresupuesto = true; markReady();
    });

    const unsubConfig = onSnapshot(doc(db, "config", "listas"), async (snap) => {
      if (!snap.exists()) {
        await setDoc(doc(db, "config", "listas"), { areas: AREAS_DEFAULT, responsables: RESPONSABLES_DEFAULT });
      } else {
        const d = snap.data();
        setAreas(d.areas || AREAS_DEFAULT);
        setResponsables(d.responsables || RESPONSABLES_DEFAULT);
      }
      gotConfig = true; markReady();
    });

    return () => { unsubSolicitudes(); unsubPresupuesto(); unsubConfig(); };
  }, [cloudMode]);

  // Guarda automáticamente en el navegador cuando NO hay Firebase configurado
  useEffect(() => { if (!cloudMode) saveLocal("data", data); }, [data, cloudMode]);
  useEffect(() => { if (!cloudMode) saveLocal("budget", budget); }, [budget, cloudMode]);
  useEffect(() => { if (!cloudMode) saveLocal("areas", areas); }, [areas, cloudMode]);
  useEffect(() => { if (!cloudMode) saveLocal("responsables", responsables); }, [responsables, cloudMode]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptyForm); };

  const submitForm = (e) => {
    e.preventDefault();
    if (!form.equipo || !form.valorUnitario) { showToast("Completa equipo y valor unitario."); return; }
    if (!editingId) {
      const idTrim = form.id.trim();
      if (!idTrim) { showToast("Ingresa el ID de la solicitud."); return; }
      if (data.some((r) => r.id === idTrim)) { showToast("Ese ID ya existe. Usa uno diferente."); return; }
    }
    const year = new Date(form.fecha).getFullYear();
    const record = {
      id: editingId || form.id.trim(),
      fecha: form.fecha, fechaEntrega: form.fechaEntrega || "", anio: year, area: form.area, servicio: form.servicio || form.area,
      responsable: form.responsable, equipo: form.equipo, tipo: form.tipo,
      justificacion: form.justificacion || "Sin justificación registrada", criticidad: form.criticidad || form.prioridad || "Media", prioridad: form.prioridad,
      estado: form.estado, valorUnitario: Number(form.valorUnitario), cantidad: Number(form.cantidad) || 1,
      total: Number(form.valorUnitario) * (Number(form.cantidad) || 1), observaciones: form.observaciones,
    };
    if (cloudMode) {
      setDoc(doc(db, "solicitudes", record.id), record).catch(() => showToast("Error al guardar en la nube."));
    } else if (editingId) {
      setData((d) => d.map((r) => (r.id === editingId ? record : r)));
    } else {
      setData((d) => [record, ...d]);
    }
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    showToast(editingId ? "Solicitud " + record.id + " actualizada." : "Solicitud " + record.id + " registrada correctamente.");
  };

  const deleteRequest = (id) => {
    if (cloudMode) {
      deleteDoc(doc(db, "solicitudes", id)).catch(() => showToast("Error al eliminar en la nube."));
    } else {
      setData((d) => d.filter((r) => r.id !== id));
    }
  };

  // --- Protección por clave para crear/editar/eliminar ---
  const requestCreate = () => { setAuthModal({ type: "create" }); setAuthPass(""); setAuthError(""); };
  const requestDelete = (id) => { setAuthModal({ type: "delete", id }); setAuthPass(""); setAuthError(""); };
  const requestEdit = (id) => { setAuthModal({ type: "edit", id }); setAuthPass(""); setAuthError(""); };
  const closeAuthModal = () => { setAuthModal(null); setAuthPass(""); setAuthError(""); };

  const confirmAuth = (e) => {
    e.preventDefault();
    if (authPass !== APP_PASSWORD) { setAuthError("Clave incorrecta."); return; }
    if (authModal.type === "create") {
      setEditingId(null);
      setForm(emptyForm);
      setShowForm(true);
    } else if (authModal.type === "delete") {
      deleteRequest(authModal.id);
      showToast("Solicitud eliminada.");
    } else if (authModal.type === "edit") {
      const rec = data.find((r) => r.id === authModal.id);
      if (rec) {
        setForm({
          id: rec.id, fecha: rec.fecha, fechaEntrega: rec.fechaEntrega || "", area: rec.area, servicio: rec.servicio, responsable: rec.responsable,
          equipo: rec.equipo, tipo: rec.tipo, justificacion: rec.justificacion, criticidad: rec.criticidad || rec.prioridad || "Media", prioridad: rec.prioridad,
          estado: rec.estado, valorUnitario: String(rec.valorUnitario), cantidad: String(rec.cantidad),
          observaciones: rec.observaciones || "",
        });
        setEditingId(rec.id);
        setShowForm(true);
      }
    }
    setAuthModal(null); setAuthPass(""); setAuthError("");
  };

  // --- Ordenamiento por columna (clic: ascendente → descendente → sin orden) ---
  const toggleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return { key: null, dir: null };
    });
  };
  const sortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={12} style={{ opacity: 0.4 }} />;
    return sortConfig.dir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  };

  const updateBudget = (area, anio, value) => {
    const presupuesto = Number(value) || 0;
    if (cloudMode) {
      setDoc(doc(db, "presupuesto", presupuestoId(area, anio)), { area, anio, presupuesto }).catch(() => showToast("Error al guardar presupuesto."));
    } else {
      setBudget((b) => b.map((r) => (r.area === area && r.anio === anio ? { ...r, presupuesto } : r)));
    }
  };

  const addArea = () => {
    const name = newArea.trim();
    if (!name) return;
    if (areas.includes(name)) { showToast("Esa área ya existe."); return; }
    if (cloudMode) {
      updateDoc(doc(db, "config", "listas"), { areas: arrayUnion(name) });
      const batch = writeBatch(db);
      YEARS.forEach((y) => batch.set(doc(db, "presupuesto", presupuestoId(name, y)), { area: name, anio: y, presupuesto: 0 }));
      batch.commit();
    } else {
      setAreas((a) => [...a, name]);
      setBudget((b) => [...b, ...YEARS.map((y) => ({ area: name, anio: y, presupuesto: 0 }))]);
    }
    setNewArea("");
    showToast("Área \"" + name + "\" agregada.");
  };
  const removeArea = (name) => {
    if (data.some((r) => r.area === name)) { showToast("No se puede eliminar: hay solicitudes registradas con esa área."); return; }
    if (cloudMode) {
      updateDoc(doc(db, "config", "listas"), { areas: arrayRemove(name) });
      const batch = writeBatch(db);
      YEARS.forEach((y) => batch.delete(doc(db, "presupuesto", name + "_" + y)));
      batch.commit();
    } else {
      setAreas((a) => a.filter((x) => x !== name));
      setBudget((b) => b.filter((r) => r.area !== name));
    }
  };
  const addResponsable = () => {
    const name = newResp.trim();
    if (!name) return;
    if (responsables.includes(name)) { showToast("Ese responsable ya existe."); return; }
    if (cloudMode) {
      updateDoc(doc(db, "config", "listas"), { responsables: arrayUnion(name) });
    } else {
      setResponsables((r) => [...r, name]);
    }
    setNewResp("");
    showToast("Responsable \"" + name + "\" agregado.");
  };
  const removeResponsable = (name) => {
    if (data.some((r) => r.responsable === name)) { showToast("No se puede eliminar: hay solicitudes asignadas a ese responsable."); return; }
    if (cloudMode) {
      updateDoc(doc(db, "config", "listas"), { responsables: arrayRemove(name) });
    } else {
      setResponsables((r) => r.filter((x) => x !== name));
    }
  };

  const kpis = useMemo(() => {
    const total = data.length;
    const invTotal = data.reduce((s, r) => s + r.total, 0);
    const invProm = total ? invTotal / total : 0;
    const nuevos = data.filter((r) => r.tipo === "Nuevo");
    const reposiciones = data.filter((r) => r.tipo === "Reposición");
    const aprobadas = data.filter((r) => r.estado === "Aprobado" || r.estado === "Adquirido");
    const presTotal = budget.reduce((s, b) => s + Number(b.presupuesto || 0), 0);
    const ejecTotal = aprobadas.reduce((s, r) => s + Number(r.total || 0), 0);
    const unidades = data.reduce((s, r) => s + Number(r.cantidad || 0), 0);
    return { total, unidades, invTotal, invProm, nuevosN:nuevos.length, reposicionesN:reposiciones.length,
      nuevosInv:nuevos.reduce((s,r)=>s+Number(r.total||0),0), reposicionesInv:reposiciones.reduce((s,r)=>s+Number(r.total||0),0),
      pctNuevos:total?nuevos.length/total:0, pctAprobadas:total?aprobadas.length/total:0,
      pctPresupuesto:presTotal?ejecTotal/presTotal:0, presTotal, ejecTotal };
  }, [data, budget]);

  const matchesValorRango = (r, rango) => {
    if (rango === "Todos") return true;
    const v = r.valorUnitario;
    if (rango === "bajo") return v < 400;
    if (rango === "medio") return v >= 400 && v <= 2000;
    if (rango === "alto") return v > 2000;
    return true;
  };

  const filtered = useMemo(() => {
    return data.filter((r) =>
      (filters.area === "Todos" || r.area === filters.area) &&
      (filters.estado === "Todos" || r.estado === filters.estado) &&
      (filters.responsable === "Todos" || r.responsable === filters.responsable) &&
      (filters.anio === "Todos" || r.anio === Number(filters.anio)) &&
      matchesValorRango(r, filters.valorRango)
    );
  }, [data, filters]);

  const dbFiltered = useMemo(() => {
    let arr = data.filter((r) =>
      (dbFilterEstado === "Todos" || r.estado === dbFilterEstado) &&
      (r.equipo.toLowerCase().includes(dbSearch.toLowerCase()) ||
        r.id.toLowerCase().includes(dbSearch.toLowerCase()) ||
        (r.servicio || "").toLowerCase().includes(dbSearch.toLowerCase()) ||
        r.responsable.toLowerCase().includes(dbSearch.toLowerCase()))
    );
    if (sortConfig.key) {
      arr = [...arr].sort((a, b) => {
        let va = a[sortConfig.key], vb = b[sortConfig.key];
        if (sortConfig.key === "fecha" || sortConfig.key === "fechaEntrega") {
          va = va ? new Date(va).getTime() : -Infinity;
          vb = vb ? new Date(vb).getTime() : -Infinity;
        }
        else if (typeof va === "string") { va = va.toLowerCase(); vb = vb.toLowerCase(); }
        if (va < vb) return sortConfig.dir === "asc" ? -1 : 1;
        if (va > vb) return sortConfig.dir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return arr;
  }, [data, dbSearch, dbFilterEstado, sortConfig]);

  const byArea = useMemo(() => areas.map((a) => { const rows=data.filter(r=>r.area===a); return {area:a,n:rows.length,unidades:rows.reduce((s,r)=>s+Number(r.cantidad||0),0),inversion:rows.reduce((s,r)=>s+Number(r.total||0),0)}; }).filter(r=>r.n>0).sort((a,b)=>b[areaMetric]-a[areaMetric]), [data,areas,areaMetric]);
  const byEstado = useMemo(() => ESTADOS.map(e=>{const rows=data.filter(r=>r.estado===e);return {estado:e,n:rows.length,unidades:rows.reduce((s,r)=>s+Number(r.cantidad||0),0),inversion:rows.reduce((s,r)=>s+Number(r.total||0),0)};}),[data]);
  const byTipo = useMemo(() => TIPOS.map(t=>{const rows=data.filter(r=>r.tipo===t);return {tipo:t,n:rows.length,unidades:rows.reduce((s,r)=>s+Number(r.cantidad||0),0),inversion:rows.reduce((s,r)=>s+Number(r.total||0),0)};}),[data]);
  const byCriticidad = useMemo(() => CRITICIDADES.map(c=>{const rows=data.filter(r=>(r.criticidad||r.prioridad||"Media")===c);return {criticidad:c,n:rows.length,unidades:rows.reduce((s,r)=>s+Number(r.cantidad||0),0),inversion:rows.reduce((s,r)=>s+Number(r.total||0),0)};}).filter(r=>r.n>0),[data]);

  const byResponsable = useMemo(() => responsables.map((p) => ({
    responsable: p, n: data.filter((r) => r.responsable === p).length,
    inversion: data.filter((r) => r.responsable === p).reduce((s, r) => s + r.total, 0),
  })).sort((a, b) => b.inversion - a.inversion), [data, responsables]);

  const byYear = useMemo(() => YEARS.map((y) => ({
    anio: String(y), n: data.filter((r) => r.anio === y).length,
    inversion: data.filter((r) => r.anio === y).reduce((s, r) => s + r.total, 0),
  })), [data]);

  const budgetByArea = useMemo(() => areas.map((a) => {
    const presupuesto = budget.filter((b) => b.area === a).reduce((s, b) => s + b.presupuesto, 0);
    const ejecutado = data.filter((r) => r.area === a && (r.estado === "Aprobado" || r.estado === "Adquirido")).reduce((s, r) => s + r.total, 0);
    return { area: a, presupuesto, ejecutado, pct: presupuesto ? ejecutado / presupuesto : 0 };
  }), [data, budget, areas]);

  const areaEstadoMatrix = useMemo(() => areas.map((a) => {
    const row = { area: a };
    ESTADOS.forEach((e) => { row[e] = data.filter((r) => r.area === a && r.estado === e).length; });
    return row;
  }), [data, areas]);

  const NAV_ITEMS = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "database", label: "Base de Datos", icon: Database },
    { id: "budget", label: "Presupuesto", icon: Wallet },
    { id: "pivots", label: "Resumen y Pivotes", icon: Table2 },
    { id: "config", label: "Configuración", icon: Settings },
    { id: "guide", label: "Guía de Uso", icon: BookOpen },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: BG, minHeight: "100vh", color: INK, display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .disp { font-family: 'Space Grotesk', sans-serif; }
        .mono { font-family: 'IBM Plex Mono', monospace; }
        .navitem { display:flex; align-items:center; gap:10px; padding:11px 16px; border-radius:8px; cursor:pointer;
          color:#AEC3D1; font-size:13.5px; font-weight:500; transition:all .15s ease; border-left:3px solid transparent; }
        .navitem:hover { background:rgba(255,255,255,0.06); color:#fff; }
        .navitem.active { background:rgba(18,165,148,0.14); color:#fff; border-left:3px solid ${TEAL}; }
        .card { background:${CARD}; border:1px solid ${BORDER}; border-radius:12px; }
        .btn-primary { background:${INK}; color:#fff; border:none; border-radius:8px; padding:9px 16px; font-size:13.5px;
          font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:7px; transition:background .15s; }
        .btn-primary:hover { background:${INK_2}; }
        .btn-ghost { background:transparent; color:${SLATE}; border:1px solid ${BORDER}; border-radius:8px; padding:8px 14px;
          font-size:13px; font-weight:500; cursor:pointer; display:inline-flex; align-items:center; gap:6px; }
        .btn-ghost:hover { background:#F3F6F7; }
        .sel { border:1px solid ${BORDER}; border-radius:8px; padding:8px 10px; font-size:13px; font-family:'Inter',sans-serif;
          background:#fff; color:${INK}; cursor:pointer; }
        .inp { border:1px solid ${BORDER}; border-radius:8px; padding:8px 10px; font-size:13px; font-family:'Inter',sans-serif;
          background:#fff; color:${INK}; width:100%; }
        .inp:focus, .sel:focus { outline:2px solid ${TEAL}; outline-offset:1px; }
        .badge { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:20px; font-size:11.5px; font-weight:600; white-space:nowrap; }
        .th { text-align:left; font-size:10.5px; text-transform:uppercase; letter-spacing:0.04em; color:${SLATE_LIGHT}; font-weight:700; padding:10px 12px; border-bottom:1px solid ${BORDER}; }
        .td { padding:11px 12px; font-size:13px; color:${INK}; border-bottom:1px solid #EEF2F4; }
        .sortbtn { background:none; border:none; cursor:pointer; display:inline-flex; align-items:center; gap:4px;
          font-size:10.5px; text-transform:uppercase; letter-spacing:0.04em; color:${SLATE_LIGHT}; font-weight:700; padding:0; }
        .sortbtn:hover { color:${INK}; }
        .expand-cell { width:210px; max-width:210px; }
        .expand-text { display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden;
          padding:11px 12px; line-height:1.45; font-size:12.5px; color:${SLATE}; cursor:default; border-radius:6px; }
        .expand-cell:hover .expand-text { -webkit-line-clamp:unset; display:block; background:#FFF7DE; color:${INK}; position:relative; }
        tr.datarow:hover { background:#FAFBFC; }
        .pulse-dot { width:7px; height:7px; border-radius:50%; background:${TEAL}; box-shadow:0 0 0 0 rgba(18,165,148,0.6); animation:pulse 2s infinite; }
        @keyframes pulse { 0% { box-shadow:0 0 0 0 rgba(18,165,148,0.5);} 70% { box-shadow:0 0 0 6px rgba(18,165,148,0);} 100% { box-shadow:0 0 0 0 rgba(18,165,148,0);} }
        ::-webkit-scrollbar { height:8px; width:8px; }
        ::-webkit-scrollbar-thumb { background:#CBD5DB; border-radius:8px; }
      `}</style>

      {/* SIDEBAR */}
      <aside style={{ width: 216, background: INK, minHeight: "100vh", padding: "22px 12px", position: "sticky", top: 0, flexShrink: 0 }}>
        <div style={{ padding: "4px 10px 22px 10px" }}>
          <div className="disp" style={{ color: "#fff", fontSize: 15, fontWeight: 700, letterSpacing: "0.01em" }}>INGENIERÍA CLÍNICA</div>
          <div style={{ color: "#7FA8B8", fontSize: 11, marginTop: 2 }}>Gestión de Adquisiciones</div>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className={"navitem" + (tab === item.id ? " active" : "")} onClick={() => setTab(item.id)}>
                <Icon size={16} strokeWidth={2} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>
        <div style={{ marginTop: 30, padding: "14px 12px", background: "rgba(255,255,255,0.05)", borderRadius: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
            {cloudMode
              ? <span className="pulse-dot"></span>
              : <AlertTriangle size={12} color={AMBER} />}
            <span style={{ color: "#fff", fontSize: 11.5, fontWeight: 600 }}>
              {cloudMode ? "Conectado a Firebase" : "Modo local (sin compartir)"}
            </span>
          </div>
          <div style={{ color: "#7FA8B8", fontSize: 10.5, lineHeight: 1.5 }}>
            {cloudMode
              ? "Los datos se sincronizan en tiempo real para todos los usuarios."
              : "Guardando solo en este navegador. Configura Firebase para compartir los datos (ver pestaña Guía de Uso)."}
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, minWidth: 0, padding: "26px 32px 60px 32px" }}>
        {cloudMode && !cloudReady ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 12 }}>
            <Cloud size={28} color={TEAL} />
            <div style={{ fontSize: 13.5, color: SLATE }}>Conectando con Firebase...</div>
          </div>
        ) : (
        <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
          <div>
            <h1 className="disp" style={{ fontSize: 23, fontWeight: 700, margin: 0, color: INK }}>
              {tab === "dashboard" && "Dashboard de Gestión"}
              {tab === "database" && "Base de Datos de Solicitudes"}
              {tab === "budget" && "Presupuesto por Área"}
              {tab === "pivots" && "Resumen y Tablas Dinámicas"}
              {tab === "config" && "Configuración de Áreas y Responsables"}
              {tab === "guide" && "Guía de Uso"}
            </h1>
            <p style={{ fontSize: 13, color: SLATE_LIGHT, margin: "4px 0 0 0" }}>
              Adquisición de equipos médicos · Hospital · Seguimiento gerencial
            </p>
          </div>
          {(tab === "dashboard" || tab === "database") && (
            <button className="btn-primary" onClick={requestCreate}>
              <Plus size={15} /> Nueva solicitud
            </button>
          )}
        </div>

        {tab === "dashboard" && (
          <div>
            {/* KPI ROW · enfoque administrativo */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(6,minmax(0,1fr))",gap:12,marginBottom:14}}>{[
              ["SOLICITUDES",kpis.total,(v)=>v.toLocaleString("es-EC"),Package,INK],["INVERSIÓN TOTAL",kpis.invTotal,fmtUSDk,Wallet,TEAL_DARK],["UNIDADES",kpis.unidades,(v)=>v.toLocaleString("es-EC"),Activity,"#3D8BD4"],["INVERSIÓN NUEVOS",kpis.nuevosInv,fmtUSDk,TrendingUp,TEAL],["INVERSIÓN REPOSICIÓN",kpis.reposicionesInv,fmtUSDk,ClipboardCheck,AMBER],["EJECUTADO / PRESUP.",kpis.pctPresupuesto,fmtPct,CheckCircle2,kpis.pctPresupuesto>1?CORAL:kpis.pctPresupuesto>=.8?AMBER:TEAL]
            ].map(([label,value,fmt,Icon,accent],i)=><div key={i} className="card" style={{padding:"13px 15px",borderTop:"3px solid "+accent}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:9.5,fontWeight:700,color:SLATE_LIGHT}}>{label}</span><Icon size={14} color={accent}/></div><div className="mono" style={{fontSize:21,fontWeight:600,marginTop:8}}>{fmt(value)}</div></div>)}</div>
            <div style={{display:"flex",gap:10,marginBottom:18,alignItems:"center"}}><div className="card" style={{padding:"9px 13px",flex:1,display:"flex",justifyContent:"space-between"}}><span style={{fontSize:12,color:SLATE_LIGHT}}>Composición de la inversión</span><span style={{fontSize:12.5}}><b style={{color:TEAL_DARK}}>Nuevos {fmtUSD(kpis.nuevosInv)}</b> · <b style={{color:"#B45A0F"}}>Reposición {fmtUSD(kpis.reposicionesInv)}</b></span></div><div className="card" style={{padding:"9px 13px",minWidth:250,textAlign:"right"}}><span style={{fontSize:11,color:SLATE_LIGHT}}>Presupuesto total</span> <b className="mono">{fmtUSD(kpis.presTotal)}</b></div></div>
            {/* FILTERS */}
            <div className="card" style={{ padding: "14px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: SLATE, fontSize: 12.5, fontWeight: 600 }}>
                <SlidersHorizontal size={14} /> Filtros
              </div>
              {[
                { key: "area", label: "Área", opts: areas },
                { key: "estado", label: "Estado", opts: ESTADOS },
                { key: "responsable", label: "Responsable", opts: responsables },
                { key: "anio", label: "Año", opts: YEARS },
              ].map((f) => (
                <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, color: SLATE_LIGHT }}>{f.label}</span>
                  <select className="sel" value={filters[f.key]} onChange={(e) => setFilters((s) => ({ ...s, [f.key]: e.target.value }))}>
                    <option>Todos</option>
                    {f.opts.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: SLATE_LIGHT }}>Valor de compra</span>
                <select className="sel" value={filters.valorRango} onChange={(e) => setFilters((s) => ({ ...s, valorRango: e.target.value }))}>
                  <option value="Todos">Todos</option>
                  <option value="bajo">Bajo ($0 – $400)</option>
                  <option value="medio">Medio ($400 – $2,000)</option>
                  <option value="alto">Alto (más de $2,000)</option>
                </select>
              </div>
              {(filters.area !== "Todos" || filters.estado !== "Todos" || filters.responsable !== "Todos" || filters.anio !== "Todos" || filters.valorRango !== "Todos") && (
                <button className="btn-ghost" onClick={() => setFilters({ area: "Todos", estado: "Todos", responsable: "Todos", anio: "Todos", valorRango: "Todos" })}>
                  <X size={13} /> Limpiar
                </button>
              )}
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 18, fontSize: 12.5 }}>
                <span style={{ color: SLATE_LIGHT }}>Resultado: <b className="mono" style={{ color: INK }}>{filtered.length}</b> solicitudes</span>
                <span style={{ color: SLATE_LIGHT }}>Inversión: <b className="mono" style={{ color: INK }}>{fmtUSD(filtered.reduce((s, r) => s + r.total, 0))}</b></span>
                <button className="btn-ghost" onClick={() => setShowFilteredList((v) => !v)}>
                  {showFilteredList ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {showFilteredList ? "Ocultar solicitudes" : "Ver solicitudes"}
                </button>
              </div>
            </div>

            {/* LISTA DESPLEGABLE DE SOLICITUDES FILTRADAS */}
            {showFilteredList && (
            <div className="card" style={{ marginBottom: 18, overflow: "hidden" }}>
              {filtered.length === 0 ? (
                <div
                  style={{
                    padding: "20px 18px",
                    fontSize: 13,
                    color: SLATE_LIGHT,
                    textAlign: "center",
                  }}
                >
                  Ninguna solicitud coincide con los filtros seleccionados.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      minWidth: 900,
                      tableLayout: "fixed",
                    }}
                  >
                    <thead>
                      <tr style={{ background: "#FAFBFC" }}>
                        {[
                          ["ID", 90],
                          ["Fecha Sol.", 90],
                          ["Área", 110],
                          ["Responsable", 140],
                          ["Equipo Médico", 180],
                          ["Estado", 120],
                          ["Cant.", 60],
                          ["Inversión", 100],
                        ].map(([h, width]) => (
                          <th
                            key={h}
                            className="th"
                            style={{
                              width,
                              padding: "8px 6px",
                              whiteSpace: "nowrap",
                              fontSize: 11,
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {[...filtered]
                      .sort((a, b) => {
                        const numA = parseInt(a.id.split("-").pop(), 10);
                        const numB = parseInt(b.id.split("-").pop(), 10);
                        return numB - numA;
                      })
                      .map((r) => (
                        <tr key={r.id} className="datarow">
                          <td
                            className="td mono"
                            style={{
                              fontSize: 11.5,
                              color: SLATE,
                              padding: "7px 6px",
                            }}
                          >
                            {r.id}
                          </td>

                          <td className="td" style={{ padding: "7px 6px" }}>
                            {new Date(r.fecha + "T00:00:00").toLocaleDateString("es-EC")}
                          </td>

                          <td
                            className="td"
                            style={{
                              padding: "7px 6px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {r.area}
                          </td>

                          <td
                            className="td"
                            style={{
                              padding: "7px 6px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {r.responsable}
                          </td>

                          <td
                            className="td"
                            style={{
                              padding: "7px 6px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={r.equipo}
                          >
                            {r.equipo}
                          </td>

                          <td className="td" style={{ padding: "7px 6px" }}>
                            <span
                              className="badge"
                              style={{
                                background: STATUS_STYLE[r.estado].bg,
                                color: STATUS_STYLE[r.estado].text,
                              }}
                            >
                              <span
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  background: STATUS_STYLE[r.estado].dot,
                                }}
                              />
                              {r.estado}
                            </span>
                          </td>

                          <td
                            className="td mono"
                            style={{
                              padding: "7px 6px",
                              textAlign: "left",
                            }}
                          >
                            {r.cantidad}
                          </td>

                          <td
                            className="td mono"
                            style={{
                              padding: "7px 6px",
                              fontWeight: 700,
                              textAlign: "right",
                            }}
                          >
                            {fmtUSD(r.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
            {/* CHARTS GRID · vista ejecutiva */}
            <div style={{display:"grid",gridTemplateColumns:"1.25fr .9fr",gap:16}}>
              <div className="card" style={{padding:"16px 18px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div><div className="disp" style={{fontSize:13.5,fontWeight:700}}>Adquisiciones por área</div><div style={{fontSize:11,color:SLATE_LIGHT}}>Ordenar por solicitudes o por valor</div></div><div style={{display:"flex",gap:5}}>{[["n","Solicitudes"],["inversion","Valor"]].map(([k,l])=><button key={k} className="btn-ghost" onClick={()=>setAreaMetric(k)} style={{padding:"5px 9px",fontSize:11,background:areaMetric===k?INK:"#fff",color:areaMetric===k?"#fff":SLATE}}>{l}</button>)}</div></div><ResponsiveContainer width="100%" height={290}><BarChart data={byArea} layout="vertical" margin={{left:10,right:28}}><CartesianGrid strokeDasharray="3 3" stroke={BORDER} horizontal={false}/><XAxis type="number" tickFormatter={areaMetric==="inversion"?fmtUSDk:undefined} tick={{fontSize:11,fill:SLATE_LIGHT}}/><YAxis type="category" dataKey="area" width={115} tick={{fontSize:10.5,fill:SLATE}}/><Tooltip formatter={(v,n,p)=>areaMetric==="inversion"?[fmtUSD(v),"Inversión"]:[v+" solicitudes","Solicitudes"]} contentStyle={{fontSize:12,borderRadius:8}}/><Bar dataKey={areaMetric} fill={TEAL} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer></div>
              <div className="card" style={{padding:"16px 18px"}}><div className="disp" style={{fontSize:13.5,fontWeight:700}}>Distribución por estado</div><div style={{fontSize:11,color:SLATE_LIGHT}}>Cantidad e inversión por estado</div><ResponsiveContainer width="100%" height={290}><PieChart><Pie data={byEstado.filter(e=>e.n>0)} dataKey="n" nameKey="estado" cx="50%" cy="47%" innerRadius={55} outerRadius={91} paddingAngle={2}>{byEstado.filter(e=>e.n>0).map((e,i)=><Cell key={i} fill={STATUS_STYLE[e.estado].dot}/>)}</Pie><Tooltip formatter={(v,n,p)=>[`${v} solicitudes · ${fmtUSD(p.payload.inversion)}`,p.payload.estado]} contentStyle={{fontSize:12,borderRadius:8}}/><Legend iconType="circle" wrapperStyle={{fontSize:11}}/></PieChart></ResponsiveContainer></div>
              <div className="card" style={{padding:"16px 18px"}}><div className="disp" style={{fontSize:13.5,fontWeight:700}}>Nuevo vs. Reposición</div><div style={{fontSize:11,color:SLATE_LIGHT}}>Inversión y volumen de solicitudes</div><ResponsiveContainer width="100%" height={250}><BarChart data={byTipo} margin={{top:15,right:18,left:4}}><CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false}/><XAxis dataKey="tipo" tick={{fontSize:11,fill:SLATE}}/><YAxis tickFormatter={fmtUSDk} tick={{fontSize:11,fill:SLATE_LIGHT}}/><Tooltip formatter={(v,n,p)=>[fmtUSD(v),`Inversión · ${p.payload.n} solicitudes · ${p.payload.unidades} unidades`]} contentStyle={{fontSize:12,borderRadius:8}}/><Bar dataKey="inversion" radius={[5,5,0,0]}><Cell fill={TEAL}/><Cell fill={AMBER}/></Bar></BarChart></ResponsiveContainer></div>
              <div className="card" style={{padding:"16px 18px"}}><div className="disp" style={{fontSize:13.5,fontWeight:700}}>Adquisiciones por criticidad</div><div style={{fontSize:11,color:SLATE_LIGHT}}>Cantidad, unidades e inversión al pasar el cursor</div><ResponsiveContainer width="100%" height={250}><PieChart><Pie data={byCriticidad} dataKey="n" nameKey="criticidad" cx="50%" cy="47%" innerRadius={48} outerRadius={86} paddingAngle={2}>{byCriticidad.map((e,i)=><Cell key={i} fill={CRITICIDAD_STYLE[e.criticidad].dot}/>)}</Pie><Tooltip formatter={(v,n,p)=>[`${v} solicitudes · ${p.payload.unidades} unidades · ${fmtUSD(p.payload.inversion)}`,p.payload.criticidad]} contentStyle={{fontSize:12,borderRadius:8}}/><Legend iconType="circle" wrapperStyle={{fontSize:11}}/></PieChart></ResponsiveContainer></div>
              <div className="card" style={{padding:"16px 18px"}}><div className="disp" style={{fontSize:13.5,fontWeight:700}}>Presupuesto vs. ejecutado</div><ResponsiveContainer width="100%" height={250}><BarChart data={budgetByArea.filter(x=>x.presupuesto>0||x.ejecutado>0)} margin={{top:10}}><CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false}/><XAxis dataKey="area" tick={{fontSize:9.5,fill:SLATE_LIGHT}} angle={-30} textAnchor="end" height={70} interval={0}/><YAxis tickFormatter={fmtUSDk} tick={{fontSize:11,fill:SLATE_LIGHT}}/><Tooltip formatter={(v,n)=>[fmtUSD(v),n]} contentStyle={{fontSize:12,borderRadius:8}}/><Legend wrapperStyle={{fontSize:11}}/><Bar dataKey="presupuesto" name="Presupuesto" fill="#B9CBD6" radius={[3,3,0,0]}/><Bar dataKey="ejecutado" name="Ejecutado" fill={TEAL} radius={[3,3,0,0]}/></BarChart></ResponsiveContainer></div>
              <div className="card" style={{padding:"16px 18px"}}><div className="disp" style={{fontSize:13.5,fontWeight:700}}>Responsables por inversión</div><div style={{fontSize:11,color:SLATE_LIGHT}}>Top 8</div><ResponsiveContainer width="100%" height={250}><BarChart data={byResponsable.slice(0,8)} layout="vertical" margin={{left:8,right:22}}><CartesianGrid strokeDasharray="3 3" stroke={BORDER} horizontal={false}/><XAxis type="number" tickFormatter={fmtUSDk} tick={{fontSize:11,fill:SLATE_LIGHT}}/><YAxis type="category" dataKey="responsable" width={105} tick={{fontSize:9.5,fill:SLATE}}/><Tooltip formatter={(v,n,p)=>[fmtUSD(v),`${p.payload.n} solicitudes`]} contentStyle={{fontSize:12,borderRadius:8}}/><Bar dataKey="inversion" fill={INK} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer></div>
            </div>
            <div className="card" style={{marginTop:16,padding:"14px 18px",display:"flex",gap:24,alignItems:"center",flexWrap:"wrap"}}><div><div style={{fontSize:10,color:SLATE_LIGHT,fontWeight:700}}>APROBADAS / ADQUIRIDAS</div><div className="mono" style={{fontSize:18,fontWeight:700}}>{fmtUSD(kpis.ejecTotal)}</div></div><div><div style={{fontSize:10,color:SLATE_LIGHT,fontWeight:700}}>PENDIENTE + REVISIÓN</div><div className="mono" style={{fontSize:18,fontWeight:700}}>{fmtUSD(byEstado.filter(e=>e.estado==="Pendiente"||e.estado==="En Revisión").reduce((s,e)=>s+e.inversion,0))}</div></div><div><div style={{fontSize:10,color:SLATE_LIGHT,fontWeight:700}}>CRITICIDAD CRÍTICA</div><div className="mono" style={{fontSize:18,fontWeight:700,color:CORAL}}>{byCriticidad.find(e=>e.criticidad==="Crítica")?.n||0} solicitudes</div></div><div style={{marginLeft:"auto",fontSize:11.5,color:SLATE_LIGHT,maxWidth:420}}>Vista ejecutiva para comité administrativo: inversión, ejecución, composición de la compra y riesgo clínico.</div></div>
          </div>
        )}

        {tab === "database" && (
          <div>
            <div className="card" style={{ padding: "12px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
                <Search size={14} color={SLATE_LIGHT} style={{ position: "absolute", left: 10, top: 10 }} />
                <input className="inp" style={{ paddingLeft: 30 }} placeholder="Buscar por equipo, servicio, ID o responsable..."
                  value={dbSearch} onChange={(e) => setDbSearch(e.target.value)} />
              </div>
              <select className="sel" value={dbFilterEstado} onChange={(e) => setDbFilterEstado(e.target.value)}>
                <option>Todos</option>
                {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
              <span style={{ marginLeft: "auto", fontSize: 12.5, color: SLATE_LIGHT }}>{dbFiltered.length} registros</span>
              <button className="btn-ghost" onClick={() => { downloadXML(data); showToast("XML generado con toda la base de datos."); }}><FileDown size={14} /> Descargar XML</button>
            </div>

            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1820 }}>
                  <thead>
                    <tr style={{ background: "#FAFBFC" }}>
                      <th className="th">
                        <button type="button" className="sortbtn" onClick={() => toggleSort("id")}>ID {sortIcon("id")}</button>
                      </th>
                      <th className="th">
                        <button type="button" className="sortbtn" onClick={() => toggleSort("fecha")}>Fecha Sol. {sortIcon("fecha")}</button>
                      </th>
                      <th className="th">
                        <button type="button" className="sortbtn" onClick={() => toggleSort("fechaEntrega")}>Fecha Entrega {sortIcon("fechaEntrega")}</button>
                      </th>
                      <th className="th">Área</th>
                      <th className="th">Servicio</th>
                      <th className="th">Responsable</th>
                      <th className="th">Equipo Médico</th>
                      <th className="th">Tipo</th>
                      <th className="th">Prioridad</th>
                      <th className="th">Estado</th>
                      <th className="th"><button type="button" className="sortbtn" onClick={() => toggleSort("valorUnitario")}>V. Unitario {sortIcon("valorUnitario")}</button></th>
                      <th className="th"><button type="button" className="sortbtn" onClick={() => toggleSort("cantidad")}>Cant. {sortIcon("cantidad")}</button></th>
                      <th className="th"><button type="button" className="sortbtn" onClick={() => toggleSort("total")}>Inversión {sortIcon("total")}</button></th>
                      <th className="th">Justificación</th>
                      <th className="th">Observaciones</th>
                      <th className="th"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbFiltered.map((r) => (
                      <tr key={r.id} className="datarow">
                        <td className="td mono" style={{ fontSize: 11.5, color: SLATE }}>{r.id}</td>
                        <td className="td">{new Date(r.fecha + "T00:00:00").toLocaleDateString("es-EC")}</td>
                        <td className="td">{r.fechaEntrega ? new Date(r.fechaEntrega + "T00:00:00").toLocaleDateString("es-EC") : <span style={{ color: "#D8DFE4" }}>—</span>}</td>
                        <td className="td">{r.area}</td>
                        <td className="td">{r.servicio}</td>
                        <td className="td">{r.responsable}</td>
                        <td className="td" style={{ maxWidth: 200 }}>{r.equipo}</td>
                        <td className="td"><span className="badge" style={{ background: TIPO_STYLE[r.tipo].bg, color: TIPO_STYLE[r.tipo].text }}>{r.tipo}</span></td>
                        <td className="td"><span className="badge" style={{ background: PRIORITY_STYLE[r.prioridad].bg, color: PRIORITY_STYLE[r.prioridad].text }}>{r.prioridad}</span></td>
                        <td className="td">
                          <span className="badge" style={{ background: STATUS_STYLE[r.estado].bg, color: STATUS_STYLE[r.estado].text }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_STYLE[r.estado].dot }}></span>
                            {r.estado}
                          </span>
                        </td>
                        <td className="td mono">{fmtUSD(r.valorUnitario)}</td>
                        <td className="td mono">{r.cantidad}</td>
                        <td className="td mono" style={{ fontWeight: 700 }}>{fmtUSD(r.total)}</td>
                        <td className="td" style={{ position: "relative", padding: 0 }}>
                          <div className="expand-cell">
                            <div className="expand-text">{r.justificacion}</div>
                          </div>
                        </td>
                        <td className="td" style={{ position: "relative", padding: 0 }}>
                          <div className="expand-cell">
                            <div className="expand-text">{r.observaciones ? r.observaciones : "—"}</div>
                          </div>
                        </td>
                        <td className="td">
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <button onClick={() => requestEdit(r.id)} title="Editar (requiere clave)" style={{ background: "none", border: "none", cursor: "pointer", color: SLATE_LIGHT }}>
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => requestDelete(r.id)} title="Eliminar (requiere clave)" style={{ background: "none", border: "none", cursor: "pointer", color: SLATE_LIGHT }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === "budget" && (
          <div>
            <div className="card" style={{ padding: "16px 18px", marginBottom: 16 }}>
              <div className="disp" style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 10 }}>Presupuesto asignado vs. ejecutado (total por área)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={budgetByArea} margin={{ top: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
                  <XAxis dataKey="area" tick={{ fontSize: 10, fill: SLATE_LIGHT }} angle={-25} textAnchor="end" height={70} interval={0} />
                  <YAxis tickFormatter={fmtUSDk} tick={{ fontSize: 11, fill: SLATE_LIGHT }} />
                  <Tooltip formatter={(v) => fmtUSD(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="presupuesto" name="Presupuesto" fill="#B9CBD6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="ejecutado" name="Ejecutado" fill={TEAL} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{ padding: "14px 18px 4px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="disp" style={{ fontSize: 13.5, fontWeight: 700 }}>Detalle por área y año (editable)</div>
                <span style={{ fontSize: 11.5, color: SLATE_LIGHT }}>Haz clic en el presupuesto para editarlo</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#FAFBFC" }}>
                    {["Área", "Año", "Presupuesto Asignado", "Inversión Ejecutada", "% Ejecutado", "Estado"].map((h) => (
                      <th key={h} className="th">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {budget.map((b) => {
                    const ejecutado = data
                      .filter((r) => r.area === b.area && r.anio === b.anio && (r.estado === "Aprobado" || r.estado === "Adquirido"))
                      .reduce((s, r) => s + r.total, 0);
                    const pct = b.presupuesto ? ejecutado / b.presupuesto : 0;
                    const status = pct > 1 ? { t: "Sobre presupuesto", c: CORAL } : pct >= 0.8 ? { t: "Alerta", c: AMBER } : { t: "Saludable", c: TEAL };
                    return (
                      <tr key={b.area + b.anio} className="datarow">
                        <td className="td">{b.area}</td>
                        <td className="td mono">{b.anio}</td>
                        <td className="td">
                          <input type="number" className="inp" style={{ width: 120, padding: "5px 8px" }} value={b.presupuesto}
                            onChange={(e) => updateBudget(b.area, b.anio, e.target.value)} />
                        </td>
                        <td className="td mono">{fmtUSD(ejecutado)}</td>
                        <td className="td mono" style={{ fontWeight: 700, color: status.c }}>{fmtPct(pct)}</td>
                        <td className="td"><span className="badge" style={{ background: status.c + "22", color: status.c }}>{status.t}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "pivots" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="card" style={{ padding: "16px 18px" }}>
              <div className="disp" style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Pivote 1 · Solicitudes e inversión por área</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["Área", "N°", "Inversión", "% del total"].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
                <tbody>
                  {byArea.map((r) => (
                    <tr key={r.area} className="datarow">
                      <td className="td">{r.area}</td>
                      <td className="td mono">{r.n}</td>
                      <td className="td mono">{fmtUSD(r.inversion)}</td>
                      <td className="td mono">{fmtPct(kpis.invTotal ? r.inversion / kpis.invTotal : 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card" style={{ padding: "16px 18px" }}>
              <div className="disp" style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Pivote 2 · Solicitudes por estado</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["Estado", "N°", "Inversión"].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
                <tbody>
                  {byEstado.map((r) => (
                    <tr key={r.estado} className="datarow">
                      <td className="td"><span className="badge" style={{ background: STATUS_STYLE[r.estado].bg, color: STATUS_STYLE[r.estado].text }}>{r.estado}</span></td>
                      <td className="td mono">{r.n}</td>
                      <td className="td mono">{fmtUSD(r.inversion)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card" style={{ padding: "16px 18px" }}>
              <div className="disp" style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Pivote 3 · Solicitudes e inversión por responsable</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["Responsable", "N°", "Inversión"].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
                <tbody>
                  {byResponsable.map((r) => (
                    <tr key={r.responsable} className="datarow">
                      <td className="td">{r.responsable}</td>
                      <td className="td mono">{r.n}</td>
                      <td className="td mono">{fmtUSD(r.inversion)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card" style={{ padding: "16px 18px" }}>
              <div className="disp" style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Pivote 4 · Nuevo vs. Reposición / por año</div>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14 }}>
                <thead><tr>{["Tipo", "N°", "Inversión"].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
                <tbody>
                  {byTipo.map((r) => (
                    <tr key={r.tipo} className="datarow">
                      <td className="td"><span className="badge" style={{ background: TIPO_STYLE[r.tipo].bg, color: TIPO_STYLE[r.tipo].text }}>{r.tipo}</span></td>
                      <td className="td mono">{r.n}</td>
                      <td className="td mono">{fmtUSD(r.inversion)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["Año", "N°", "Inversión"].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
                <tbody>
                  {byYear.map((r) => (
                    <tr key={r.anio} className="datarow">
                      <td className="td mono">{r.anio}</td>
                      <td className="td mono">{r.n}</td>
                      <td className="td mono">{fmtUSD(r.inversion)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card" style={{ padding: "16px 18px", gridColumn: "1 / -1" }}>
              <div className="disp" style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Pivote 5 · Matriz Área × Estado (N° de solicitudes)</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                  <thead>
                    <tr>
                      <th className="th">Área</th>
                      {ESTADOS.map((e) => <th key={e} className="th" style={{ textAlign: "center" }}>{e}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {areaEstadoMatrix.map((row) => (
                      <tr key={row.area} className="datarow">
                        <td className="td">{row.area}</td>
                        {ESTADOS.map((e) => (
                          <td key={e} className="td mono" style={{ textAlign: "center" }}>
                            {row[e] > 0
                              ? <span className="badge" style={{ background: STATUS_STYLE[e].bg, color: STATUS_STYLE[e].text }}>{row[e]}</span>
                              : <span style={{ color: "#D8DFE4" }}>—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === "config" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 900 }}>
            <div className="card" style={{ padding: "18px 20px" }}>
              <div className="disp" style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Áreas del hospital</div>
              <p style={{ fontSize: 12, color: SLATE_LIGHT, margin: "0 0 14px 0" }}>
                Estas áreas aparecen en los filtros, el formulario de nueva solicitud y el presupuesto.
              </p>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <input className="inp" placeholder="Ej. Neurología" value={newArea} onChange={(e) => setNewArea(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addArea(); } }} />
                <button type="button" className="btn-primary" onClick={addArea}><Plus size={14} /> Agregar</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 360, overflowY: "auto" }}>
                {areas.map((a) => {
                  const enUso = data.some((r) => r.area === a);
                  return (
                    <div key={a} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#FAFBFC", borderRadius: 8, border: "1px solid " + BORDER }}>
                      <span style={{ fontSize: 13, color: INK }}>{a}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {enUso && <span style={{ fontSize: 10.5, color: SLATE_LIGHT }}>en uso</span>}
                        <button type="button" onClick={() => removeArea(a)} title={enUso ? "No se puede eliminar: en uso" : "Eliminar"}
                          style={{ background: "none", border: "none", cursor: enUso ? "not-allowed" : "pointer", color: enUso ? "#D8DFE4" : CORAL }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card" style={{ padding: "18px 20px" }}>
              <div className="disp" style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Personal responsable</div>
              <p style={{ fontSize: 12, color: SLATE_LIGHT, margin: "0 0 14px 0" }}>
                Ingenieros / personal a cargo del seguimiento de cada solicitud.
              </p>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <input className="inp" placeholder="Ej. Sofía Ramírez" value={newResp} onChange={(e) => setNewResp(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addResponsable(); } }} />
                <button type="button" className="btn-primary" onClick={addResponsable}><Plus size={14} /> Agregar</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 360, overflowY: "auto" }}>
                {responsables.map((p) => {
                  const enUso = data.some((r) => r.responsable === p);
                  return (
                    <div key={p} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#FAFBFC", borderRadius: 8, border: "1px solid " + BORDER }}>
                      <span style={{ fontSize: 13, color: INK }}>{p}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {enUso && <span style={{ fontSize: 10.5, color: SLATE_LIGHT }}>en uso</span>}
                        <button type="button" onClick={() => removeResponsable(p)} title={enUso ? "No se puede eliminar: en uso" : "Eliminar"}
                          style={{ background: "none", border: "none", cursor: enUso ? "not-allowed" : "pointer", color: enUso ? "#D8DFE4" : CORAL }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card" style={{ padding: "14px 18px", gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 10, background: "#EAF6F4", border: "1px solid #CFEDE7" }}>
              <Save size={16} color={TEAL_DARK} />
              <span style={{ fontSize: 12.5, color: TEAL_DARK }}>
                Todo se guarda automáticamente en este navegador. No necesitas hacer nada más para conservar los cambios.
              </span>
            </div>
          </div>
        )}

        {tab === "guide" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 1100 }}>
            {[
              { t: "1. Estructura del panel", icon: LayoutDashboard, items: [
                "Dashboard: KPIs gerenciales, filtros interactivos y gráficos dinámicos.",
                "Base de Datos: registro completo de solicitudes, editable y descargable en XML.",
                "Presupuesto: presupuesto por área y año con ejecución automática.",
                "Resumen y Pivotes: tablas cruzadas equivalentes a tablas dinámicas de Excel.",
              ]},
              { t: "2. Cómo agregar una solicitud", icon: Plus, items: [
                "Haz clic en 'Nueva solicitud' desde el Dashboard o la Base de Datos.",
                "Completa los campos: equipo, área, responsable, tipo, criticidad, prioridad, estado y valores.",
                "La inversión total se calcula automáticamente (valor unitario × cantidad).",
                "Hay dos fechas: 'Fecha de solicitud' (cuándo se registró) y 'Fecha de entrega / actualización de estado' (cuándo se entregó el equipo o cambió su estado). Esta segunda es opcional.",
                "Al guardar, todos los KPIs, gráficos y pivotes se actualizan al instante.",
              ]},
              { t: "3. Uso de filtros", icon: SlidersHorizontal, items: [
                "En el Dashboard, filtra por Área, Estado, Responsable o Año.",
                "El bloque de resultado filtrado muestra el número de solicitudes e inversión que cumplen los filtros.",
                "Los KPIs superiores siempre reflejan el 100% de los datos como vista general.",
              ]},
              { t: "4. Semáforo de estados", icon: Activity, items: [
                "Prioridad: rojo = Alta, amarillo = Media, verde = Baja.",
                "Estado: color distinto para Pendiente, En Revisión, Aprobado, Rechazado y Adquirido.",
                "Presupuesto: verde < 80%, amarillo 80–100%, rojo > 100% (sobre presupuesto).",
              ]},
              { t: "5. Editar el presupuesto", icon: Wallet, items: [
                "En la pestaña Presupuesto, edita directamente el valor asignado por área y año.",
                "La inversión ejecutada se calcula sumando solicitudes en estado Aprobado o Adquirido.",
              ]},
              { t: "6. Recomendaciones de gestión", icon: CheckCircle2, items: [
                "Revisa semanalmente las solicitudes en Pendiente y En Revisión.",
                "Prioriza solicitudes de prioridad Alta ligadas a seguridad del paciente.",
                "Usa el gráfico de Presupuesto vs. Ejecutado para anticipar áreas en riesgo.",
              ]},
              { t: "7. Áreas, personal y respaldo de datos", icon: Settings, items: [
                "En la pestaña Configuración puedes agregar o quitar Áreas y Personal responsable.",
                "No se puede eliminar un área o responsable que ya tenga solicitudes asignadas.",
                "Si Firebase está configurado (ver README.md del proyecto), todos los cambios se sincronizan en tiempo real para todo el equipo, en cualquier dispositivo.",
                "Si Firebase no está configurado, los datos se guardan solo en este navegador (modo local), como respaldo automático.",
              ]},
            ].map((sec, i) => {
              const Icon = sec.icon;
              return (
                <div key={i} className="card" style={{ padding: "18px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: "#EAF6F4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={15} color={TEAL_DARK} />
                    </div>
                    <div className="disp" style={{ fontSize: 14, fontWeight: 700, color: INK }}>{sec.t}</div>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {sec.items.map((it, j) => (
                      <li key={j} style={{ fontSize: 13, color: SLATE, lineHeight: 1.7 }}>{it}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
        </>
        )}
      </main>

      {/* MODAL: NUEVA SOLICITUD / EDITAR */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(11,42,61,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}
          onClick={closeForm}>
          <div className="card" style={{ width: 620, maxHeight: "88vh", overflowY: "auto", padding: "22px 26px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div className="disp" style={{ fontSize: 16, fontWeight: 700 }}>{editingId ? "Editar solicitud " + editingId : "Nueva solicitud de adquisición"}</div>
              <button onClick={closeForm} style={{ background: "none", border: "none", cursor: "pointer", color: SLATE_LIGHT }}><X size={18} /></button>
            </div>
            <form onSubmit={submitForm}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: 11.5, color: SLATE_LIGHT, fontWeight: 600 }}>
                    ID de la solicitud {editingId ? "" : "(tú lo defines, debe ser único)"}
                  </label>
                  <input className="inp mono" placeholder="Ej. SOL-2026-001" value={form.id} disabled={!!editingId}
                    style={editingId ? { background: "#F3F6F7", color: SLATE_LIGHT, cursor: "not-allowed" } : {}}
                    onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, color: SLATE_LIGHT, fontWeight: 600 }}>Fecha de solicitud</label>
                  <input type="date" className="inp" value={form.fecha} onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, color: SLATE_LIGHT, fontWeight: 600 }}>Fecha de entrega / actualización de estado</label>
                  <input type="date" className="inp" value={form.fechaEntrega} onChange={(e) => setForm((f) => ({ ...f, fechaEntrega: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, color: SLATE_LIGHT, fontWeight: 600 }}>Área</label>
                  <select className="sel" style={{ width: "100%" }} value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}>
                    {areas.map((a) => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: 11.5, color: SLATE_LIGHT, fontWeight: 600 }}>Equipo médico</label>
                  <input className="inp" placeholder="Ej. Monitor multiparamétrico" value={form.equipo} onChange={(e) => setForm((f) => ({ ...f, equipo: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, color: SLATE_LIGHT, fontWeight: 600 }}>Servicio</label>
                  <input className="inp" placeholder="Igual al área si aplica" value={form.servicio} onChange={(e) => setForm((f) => ({ ...f, servicio: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, color: SLATE_LIGHT, fontWeight: 600 }}>Responsable</label>
                  <select className="sel" style={{ width: "100%" }} value={form.responsable} onChange={(e) => setForm((f) => ({ ...f, responsable: e.target.value }))}>
                    {responsables.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11.5, color: SLATE_LIGHT, fontWeight: 600 }}>Tipo de adquisición</label>
                  <select className="sel" style={{ width: "100%" }} value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}>
                    {TIPOS.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11.5, color: SLATE_LIGHT, fontWeight: 600 }}>Criticidad</label>
                  <select className="sel" style={{ width: "100%" }} value={form.criticidad} onChange={(e) => setForm((f) => ({ ...f, criticidad: e.target.value }))}>{CRITICIDADES.map(p=><option key={p}>{p}</option>)}</select>
                </div>
                <div>
                  <label style={{ fontSize: 11.5, color: SLATE_LIGHT, fontWeight: 600 }}>Prioridad</label>
                  <select className="sel" style={{ width: "100%" }} value={form.prioridad} onChange={(e) => setForm((f) => ({ ...f, prioridad: e.target.value }))}>{PRIORIDADES.map(p=><option key={p}>{p}</option>)}</select>
                </div>
                <div>
                  <label style={{ fontSize: 11.5, color: SLATE_LIGHT, fontWeight: 600 }}>Estado</label>
                  <select className="sel" style={{ width: "100%" }} value={form.estado} onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}>
                    {ESTADOS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11.5, color: SLATE_LIGHT, fontWeight: 600 }}>Valor unitario (USD)</label>
                  <input type="number" className="inp" placeholder="0" value={form.valorUnitario} onChange={(e) => setForm((f) => ({ ...f, valorUnitario: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, color: SLATE_LIGHT, fontWeight: 600 }}>Cantidad</label>
                  <input type="number" min="1" className="inp" value={form.cantidad} onChange={(e) => setForm((f) => ({ ...f, cantidad: e.target.value }))} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: 11.5, color: SLATE_LIGHT, fontWeight: 600 }}>Justificación</label>
                  <input className="inp" placeholder="Motivo de la solicitud" value={form.justificacion} onChange={(e) => setForm((f) => ({ ...f, justificacion: e.target.value }))} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: 11.5, color: SLATE_LIGHT, fontWeight: 600 }}>Observaciones</label>
                  <input className="inp" placeholder="Opcional" value={form.observaciones} onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
                <span className="mono" style={{ fontSize: 12.5, color: SLATE_LIGHT }}>
                  Inversión total: <b style={{ color: INK }}>{fmtUSD((Number(form.valorUnitario) || 0) * (Number(form.cantidad) || 0))}</b>
                </span>
                <div style={{ display: "flex", gap: 10 }}>
                  <button type="button" className="btn-ghost" onClick={closeForm}>Cancelar</button>
                  <button type="submit" className="btn-primary">
                    {editingId ? (<><Save size={14} /> Guardar cambios</>) : (<><Plus size={14} /> Guardar solicitud</>)}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CLAVE DE SEGURIDAD (editar / eliminar) */}
      {authModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(11,42,61,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70, padding: 20 }}
          onClick={closeAuthModal}>
          <div className="card" style={{ width: 360, padding: "22px 24px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <KeyRound size={16} color={INK} />
              <div className="disp" style={{ fontSize: 15, fontWeight: 700 }}>
                {authModal.type === "delete" ? "Confirmar eliminación" : authModal.type === "create" ? "Confirmar nueva solicitud" : "Confirmar edición"}
              </div>
            </div>
            <p style={{ fontSize: 12.5, color: SLATE_LIGHT, margin: "4px 0 14px 0" }}>
              {authModal.type === "delete"
                ? "Ingresa la clave para eliminar esta solicitud de forma permanente."
                : authModal.type === "create"
                ? "Ingresa la clave para registrar una nueva solicitud."
                : "Ingresa la clave para habilitar la edición de esta solicitud."}
            </p>
            <form onSubmit={confirmAuth}>
              <input type="password" autoFocus className="inp" placeholder="Clave" value={authPass}
                onChange={(e) => { setAuthPass(e.target.value); setAuthError(""); }} />
              {authError && <div style={{ color: CORAL, fontSize: 11.5, marginTop: 6 }}>{authError}</div>}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
                <button type="button" className="btn-ghost" onClick={closeAuthModal}>Cancelar</button>
                <button type="submit" className="btn-primary"
                  style={authModal.type === "delete" ? { background: CORAL } : {}}>
                  {authModal.type === "delete" ? "Eliminar" : "Continuar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: INK, color: "#fff",
          padding: "11px 20px", borderRadius: 9, fontSize: 13, display: "flex", alignItems: "center", gap: 8, zIndex: 60, boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
          <CheckCircle2 size={15} color={TEAL} /> {toast}
        </div>
      )}
    </div>
  );
}
