import React, { useState, useMemo, useEffect } from "react";
import {
  collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc,
  arrayUnion, arrayRemove, writeBatch,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebaseConfig";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  LayoutDashboard, Database, Wallet, Table2, BookOpen, Plus, X,
  ChevronDown, ChevronUp, Activity, TrendingUp, Package, ClipboardCheck,
  AlertTriangle, CheckCircle2, Search, Trash2, SlidersHorizontal, Settings, Save, Cloud, Download,
  ArrowUp, ArrowDown, ArrowUpDown, Pencil, KeyRound, ArrowRightLeft,
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

const INITIAL_DATA = [
  { id: "SOL-2026-001", fecha: "2026-01-12", fechaEntrega: "", anio: 2026, area: "UCI", servicio: "UCI Adultos", responsable: "Lcda.Diana Ramón", equipo: "Ventilador Mecánico de Alta Gama", tipo: "Reposición", criticidad: "Crítica", prioridad: "Alta", estado: "Aprobado", valorUnitario: 28500, cantidad: 2, total: 57000, justificacion: "Reemplazo de equipos con vida útil cumplida.", observaciones: "Urgente" },
  { id: "SOL-2026-002", fecha: "2026-01-15", fechaEntrega: "2026-02-10", anio: 2026, area: "Imagenología", servicio: "Rayos X", responsable: "Ing.Alan Ochoa", equipo: "Ecógrafo Portátil 3D", tipo: "Nuevo", criticidad: "Alta", prioridad: "Media", estado: "Adquirido", valorUnitario: 42000, cantidad: 1, total: 42000, justificacion: "Ampliación de servicios en emergencias.", observaciones: "" },
  { id: "SOL-2026-003", fecha: "2026-02-02", fechaEntrega: "", anio: 2026, area: "Emergencias", servicio: "Triage", responsable: "Bqf.Johana Guevara", equipo: "Monitor Multiparamétrico", tipo: "Nuevo", criticidad: "Alta", prioridad: "Alta", estado: "En Revisión", valorUnitario: 3500, cantidad: 5, total: 17500, justificacion: "Déficit de monitores en área de triage.", observaciones: "Cotizaciones en evaluación" },
  { id: "SOL-2026-004", fecha: "2026-02-20", fechaEntrega: "", anio: 2026, area: "Quirófano", servicio: "Cirugía General", responsable: "Lcda.Marcela Pesantez", equipo: "Mesa Quirúrgica Electrohidráulica", tipo: "Reposición", criticidad: "Media", prioridad: "Media", estado: "Pendiente", valorUnitario: 18000, cantidad: 1, total: 18000, justificacion: "Mesa actual presenta fallas recurrentes.", observaciones: "" },
  { id: "SOL-2025-089", fecha: "2025-11-05", fechaEntrega: "2025-12-15", anio: 2025, area: "Laboratorio Clínico", servicio: "Hematología", responsable: "Bqf.Gabriela Romero", equipo: "Analizador Hematológico Automático", tipo: "Nuevo", criticidad: "Alta", prioridad: "Alta", estado: "Adquirido", valorUnitario: 34000, cantidad: 1, total: 34000, justificacion: "Actualización tecnológica.", observaciones: "Instalado y calibrado" },
  { id: "SOL-2026-005", fecha: "2026-03-01", fechaEntrega: "", anio: 2026, area: "Hospitalización", servicio: "Piso 2", responsable: "Lcda.Mariela Peñalosa", equipo: "Camas Hospitalarias Eléctricas", tipo: "Reposición", criticidad: "Baja", prioridad: "Baja", estado: "Rechazado", valorUnitario: 1200, cantidad: 10, total: 12000, justificacion: "Mejora de confort del paciente.", observaciones: "Sin presupuesto actual" },
  { id: "SOL-2026-006", fecha: "2026-03-10", fechaEntrega: "", anio: 2026, area: "Consulta Externa", servicio: "Cardiología", responsable: "Lcda.Isabel León", equipo: "Electrocardiógrafo de 12 canales", tipo: "Nuevo", criticidad: "Media", prioridad: "Media", estado: "Aprobado", valorUnitario: 2100, cantidad: 2, total: 4200, justificacion: "Incremento de demanda de pacientes.", observaciones: "En proceso de compra" }
];

const INITIAL_BUDGET = YEARS.flatMap((y) => AREAS_DEFAULT.map((a) => {
  let p = 0;
  if (y === 2026) {
    if (a === "UCI") p = 80000;
    else if (a === "Imagenología") p = 60000;
    else if (a === "Emergencias") p = 50000;
    else if (a === "Quirófano") p = 40000;
    else if (a === "Consulta Externa") p = 15000;
    else p = 10000;
  }
  return { area: a, anio: y, presupuesto: p };
}));

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
  "Alta":  { bg: "#FBE2DE", text: "#A3341E", chart: "#A3341E" },
  "Media": { bg: "#FDF3D8", text: "#8A6D00", chart: "#E3A008" },
  "Baja":  { bg: "#DCF5EF", text: "#0B6E64", chart: "#12A594" },
};

