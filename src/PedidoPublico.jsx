import { useState, useEffect } from "react";
import { db } from "./firebase.js";
import { doc, getDoc, setDoc } from "firebase/firestore";

const NAVY   = "#1e3a5f";
const ORANGE = "#f97316";
const BG     = "#f8fafc";
const VINO   = "#6b1a1a";
const CREMA  = "#fdf3e0";
const GOLD   = "#c8920a";

const RANGOS = ["10:00 a 11:00","11:00 a 12:00","12:00 a 13:00","13:00 a 14:00","17:00 a 18:00","18:00 a 19:00","19:00 a 20:00","20:00 a 21:00"];
const PAGOS  = ["Bizum","Efectivo","Transferencia","Tarjeta"];

function hoy() { return new Date().toISOString().slice(0, 10); }

const SeccionTitulo = ({ titulo }) => (
  <div style={{ background: VINO, borderRadius: 8, padding: "8px 18px", display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
    <span style={{ color: "#fff", fontWeight: 900, fontSize: 18, letterSpacing: 1, fontFamily: "Georgia, serif" }}>{titulo}</span>
    <span style={{ color: GOLD, fontSize: 18 }}>✦</span>
  </div>
);

const FilaProducto = ({ nombre, cantidad, precio }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px dashed #e5d5b0" }}>
    <div>
      <span style={{ color: VINO, fontWeight: 700, fontSize: 13 }}>• </span>
      <span style={{ color: "#3d1a00", fontWeight: 700, fontSize: 13 }}>{nombre}</span>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ color: "#888", fontSize: 12 }}>{cantidad}</span>
      <span style={{ background: VINO, color: "#fff", borderRadius: 8, padding: "3px 10px", fontWeight: 900, fontSize: 14 }}>{precio}€</span>
    </div>
  </div>
);

// ── LANDING ─────────────────────────────────────────────────────────────────
const IMG_TEQUENOS      = "/tequeños.jpg";
const IMG_EMPANADAS     = "/empanadas.jpg";
const IMG_PASTEL_POLLO  = "/pastelpollo.jpg";
const IMG_PASTEL_CARNE  = "/pastelcarne.jpg";
const IMG_TODOS         = "/todosproductos.jpg";
const IMG_CHEFS         = "/donpepechefs.jpg";

