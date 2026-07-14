import { useState, useEffect } from "react";
import { db } from "./firebase.js";
import { doc, getDoc, setDoc } from "firebase/firestore";

const NAVY   = "#1e3a5f";
const ORANGE = "#f97316";
const BG     = "#f8fafc";

const RANGOS = ["10:00 a 11:00","11:00 a 12:00","12:00 a 13:00","13:00 a 14:00","17:00 a 18:00","18:00 a 19:00","19:00 a 20:00","20:00 a 21:00"];
const PAGOS  = ["Bizum","Efectivo","Transferencia","Tarjeta"];

function hoy() { return new Date().toISOString().slice(0, 10); }

// ── LANDING ─────────────────────────────────────────────────────────────────
function Landing({ onPedir }) {
  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div style={{ background: NAVY, padding: "18px 24px", display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 32 }}>👨‍🍳</span>
        <div>
          <h1 style={{ color: "#fff", margin: 0, fontSize: 22, fontWeight: 900 }}>Don Pepe Sabor</h1>
          <span style={{ color: "#94b4d4", fontSize: 12 }}>Sabor venezolano en cada bocado</span>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #2d5a8e 100%)`, padding: "60px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>👨‍🍳</div>
        <h2 style={{ color: "#fff", fontSize: 28, fontWeight: 900, margin: "0 0 12px" }}>Tequeños, Empanadas y Pastelitos</h2>
        <p style={{ color: "#94b4d4", fontSize: 16, margin: "0 0 32px", maxWidth: 380, marginLeft: "auto", marginRight: "auto" }}>
          Auténtica comida venezolana hecha con amor. Tequeños, empanadas y pastelitos a tu puerta en Madrid.
        </p>
        <button onClick={onPedir} style={{ background: ORANGE, border: "none", borderRadius: 50, color: "#fff", padding: "16px 40px", fontSize: 18, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 20px #f9731655" }}>
          🛒 Haz tu pedido
        </button>
      </div>

      {/* Info rápida */}
      <div style={{ display: "flex", justifyContent: "center", gap: 12, padding: "24px 16px", flexWrap: "wrap" }}>
        {[
          { icon: "📍", titulo: "Dónde estamos", texto: "Repartimos por toda la Comunidad de Madrid" },
          { icon: "⏰", titulo: "Horario", texto: "Lun–Vie 10:00–14:00 y 17:00–21:00 · Sáb 10:00–15:00" },
          { icon: "🚚", titulo: "Reparto", texto: "Envío a domicilio · Recogida en tienda disponible" },
        ].map(c => (
          <div key={c.titulo} style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", minWidth: 200, maxWidth: 260, flex: 1, boxShadow: "0 1px 8px #0001", textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{c.icon}</div>
            <p style={{ color: NAVY, fontWeight: 800, margin: "0 0 6px", fontSize: 15 }}>{c.titulo}</p>
            <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>{c.texto}</p>
          </div>
        ))}
      </div>

      {/* Productos destacados */}
      <div style={{ padding: "16px 24px 32px", maxWidth: 600, margin: "0 auto" }}>
        <h3 style={{ color: NAVY, fontWeight: 900, fontSize: 20, textAlign: "center", marginBottom: 20 }}>Nuestros productos</h3>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {[
            { emoji: "🧀", nombre: "Tequeños", desc: "Tradicionales, de jamón, guayaba y más" },
            { emoji: "🫔", nombre: "Pastelitos", desc: "Pollo, carne mechada, jamón y queso..." },
            { emoji: "🫓", nombre: "Empanadas", desc: "Carne, pollo, queso, jamón y queso" },
            { emoji: "🥐", nombre: "Cachitos",  desc: "Horneados, crujientes y deliciosos" },
          ].map(p => (
            <div key={p.nombre} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", width: 140, boxShadow: "0 1px 6px #0001", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{p.emoji}</div>
              <p style={{ color: NAVY, fontWeight: 800, margin: "0 0 4px", fontSize: 14 }}>{p.nombre}</p>
              <p style={{ color: "#94a3b8", fontSize: 12, margin: 0 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contacto y redes */}
      <div style={{ background: NAVY, padding: "32px 24px", textAlign: "center" }}>
        <h3 style={{ color: "#fff", fontWeight: 800, fontSize: 18, marginBottom: 20 }}>Contáctanos</h3>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", marginBottom: 24 }}>
          <a href="https://wa.me/34600111222" style={{ color: "#4ade80", textDecoration: "none", fontWeight: 700, fontSize: 15 }}>
            📱 WhatsApp
          </a>
          <a href="https://instagram.com/donpepesabor" style={{ color: "#f9a8d4", textDecoration: "none", fontWeight: 700, fontSize: 15 }}>
            📸 Instagram
          </a>
          <a href="https://facebook.com/donpepesabor" style={{ color: "#93c5fd", textDecoration: "none", fontWeight: 700, fontSize: 15 }}>
            👥 Facebook
          </a>
          <a href="tel:+34600111222" style={{ color: "#fde68a", textDecoration: "none", fontWeight: 700, fontSize: 15 }}>
            📞 600 111 222
          </a>
        </div>
        <p style={{ color: "#475569", fontSize: 12, margin: 0 }}>
          © 2025 Don Pepe Sabor · Madrid, España
        </p>
      </div>

      {/* Botón flotante */}
      <button onClick={onPedir} style={{ position: "fixed", bottom: 24, right: 24, background: ORANGE, border: "none", borderRadius: 50, color: "#fff", padding: "16px 24px", fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 20px #f9731666", zIndex: 100 }}>
        🛒 Pedir ahora
      </button>
    </div>
  );
}

// ── FORMULARIO DE PEDIDO ─────────────────────────────────────────────────────
function Formulario({ onVolver }) {
  const [productos, setProductos] = useState([]);
  const [lineas, setLineas]       = useState([{ productoId: "", presentacion: "", cantidad: 1 }]);
  const [form, setForm]           = useState({ nombre: "", telefono: "", direccion: "", cp: "", formaPago: "", rangoHorario: "" });
  const [paso, setPaso]           = useState("form"); // form | enviando | confirmado
  const [error, setError]         = useState("");

  useEffect(() => {
    getDoc(doc(db, "datos", "productos")).then(snap => {
      if (snap.exists()) setProductos(JSON.parse(snap.data().valor));
    });
  }, []);

  const addLinea = () => setLineas(l => [...l, { productoId: "", presentacion: "", cantidad: 1 }]);
  const removeLinea = i => setLineas(l => l.filter((_, idx) => idx !== i));
  const updateLinea = (i, key, val) => setLineas(l => l.map((li, idx) => idx === i ? { ...li, [key]: val, ...(key === "productoId" ? { presentacion: "" } : {}) } : li));

  const lineasValidas = lineas.filter(l => l.productoId && l.presentacion && l.cantidad > 0);
  const total = lineasValidas.reduce((s, l) => {
    const prod = productos.find(p => p.id === l.productoId);
    const vari = prod?.variantes.find(v => v.presentacion === l.presentacion);
    return s + (vari?.precio || 0) * l.cantidad;
  }, 0);

  const enviar = async () => {
    if (!form.nombre.trim())       return setError("Introduce tu nombre.");
    if (!form.telefono.trim())     return setError("Introduce tu teléfono.");
    if (!form.direccion.trim())    return setError("Introduce tu dirección.");
    if (!form.cp.trim())           return setError("Introduce el código postal.");
    if (!form.formaPago)           return setError("Selecciona la forma de pago.");
    if (!form.rangoHorario)        return setError("Selecciona el horario.");
    if (lineasValidas.length === 0) return setError("Añade al menos un producto.");
    setError(""); setPaso("enviando");
    try {
      const snap = await getDoc(doc(db, "datos", "pedidos"));
      const actuales = snap.exists() ? JSON.parse(snap.data().valor) : [];
      const items = lineasValidas.map((l, idx) => {
        const prod = productos.find(p => p.id === l.productoId);
        const vari = prod?.variantes.find(v => v.presentacion === l.presentacion);
        return { id: "item-" + idx, productoId: l.productoId, nombreProducto: prod?.nombre, presentacion: l.presentacion, estado: "Congelado", cantidad: Number(l.cantidad), precio: vari?.precio || 0, subtotal: (vari?.precio || 0) * Number(l.cantidad), comision: 0, recargoFrito: 0 };
      });
      await setDoc(doc(db, "datos", "pedidos"), { valor: JSON.stringify([...actuales, { id: "web-" + Date.now(), ...form, tipoEntrega: "Domicilio", fecha: hoy(), estado: "Pendiente", envio: 0, repartidorId: "", notas: "", items, total }]) });
      setPaso("confirmado");
    } catch { setError("Error al enviar. Inténtalo de nuevo."); setPaso("form"); }
  };

  if (paso === "confirmado") return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif", padding: 24, textAlign: "center" }}>
      <div style={{ fontSize: 72 }}>✅</div>
      <h2 style={{ color: NAVY, marginTop: 16, fontSize: 26 }}>¡Pedido recibido!</h2>
      <p style={{ color: "#64748b", maxWidth: 320, fontSize: 15 }}>Nos pondremos en contacto contigo para confirmar la entrega.</p>
      <p style={{ color: ORANGE, fontWeight: 900, fontSize: 24, margin: "8px 0 24px" }}>Total: {total.toFixed(2)} €</p>
      <button onClick={onVolver} style={{ background: NAVY, border: "none", borderRadius: 50, color: "#fff", padding: "14px 32px", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>← Volver al inicio</button>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'Inter', sans-serif", paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ background: NAVY, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 12px #0003" }}>
        <button onClick={onVolver} style={{ background: "transparent", border: "none", color: "#94b4d4", fontSize: 22, cursor: "pointer", padding: 0 }}>←</button>
        <span style={{ fontSize: 24 }}>👨‍🍳</span>
        <h1 style={{ color: "#fff", margin: 0, fontSize: 18, fontWeight: 900 }}>Hacer pedido</h1>
        {total > 0 && <span style={{ marginLeft: "auto", background: ORANGE, color: "#fff", borderRadius: 50, padding: "5px 14px", fontWeight: 700, fontSize: 14 }}>{total.toFixed(2)} €</span>}
      </div>

      <div style={{ maxWidth: 500, margin: "0 auto", padding: "20px 16px" }}>

        {/* Productos */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: "0 1px 6px #0001" }}>
          <h3 style={{ color: NAVY, margin: "0 0 16px", fontSize: 17, fontWeight: 800 }}>🧀 Productos</h3>

          {lineas.map((linea, i) => {
            const prod = productos.find(p => p.id === linea.productoId);
            return (
              <div key={i} style={{ background: "#f8fafc", borderRadius: 12, padding: 14, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>Producto {i + 1}</span>
                  {lineas.length > 1 && <button onClick={() => removeLinea(i)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 18, fontWeight: 700 }}>×</button>}
                </div>
                <select value={linea.productoId} onChange={e => updateLinea(i, "productoId", e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 14, fontFamily: "inherit", background: "#fff", marginBottom: 8, boxSizing: "border-box" }}>
                  <option value="">— Selecciona un producto —</option>
                  {[...new Set(productos.map(p => p.categoria))].map(cat => (
                    <optgroup key={cat} label={cat}>
                      {productos.filter(p => p.categoria === cat).map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>

                {prod && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <select value={linea.presentacion} onChange={e => updateLinea(i, "presentacion", e.target.value)}
                      style={{ flex: 2, padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 14, fontFamily: "inherit", background: "#fff", boxSizing: "border-box" }}>
                      <option value="">— Presentación —</option>
                      {prod.variantes.map(v => (
                        <option key={v.presentacion} value={v.presentacion}>{v.presentacion} — {v.precio} €</option>
                      ))}
                    </select>
                    <input type="number" min="1" max="99" value={linea.cantidad} onChange={e => updateLinea(i, "cantidad", e.target.value)}
                      style={{ flex: 1, padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 14, fontFamily: "inherit", textAlign: "center", boxSizing: "border-box" }} />
                  </div>
                )}
              </div>
            );
          })}

          <button onClick={addLinea} style={{ width: "100%", background: "transparent", border: `1.5px dashed ${ORANGE}`, borderRadius: 10, color: ORANGE, padding: "10px", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 4 }}>
            + Añadir otro producto
          </button>
        </div>

        {/* Datos cliente */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: "0 1px 6px #0001" }}>
          <h3 style={{ color: NAVY, margin: "0 0 16px", fontSize: 17, fontWeight: 800 }}>📋 Tus datos</h3>

          {[
            { label: "Nombre completo *", key: "nombre", type: "text", placeholder: "Ej: María García" },
            { label: "Teléfono *", key: "telefono", type: "tel", placeholder: "Ej: 612345678" },
            { label: "Dirección de entrega *", key: "direccion", type: "text", placeholder: "Calle, número, piso..." },
            { label: "Código postal *", key: "cp", type: "text", placeholder: "Ej: 28001" },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 4 }}>{f.label}</label>
              <input type={f.type} placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 15, fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
            </div>
          ))}

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 8 }}>Forma de pago *</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {PAGOS.map(p => (
                <button key={p} onClick={() => setForm(f => ({ ...f, formaPago: p }))}
                  style={{ padding: "9px 16px", borderRadius: 50, border: `1.5px solid ${form.formaPago === p ? ORANGE : "#e2e8f0"}`, background: form.formaPago === p ? ORANGE : "#fff", color: form.formaPago === p ? "#fff" : "#64748b", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Horario de entrega *</label>
            <select value={form.rangoHorario} onChange={e => setForm(f => ({ ...f, rangoHorario: e.target.value }))}
              style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 15, fontFamily: "inherit", background: "#fff", boxSizing: "border-box" }}>
              <option value="">Selecciona un horario</option>
              {RANGOS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        {/* Total */}
        {total > 0 && (
          <div style={{ background: NAVY, borderRadius: 16, padding: "16px 20px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#94b4d4", fontWeight: 700, fontSize: 15 }}>Total estimado</span>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 22 }}>{total.toFixed(2)} €</span>
          </div>
        )}

        {error && <p style={{ color: "#dc2626", fontWeight: 600, fontSize: 14, textAlign: "center", marginBottom: 12 }}>⚠️ {error}</p>}

        <button onClick={enviar} disabled={paso === "enviando"}
          style={{ width: "100%", background: paso === "enviando" ? "#94a3b8" : ORANGE, border: "none", borderRadius: 50, color: "#fff", padding: "16px", fontSize: 17, fontWeight: 800, cursor: paso === "enviando" ? "default" : "pointer", boxShadow: "0 4px 16px #f9731644" }}>
          {paso === "enviando" ? "Enviando..." : "✅ Confirmar pedido"}
        </button>
      </div>
    </div>
  );
}

// ── RAÍZ ────────────────────────────────────────────────────────────────────
export default function PedidoPublico() {
  const [vista, setVista] = useState("landing");
  if (vista === "formulario") return <Formulario onVolver={() => setVista("landing")} />;
  return <Landing onPedir={() => setVista("formulario")} />;
}