const CRITICIDAD_STYLE = {
  "Crítica": { bg: "#FBE2DE", text: "#A3341E", chart: "#E4572E" },
  "Alta":    { bg: "#FBE2DE", text: "#A3341E", chart: "#A3341E" },
  "Media":   { bg: "#FDF3D8", text: "#8A6D00", chart: "#E3A008" },
  "Baja":    { bg: "#DCF5EF", text: "#0B6E64", chart: "#12A594" },
};

const TIPO_STYLE = {
  "Nuevo":      { bg: "#DCF5EF", text: "#0B6E64", chart: TEAL },
  "Reposición": { bg: "#FDEBDC", text: "#B45A0F", chart: AMBER },
};

const fmtUSD = (n) => "$" + Math.round(n).toLocaleString("es-EC");
const fmtUSDk = (n) => {
  if (Math.abs(n) >= 1000000) return "$" + (n / 1000000).toFixed(1) + "M";
  if (Math.abs(n) >= 1000) return "$" + Math.round(n / 1000) + "k";
  return "$" + Math.round(n);
};
const fmtPct = (n) => (n * 100).toFixed(1) + "%";
const APP_PASSWORD = "1a2b3c";

// --- Persistencia local ---
const STORAGE_PREFIX = "acq_equipos_medicos_";
const presupuestoId = (area, anio) =>`${area}_${anio}`.replace(/[\/\\]/g, "-");
function loadLocal(key, fallback) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return fallback;
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    if (raw) return JSON.parse(raw);
  } catch (e) { }
  return fallback;
}
function saveLocal(key, value) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) { }
}

const escapeXML = (str) => {
  if (str === null || str === undefined) return "";
  return String(str).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
};

// Componente para los botones estilo "Tabs"
const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    type="button"
    style={{
      background: active ? '#ffffff' : 'transparent',
      color: active ? INK : SLATE_LIGHT,
      boxShadow: active ? '0 2px 5px rgba(0,0,0,0.06)' : 'none',
      border: 'none',
      borderRadius: 6,
      padding: '5px 14px',
      fontSize: 12,
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }}
  >
    {children}
  </button>
);

// Tooltip Unificado con colores dinámicos
const SharedTooltip = ({ active, payload, label, titlePrefix }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    // Extraemos el color directamente de Recharts para que coincida con la barra/porción
    const color = payload[0].fill || INK; 
    const categoryName = data.name || data.estado || data.tipo || data.prioridad || data.criticidad || data.area || data.equipo || label;
    
    return (
      <div style={{ background: "#fff", border: `1px solid ${BORDER}`, padding: "12px 16px", borderRadius: 8, boxShadow: "0 4px 14px rgba(0,0,0,0.08)", minWidth: 200 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: color, marginBottom: 10, borderBottom: `1px solid ${BORDER}`, paddingBottom: 6 }}>
          {titlePrefix}: <span style={{color: color}}>{categoryName}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: SLATE, marginBottom: 4 }}>
          <span>Solicitudes:</span> <b style={{color: INK}}>{data.n || 0}</b>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: SLATE, marginBottom: 4 }}>
          <span>Equipos:</span> <b style={{color: INK}}>{data.equipos || 0}</b>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: SLATE, marginTop: 8, paddingTop: 6, borderTop: `1px dashed ${BORDER}` }}>
          <span>Inversión:</span> <b style={{color: INK, fontSize: 13.5}}>{fmtUSD(data.inversion || 0)}</b>
        </div>
      </div>
    );
  }
  return null;
};