function Landing({ onPedir }) {
  return (
    <div style={{ minHeight: "100vh", background: CREMA, fontFamily: "Georgia, 'Times New Roman', serif" }}>

      {/* Hero — 2 columnas */}
      <div style={{ background: `linear-gradient(160deg, #3d1a00 0%, ${VINO} 100%)` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 420, alignItems: "center" }}>
          <div style={{ padding: "48px 40px 48px 48px" }}>
            <p style={{ color: "#e5d5b0", fontSize: 12, letterSpacing: 4, margin: "0 0 12px", textTransform: "uppercase" }}>Tequeños · Pasteles · Empanadas</p>
            <h1 style={{ color: GOLD, margin: "0 0 4px", fontSize: 56, fontWeight: 900, fontStyle: "italic", lineHeight: 1 }}>Don Pepe</h1>
            <h2 style={{ color: "#fff", margin: "0 0 16px", fontSize: 44, fontWeight: 900, fontStyle: "italic" }}>Sabor</h2>
            <p style={{ color: GOLD, fontSize: 20, fontStyle: "italic", margin: "0 0 12px" }}>❝ Sabor que te encanta ❞</p>
            <p style={{ color: "#c8b090", fontSize: 14, margin: "0 0 32px", lineHeight: 1.6 }}>Auténtica comida venezolana hecha con amor.<br/>Pedidos a domicilio en Madrid.</p>
            <button onClick={onPedir} style={{ background: GOLD, border: "none", borderRadius: 50, color: "#3d1a00", padding: "16px 44px", fontSize: 18, fontWeight: 900, cursor: "pointer", boxShadow: "0 4px 20px #0005", fontFamily: "inherit" }}>
              🛒 Haz tu pedido
            </button>
          </div>
          <div style={{ height: "100%", minHeight: 420, overflow: "hidden", background: CREMA }}>
            <img src={IMG_CHEFS} alt="Don Pepe Sabor"
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
          </div>
        </div>
      </div>

      {/* Menú completo */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>

        {/* Tequeños + foto lateral */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24, alignItems: "stretch" }}>
          <div style={{ background: "#fff8ed", border: "2px solid #e5d5b0", borderRadius: 14, padding: 20 }}>
            <SeccionTitulo titulo="TEQUEÑOS" />
            <FilaProducto nombre="Tequeños Tradicionales"     cantidad="25 uds" precio={12} />
            <FilaProducto nombre="Tequeños Tradicionales"     cantidad="50 uds" precio={22} />
            <FilaProducto nombre="Tequeños Guayaba y Queso"   cantidad="25 uds" precio={22} />
            <FilaProducto nombre="Tequeños de Salchicha"      cantidad="25 uds" precio={20} />
            <FilaProducto nombre="Tequeños Plátano con Queso" cantidad="25 uds" precio={20} />
            <FilaProducto nombre="Tequeños Jamón y Queso"     cantidad="25 uds" precio={22} />
            <FilaProducto nombre="Tequeños de Chocolate"      cantidad="24 uds" precio={22} />
          </div>
          <div style={{ borderRadius: 14, overflow: "hidden", background: CREMA, minHeight: 260 }}>
            <img src={IMG_TEQUENOS} alt="Tequeños" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
          </div>
        </div>

        {/* Foto lateral + Pastelitos */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24, alignItems: "stretch" }}>
          <div style={{ borderRadius: 14, overflow: "hidden", background: CREMA, minHeight: 260 }}>
            <img src={IMG_PASTEL_POLLO} alt="Pastelitos" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
          </div>
          <div style={{ background: "#fff8ed", border: "2px solid #e5d5b0", borderRadius: 14, padding: 20 }}>
            <SeccionTitulo titulo="PASTELITOS" />
            <FilaProducto nombre="Pastelito de Pollo"               cantidad="25 uds" precio={22} />
            <FilaProducto nombre="Pastelito de Carne Molida"        cantidad="25 uds" precio={22} />
            <FilaProducto nombre="Pastelito de Carne Mechada"       cantidad="25 uds" precio={22} />
            <FilaProducto nombre="Pastelito de Jamón y Queso"       cantidad="25 uds" precio={22} />
            <FilaProducto nombre="Pastelito Carne Mechada c/ Queso" cantidad="25 uds" precio={22} />
            <FilaProducto nombre="Pastelito de Pollo c/ Queso"      cantidad="25 uds" precio={22} />
          </div>
        </div>

        {/* Empanadas + Cachitos */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24, alignItems: "stretch" }}>
          <div style={{ background: "#fff8ed", border: "2px solid #e5d5b0", borderRadius: 14, padding: 20 }}>
            <SeccionTitulo titulo="EMPANADAS" />
            <FilaProducto nombre="Empanada de Carne Molida"  cantidad="25 uds" precio={21} />
            <FilaProducto nombre="Empanada de Pollo"         cantidad="25 uds" precio={21} />
            <FilaProducto nombre="Empanada de Carne Mechada" cantidad="25 uds" precio={21} />
            <FilaProducto nombre="Empanada de Queso"         cantidad="25 uds" precio={21} />
            <FilaProducto nombre="Empanada de Jamón y Queso" cantidad="25 uds" precio={21} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ borderRadius: 14, overflow: "hidden", background: CREMA, flex: 1, minHeight: 160 }}>
              <img src={IMG_EMPANADAS} alt="Empanadas" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
            </div>
            <div style={{ background: "#fff8ed", border: "2px solid #e5d5b0", borderRadius: 14, padding: 20 }}>
              <SeccionTitulo titulo="CACHITOS" />
              <FilaProducto nombre="Cachitos Horneados" cantidad="6 uds" precio={18} />
            </div>
          </div>
        </div>

        {/* Sellos */}
        <div style={{ background: `linear-gradient(135deg, #3d1a00, ${VINO})`, borderRadius: 16, padding: "28px 32px", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 20, marginBottom: 28 }}>
          {[
            { icon: "🏅", texto: "Ingredientes de calidad" },
            { icon: "❤️", texto: "Hechos con amor para ti" },
            { icon: "🎉", texto: "Ideales para reuniones y celebraciones" },
            { icon: "🚚", texto: "Reparto a domicilio en Madrid" },
          ].map(s => (
            <div key={s.texto} style={{ textAlign: "center", color: "#fff", maxWidth: 140 }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>{s.icon}</div>
              <p style={{ color: GOLD, fontWeight: 700, fontSize: 13, margin: 0 }}>{s.texto}</p>
            </div>
          ))}
        </div>

        <p style={{ textAlign: "center", color: VINO, fontStyle: "italic", fontWeight: 700, fontSize: 20, margin: "0 0 28px" }}>
          ✦ ¡Disfruta el auténtico sabor venezolano! ✦
        </p>

        <button onClick={onPedir} style={{ display: "block", width: "100%", background: VINO, border: `3px solid ${GOLD}`, borderRadius: 50, color: "#fff", padding: "20px", fontSize: 20, fontWeight: 900, cursor: "pointer", boxShadow: "0 4px 20px #6b1a1a44", fontFamily: "inherit" }}>
          🛒 Hacer mi pedido ahora
        </button>
      </div>

      {/* Pie */}
      <div style={{ background: "#3d1a00", padding: "28px 24px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap", marginBottom: 16 }}>
          <a href="https://wa.me/34600111222" style={{ color: "#4ade80", textDecoration: "none", fontWeight: 700, fontSize: 15 }}>📱 WhatsApp</a>
          <a href="https://instagram.com/donpepesabor" style={{ color: "#f9a8d4", textDecoration: "none", fontWeight: 700, fontSize: 15 }}>📸 Instagram</a>
          <a href="https://facebook.com/donpepesabor" style={{ color: "#93c5fd", textDecoration: "none", fontWeight: 700, fontSize: 15 }}>👥 Facebook</a>
          <a href="tel:+34600111222" style={{ color: "#fde68a", textDecoration: "none", fontWeight: 700, fontSize: 15 }}>📞 600 111 222</a>
        </div>
        <p style={{ color: "#9a7a5a", fontSize: 12, margin: 0 }}>© 2025 Don Pepe Sabor · Madrid, España</p>
      </div>

      {/* Botón flotante */}
      <button onClick={onPedir} style={{ position: "fixed", bottom: 24, right: 24, background: VINO, border: `3px solid ${GOLD}`, borderRadius: 50, color: "#fff", padding: "14px 22px", fontSize: 15, fontWeight: 900, cursor: "pointer", boxShadow: "0 4px 20px #0005", zIndex: 100, fontFamily: "inherit" }}>
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
      const nuevoPedido = { id: "web-" + Date.now(), ...form, tipoEntrega: "Domicilio", fecha: hoy(), estado: "Pendiente", envio: 0, repartidorId: "", notas: "", items, total };
      await setDoc(doc(db, "datos", "pedidos"), { valor: JSON.stringify([...actuales, nuevoPedido]) });

      // Enviar a Google Sheets via GET
      const productosTexto = items.map(i => `${i.nombreProducto} (${i.presentacion}) x${i.cantidad}`).join(", ");
      const params = new URLSearchParams({
        id: nuevoPedido.id,
        fecha: nuevoPedido.fecha,
        cliente: form.nombre,
        telefono: form.telefono,
        direccion: form.direccion + ", CP " + form.cp,
        productos: productosTexto,
        total: total.toFixed(2) + " €",
        notas: form.notas || ""
      });
      fetch("https://script.google.com/macros/s/AKfycbySjQNlkoTT_Wo28xxCKRgk41QvXaECsItCooxiqmwxdn5xNqUORVtHWCX7hhAC8gSY/exec?" + params.toString(), {
        mode: "no-cors"
      }).catch(() => {});

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
  const path = window.location.pathname;
  const [vista, setVista] = useState(path === "/pedido" ? "formulario" : "landing");
  if (vista === "formulario") return <Formulario onVolver={() => { window.history.pushState({}, "", "/"); setVista("landing"); }} />;
  return <Landing onPedir={() => { window.history.pushState({}, "", "/pedido"); setVista("formulario"); }} />;
}