export default function App() {
  const cloudMode = isFirebaseConfigured;
  const [cloudReady, setCloudReady] = useState(!cloudMode);
  const [tab, setTab] = useState("dashboard");
  const [data, setData] = useState(() => (cloudMode ? [] : loadLocal("data", INITIAL_DATA)));
  const [budget, setBudget] = useState(() => (cloudMode ? [] : loadLocal("budget", INITIAL_BUDGET)));
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
  const [authModal, setAuthModal] = useState(null); 
  const [authPass, setAuthPass] = useState("");
  const [authError, setAuthError] = useState("");
  
  // Controles de gráficos
  const [areaChartMode, setAreaChartMode] = useState("inversion");
  const [estadoChartMode, setEstadoChartMode] = useState("inversion");

  const emptyForm = {
    id: "", fecha: new Date().toISOString().slice(0, 10), fechaEntrega: "", area: areas[0] || "", servicio: "", responsable: responsables[0] || "",
    equipo: "", tipo: "Nuevo", justificacion: "", criticidad: "Media", prioridad: "Media", estado: "Pendiente",
    valorUnitario: "", cantidad: 1, observaciones: "",
  };
  const [form, setForm] = useState(emptyForm);

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
      responsable: form.responsable, equipo: form.equipo, tipo: form.tipo, criticidad: form.criticidad,
      justificacion: form.justificacion || "Sin justificación registrada", prioridad: form.prioridad,
      estado: form.estado, valorUnitario: Number(form.valorUnitario), cantidad: Number(form.cantidad) || 1,
      total: Number(form.valorUnitario) * (Number(form.cantidad) || 1), observaciones: form.observaciones,
    };
    if (cloudMode) {
      setDoc(doc(db, "solicitudes", record.id), record).catch(() => showToast("Error al guardar en la nube."));
    } else {
      if (editingId) setData((d) => d.map((r) => (r.id === editingId ? record : r)));
      else setData((d) => [record, ...d]);
    }
    setForm(emptyForm); setEditingId(null); setShowForm(false);
    showToast(editingId ? `Solicitud ${record.id} actualizada.` : `Solicitud ${record.id} registrada correctamente.`);
  };

  const deleteRequest = (id) => {
    if (cloudMode) deleteDoc(doc(db, "solicitudes", id)).catch(() => showToast("Error al eliminar en la nube."));
    else setData((d) => d.filter((r) => r.id !== id));
  };

  const requestCreate = () => { setAuthModal({ type: "create" }); setAuthPass(""); setAuthError(""); };
  const requestDelete = (id) => { setAuthModal({ type: "delete", id }); setAuthPass(""); setAuthError(""); };
  const requestEdit = (id) => { setAuthModal({ type: "edit", id }); setAuthPass(""); setAuthError(""); };
  const closeAuthModal = () => { setAuthModal(null); setAuthPass(""); setAuthError(""); };

  const confirmAuth = (e) => {
    e.preventDefault();
    if (authPass !== APP_PASSWORD) { setAuthError("Clave incorrecta."); return; }
    if (authModal.type === "create") {
      setEditingId(null); setForm(emptyForm); setShowForm(true);
    } else if (authModal.type === "delete") {
      deleteRequest(authModal.id); showToast("Solicitud eliminada.");
    } else if (authModal.type === "edit") {
      const rec = data.find((r) => r.id === authModal.id);
      if (rec) {
        setForm({
          id: rec.id, fecha: rec.fecha, fechaEntrega: rec.fechaEntrega || "", area: rec.area, servicio: rec.servicio, responsable: rec.responsable,
          equipo: rec.equipo, tipo: rec.tipo, criticidad: rec.criticidad || rec.prioridad || "Media", justificacion: rec.justificacion, prioridad: rec.prioridad,
          estado: rec.estado, valorUnitario: String(rec.valorUnitario), cantidad: String(rec.cantidad),
          observaciones: rec.observaciones || "",
        });
        setEditingId(rec.id); setShowForm(true);
      }
    }
    closeAuthModal();
  };

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
    setNewArea(""); showToast(`Área "${name}" agregada.`);
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
    if (cloudMode) updateDoc(doc(db, "config", "listas"), { responsables: arrayUnion(name) });
    else setResponsables((r) => [...r, name]);
    setNewResp(""); showToast(`Responsable "${name}" agregado.`);
  };

  const removeResponsable = (name) => {
    if (data.some((r) => r.responsable === name)) { showToast("No se puede eliminar: hay solicitudes asignadas a ese responsable."); return; }
    if (cloudMode) updateDoc(doc(db, "config", "listas"), { responsables: arrayRemove(name) });
    else setResponsables((r) => r.filter((x) => x !== name));
  };

  const exportXML = () => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<adquisiciones_biomedicas>\n`;
    data.forEach(r => {
      xml += `  <registro>\n`;
      xml += `    <id>${escapeXML(r.id)}</id>\n`;
      xml += `    <fecha>${escapeXML(r.fecha)}</fecha>\n`;
      xml += `    <fecha_entrega>${escapeXML(r.fechaEntrega)}</fecha_entrega>\n`;
      xml += `    <anio>${escapeXML(r.anio)}</anio>\n`;
      xml += `    <area>${escapeXML(r.area)}</area>\n`;
      xml += `    <servicio>${escapeXML(r.servicio)}</servicio>\n`;
      xml += `    <responsable>${escapeXML(r.responsable)}</responsable>\n`;
      xml += `    <equipo>${escapeXML(r.equipo)}</equipo>\n`;
      xml += `    <tipo>${escapeXML(r.tipo)}</tipo>\n`;
      xml += `    <criticidad>${escapeXML(r.criticidad || r.prioridad)}</criticidad>\n`;
      xml += `    <prioridad>${escapeXML(r.prioridad)}</prioridad>\n`;
      xml += `    <estado>${escapeXML(r.estado)}</estado>\n`;
      xml += `    <valor_unitario>${escapeXML(r.valorUnitario)}</valor_unitario>\n`;
      xml += `    <cantidad>${escapeXML(r.cantidad)}</cantidad>\n`;
      xml += `    <inversion_total>${escapeXML(r.total)}</inversion_total>\n`;
      xml += `    <justificacion>${escapeXML(r.justificacion)}</justificacion>\n`;
      xml += `    <observaciones>${escapeXML(r.observaciones)}</observaciones>\n`;
      xml += `  </registro>\n`;
    });
    xml += `</adquisiciones_biomedicas>`;
    
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `adquisiciones_biomedicas_${new Date().toISOString().slice(0, 10)}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

  const kpis = useMemo(() => {
    const total = filtered.length;
    const equiposTotales = filtered.reduce((s, r) => s + (r.cantidad || 1), 0);
    const invTotal = filtered.reduce((s, r) => s + r.total, 0);
    const invNuevos = filtered.filter(r => r.tipo === "Nuevo").reduce((s, r) => s + r.total, 0);
    const invRepo = filtered.filter(r => r.tipo === "Reposición").reduce((s, r) => s + r.total, 0);
    
    const presTotal = budget.reduce((s, b) => s + b.presupuesto, 0);
    const ejecTotal = data.filter((r) => r.estado === "Aprobado" || r.estado === "Adquirido").reduce((s, r) => s + r.total, 0);
    
    return {
      total, equiposTotales, invTotal, invNuevos, invRepo,
      pctPresupuesto: presTotal ? ejecTotal / presTotal : 0,
      presTotal, ejecTotal
    };
  }, [filtered, budget, data]);

  const byArea = useMemo(() => {
    let arr = areas.map((a) => {
      const f = filtered.filter((r) => r.area === a);
      return {
        area: a, n: f.length,
        equipos: f.reduce((s, r) => s + (r.cantidad || 1), 0),
        inversion: f.reduce((s, r) => s + r.total, 0),
      };
    });
    arr.sort((a, b) => areaChartMode === "inversion" ? b.inversion - a.inversion : b.n - a.n);
    return arr;
  }, [filtered, areas, areaChartMode]);

  const byEstado = useMemo(() => {
    let arr = ESTADOS.map((e) => {
      const f = filtered.filter((r) => r.estado === e);
      return {
        estado: e, n: f.length,
        equipos: f.reduce((s, r) => s + (r.cantidad || 1), 0),
        inversion: f.reduce((s, r) => s + r.total, 0),
      };
    });
    // Se organiza el gráfico de dona basado en el modo seleccionado
    arr.sort((a, b) => estadoChartMode === "inversion" ? b.inversion - a.inversion : b.n - a.n);
    return arr;
  }, [filtered, estadoChartMode]);

  const byTipo = useMemo(() => TIPOS.map((t) => {
    const f = filtered.filter((r) => r.tipo === t);
    return {
      tipo: t, n: f.length,
      equipos: f.reduce((s, r) => s + (r.cantidad || 1), 0),
      inversion: f.reduce((s, r) => s + r.total, 0),
    };
  }), [filtered]);

  const byPrioridad = useMemo(() => PRIORIDADES.map((p) => {
    const f = filtered.filter((r) => r.prioridad === p);
    return {
      prioridad: p, n: f.length,
      equipos: f.reduce((s, r) => s + (r.cantidad || 1), 0),
      inversion: f.reduce((s, r) => s + r.total, 0),
    };
  }), [filtered]);

  // Nuevo gráfico: Top 5 Equipos de mayor inversión
  const top5Equipos = useMemo(() => {
    return [...filtered]
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map(r => ({ equipo: r.equipo, n: 1, equipos: r.cantidad, inversion: r.total, id: r.id }));
  }, [filtered]);

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
        .expand-cell:hover .expand-text { -webkit-line-clamp:unset; display:block; background:#FFF7DE; color:${INK}; position:relative; z-index:10; }
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
              {tab === "dashboard" && "Dashboard Administrativo"}
              {tab === "database" && "Base de Datos de Adquisiciones"}
              {tab === "budget" && "Presupuesto por Área"}
              {tab === "pivots" && "Resumen y Tablas Dinámicas"}
              {tab === "config" && "Configuración de Áreas y Responsables"}
              {tab === "guide" && "Guía de Uso"}
            </h1>
            <p style={{ fontSize: 13, color: SLATE_LIGHT, margin: "4px 0 0 0" }}>
              Panel de control hospitalario · Presupuesto, gestión y toma de decisiones
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
            {/* KPI ROW */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 18 }}>
              {[
                { label: "SOLICITUDES TOTALES", value: kpis.total, fmt: (v) => v, icon: Package, accent: INK },
                { label: "INVERSIÓN TOTAL", value: kpis.invTotal, fmt: fmtUSDk, icon: TrendingUp, accent: TEAL_DARK },
                { label: "EQUIPOS TOTALES", value: kpis.equiposTotales, fmt: (v) => v, icon: Activity, accent: "#3D8BD4" },
                { label: "INVERSIÓN NUEVOS", value: kpis.invNuevos, fmt: fmtUSDk, icon: ClipboardCheck, accent: TEAL },
                { label: "INVERSIÓN REPOSICIÓN", value: kpis.invRepo, fmt: fmtUSDk, icon: ArrowRightLeft, accent: AMBER },
                { label: "PRESUPUESTO EJEC.", value: kpis.pctPresupuesto, fmt: fmtPct, icon: AlertTriangle,
                  accent: kpis.pctPresupuesto > 1 ? CORAL : kpis.pctPresupuesto >= 0.8 ? AMBER : TEAL },
              ].map((k, i) => {
                const Icon = k.icon;
                return (
                  <div key={i} className="card" style={{ padding: "14px 16px", borderTop: "3px solid " + k.accent }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.04em", color: SLATE_LIGHT }}>{k.label}</span>
                      <Icon size={14} color={k.accent} />
                    </div>
                    <div className="mono" style={{ fontSize: 20, fontWeight: 600, color: INK, marginTop: 8 }}>{k.fmt(k.value)}</div>
                  </div>
                );
              })}
            </div>

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
            </div>

            {/* CHARTS GRID */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              
              {/* Áreas (con botones estéticos) */}
              <div className="card" style={{ padding: "16px 18px", gridColumn: "1 / -1" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div className="disp" style={{ fontSize: 14.5, fontWeight: 700 }}>Adquisiciones por Área</div>
                  <div style={{ display: "flex", gap: 4, background: "#F3F6F7", padding: 4, borderRadius: 8, border: `1px solid ${BORDER}` }}>
                    <TabButton active={areaChartMode === "solicitudes"} onClick={() => setAreaChartMode("solicitudes")}>
                      Solicitudes
                    </TabButton>
                    <TabButton active={areaChartMode === "inversion"} onClick={() => setAreaChartMode("inversion")}>
                      Valor / Inversión
                    </TabButton>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={byArea} margin={{ top: 10, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
                    <XAxis dataKey="area" tick={{ fontSize: 10, fill: SLATE }} interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis tickFormatter={areaChartMode === "inversion" ? fmtUSDk : (v)=>v} tick={{ fontSize: 11, fill: SLATE_LIGHT }} />
                    <Tooltip content={<SharedTooltip titlePrefix="Área" />} cursor={{fill: '#F3F6F7'}} />
                    <Bar dataKey={areaChartMode === "inversion" ? "inversion" : "n"} fill={INK} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Estados (Ahora con pestañas) */}
              <div className="card" style={{ padding: "16px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div className="disp" style={{ fontSize: 13.5, fontWeight: 700 }}>Distribución por estado</div>
                  <div style={{ display: "flex", gap: 4, background: "#F3F6F7", padding: 3, borderRadius: 8, border: `1px solid ${BORDER}` }}>
                    <TabButton active={estadoChartMode === "solicitudes"} onClick={() => setEstadoChartMode("solicitudes")}>
                      Solicitudes
                    </TabButton>
                    <TabButton active={estadoChartMode === "inversion"} onClick={() => setEstadoChartMode("inversion")}>
                      Inversión
                    </TabButton>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie 
                      data={byEstado} 
                      dataKey={estadoChartMode === "inversion" ? "inversion" : "n"} 
                      nameKey="estado" 
                      cx="50%" cy="50%" innerRadius={54} outerRadius={90} paddingAngle={2}
                    >
                      {byEstado.map((e, i) => <Cell key={i} fill={STATUS_STYLE[e.estado].dot} />)}
                    </Pie>
                    <Tooltip content={<SharedTooltip titlePrefix="Estado" />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11.5 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Tipo de equipo */}
              <div className="card" style={{ padding: "16px 18px" }}>
                <div className="disp" style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 10 }}>Tipo de equipo:</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={byTipo} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={BORDER} horizontal={false} />
                    <XAxis type="number" tickFormatter={fmtUSDk} tick={{ fontSize: 11, fill: SLATE_LIGHT }} />
                    <YAxis type="category" dataKey="tipo" width={90} tick={{ fontSize: 11, fill: SLATE }} />
                    <Tooltip content={<SharedTooltip titlePrefix="Tipo" />} cursor={{fill: '#F3F6F7'}} />
                    <Bar dataKey="inversion" radius={[0, 4, 4, 0]}>
                      {byTipo.map((e, i) => <Cell key={i} fill={TIPO_STYLE[e.tipo].chart} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Prioridad */}
              <div className="card" style={{ padding: "16px 18px" }}>
                <div className="disp" style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 10 }}>Prioridad de Inversión</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={byPrioridad} margin={{ top: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
                    <XAxis dataKey="prioridad" tick={{ fontSize: 11.5, fill: SLATE }} />
                    <YAxis tickFormatter={fmtUSDk} tick={{ fontSize: 11, fill: SLATE_LIGHT }} />
                    <Tooltip content={<SharedTooltip titlePrefix="Prioridad" />} cursor={{fill: '#F3F6F7'}} />
                    <Bar dataKey="inversion" radius={[4, 4, 0, 0]}>
                      {byPrioridad.map((e, i) => <Cell key={i} fill={PRIORITY_STYLE[e.prioridad].chart} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top 5 Equipos (Nuevo) */}
              <div className="card" style={{ padding: "16px 18px" }}>
                <div className="disp" style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 10 }}>Top 5 Equipos (Mayor Inversión)</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={top5Equipos} layout="vertical" margin={{ left: -10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={BORDER} horizontal={false} />
                    <XAxis type="number" tickFormatter={fmtUSDk} tick={{ fontSize: 11, fill: SLATE_LIGHT }} />
                    <YAxis type="category" dataKey="equipo" width={110} tick={{ fontSize: 10, fill: SLATE }} />
                    <Tooltip content={<SharedTooltip titlePrefix="Equipo" />} cursor={{fill: '#F3F6F7'}} />
                    <Bar dataKey="inversion" fill={VIOLET} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Presupuesto gigante abajo */}
              <div className="card" style={{ padding: "20px 22px", gridColumn: "1 / -1", marginTop: 10 }}>
                <div className="disp" style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Presupuesto Asignado vs. Inversión Ejecutada por Área</div>
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={budgetByArea} margin={{ top: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
                    <XAxis dataKey="area" tick={{ fontSize: 11, fill: SLATE }} interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis tickFormatter={fmtUSDk} tick={{ fontSize: 11, fill: SLATE_LIGHT }} />
                    <Tooltip 
                      formatter={(value, name) => [fmtUSD(value), name]}
                      contentStyle={{ borderRadius: 8, fontSize: 13, border: `1px solid ${BORDER}`, boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}
                      cursor={{fill: '#F3F6F7'}}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, marginTop: 10 }} />
                    <Bar dataKey="presupuesto" name="Presupuesto Asignado" fill="#B9CBD6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="ejecutado" name="Inversión Ejecutada" fill={TEAL} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

            </div>
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
              <button className="btn-ghost" onClick={exportXML} title="Descargar toda la base en XML">
                <Download size={14} /> Descargar XML
              </button>
              <span style={{ marginLeft: "auto", fontSize: 12.5, color: SLATE_LIGHT }}>
                {dbFiltered.length} registros
              </span>
            </div>

            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 2000 }}>
                  <thead>
                    <tr style={{ background: "#FAFBFC" }}>
                      <th className="th"><button type="button" className="sortbtn" onClick={() => toggleSort("id")}>ID {sortIcon("id")}</button></th>
                      <th className="th"><button type="button" className="sortbtn" onClick={() => toggleSort("fecha")}>Fecha Sol. {sortIcon("fecha")}</button></th>
                      <th className="th">Fecha Entrega</th>
                      <th className="th"><button type="button" className="sortbtn" onClick={() => toggleSort("area")}>Área {sortIcon("area")}</button></th>
                      <th className="th">Servicio</th>
                      <th className="th">Responsable</th>
                      <th className="th">Equipo Médico</th>
                      <th className="th">Tipo</th>
                      <th className="th"><button type="button" className="sortbtn" onClick={() => toggleSort("criticidad")}>Criticidad {sortIcon("criticidad")}</button></th>
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
                    {dbFiltered.map((r) => {
                      const critStyle = CRITICIDAD_STYLE[r.criticidad || r.prioridad] || CRITICIDAD_STYLE["Media"];
                      return (
                      <tr key={r.id} className="datarow">
                        <td className="td mono" style={{ fontSize: 11.5, color: SLATE }}>{r.id}</td>
                        <td className="td">{new Date(r.fecha + "T00:00:00").toLocaleDateString("es-EC")}</td>
                        <td className="td">{r.fechaEntrega ? new Date(r.fechaEntrega + "T00:00:00").toLocaleDateString("es-EC") : <span style={{ color: "#D8DFE4" }}>—</span>}</td>
                        <td className="td">{r.area}</td>
                        <td className="td">{r.servicio}</td>
                        <td className="td">{r.responsable}</td>
                        <td className="td" style={{ maxWidth: 200 }}>{r.equipo}</td>
                        <td className="td"><span className="badge" style={{ background: TIPO_STYLE[r.tipo].bg, color: TIPO_STYLE[r.tipo].text }}>{r.tipo}</span></td>
                        <td className="td"><span className="badge" style={{ background: critStyle.bg, color: critStyle.text }}>{r.criticidad || r.prioridad}</span></td>
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
                    )})}
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
                    {["Área", "Año", "Presupuesto Asignado", "Inversión Ejecutada", "Disponible", "% Ejecutado", "Estado"].map((h) => (
                      <th key={h} className="th">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {budget.map((b) => {
                    const ejecutado = data
                      .filter((r) => r.area === b.area && r.anio === b.anio && (r.estado === "Aprobado" || r.estado === "Adquirido"))
                      .reduce((s, r) => s + r.total, 0);
                    const disponible = b.presupuesto - ejecutado;
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
                        <td className="td mono">{fmtUSD(disponible)}</td>
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
                  {ESTADOS.map((e) => {
                    const row = byEstado.find(x => x.estado === e);
                    return (
                      <tr key={e} className="datarow">
                        <td className="td"><span className="badge" style={{ background: STATUS_STYLE[e].bg, color: STATUS_STYLE[e].text }}>{e}</span></td>
                        <td className="td mono">{row?.n || 0}</td>
                        <td className="td mono">{fmtUSD(row?.inversion || 0)}</td>
                      </tr>
                    );
                  })}
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
                "Base de Datos: registro completo de solicitudes, editable en cualquier momento.",
                "Presupuesto: presupuesto por área y año con ejecución automática.",
                "Resumen y Pivotes: tablas cruzadas equivalentes a tablas dinámicas de Excel.",
              ]},
              { t: "2. Cómo agregar una solicitud", icon: Plus, items: [
                "Haz clic en 'Nueva solicitud' desde el Dashboard o la Base de Datos.",
                "Completa los campos: equipo, área, responsable, tipo, prioridad, estado y valores.",
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
                "Si Firebase está configurado, todos los cambios se sincronizan en tiempo real para todo el equipo.",
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
          <div className="card" style={{ width: 660, maxHeight: "88vh", overflowY: "auto", padding: "22px 26px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div className="disp" style={{ fontSize: 16, fontWeight: 700 }}>{editingId ? "Editar solicitud " + editingId : "Nueva solicitud de adquisición"}</div>
              <button onClick={closeForm} style={{ background: "none", border: "none", cursor: "pointer", color: SLATE_LIGHT }}><X size={18} /></button>
            </div>
            <form onSubmit={submitForm}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: 11.5, color: SLATE_LIGHT, fontWeight: 600 }}>ID de la solicitud</label>
                  <input className="inp mono" placeholder="Ej. SOL-2026-001" value={form.id} disabled={!!editingId}
                    style={editingId ? { background: "#F3F6F7", color: SLATE_LIGHT, cursor: "not-allowed" } : {}}
                    onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, color: SLATE_LIGHT, fontWeight: 600 }}>Fecha de solicitud</label>
                  <input type="date" className="inp" value={form.fecha} onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, color: SLATE_LIGHT, fontWeight: 600 }}>Fecha de entrega / actualización</label>
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
                  <input className="inp" value={form.servicio} onChange={(e) => setForm((f) => ({ ...f, servicio: e.target.value }))} />
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
                  <select className="sel" style={{ width: "100%" }} value={form.criticidad} onChange={(e) => setForm((f) => ({ ...f, criticidad: e.target.value }))}>
                    {CRITICIDADES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11.5, color: SLATE_LIGHT, fontWeight: 600 }}>Prioridad</label>
                  <select className="sel" style={{ width: "100%" }} value={form.prioridad} onChange={(e) => setForm((f) => ({ ...f, prioridad: e.target.value }))}>
                    {PRIORIDADES.map((p) => <option key={p}>{p}</option>)}
                  </select>
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
                    {editingId ? (<><Save size={14} /> Guardar</>) : (<><Plus size={14} /> Guardar</>)}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {authModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(11,42,61,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70, padding: 20 }}
          onClick={closeAuthModal}>
          <div className="card" style={{ width: 360, padding: "22px 24px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <KeyRound size={16} color={INK} />
              <div className="disp" style={{ fontSize: 15, fontWeight: 700 }}>
                {authModal.type === "delete" ? "Confirmar eliminación" : authModal.type === "create" ? "Nueva solicitud" : "Editar"}
              </div>
            </div>
            <p style={{ fontSize: 12.5, color: SLATE_LIGHT, margin: "4px 0 14px 0" }}>
              Ingresa la clave maestra para continuar.
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

      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: INK, color: "#fff",
          padding: "11px 20px", borderRadius: 9, fontSize: 13, display: "flex", alignItems: "center", gap: 8, zIndex: 60, boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
          <CheckCircle2 size={15} color={TEAL} /> {toast}
        </div>
      )}
    </div>
  );
}