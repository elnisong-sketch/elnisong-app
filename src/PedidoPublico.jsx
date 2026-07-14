import { useState, useEffect } from "react";
import { db } from "./firebase.js";
import { doc, getDoc, setDoc } from "firebase/firestore";

const NAVY   = "#1e3a5f";
const ORANGE = "#f97316";

const RANGOS = ["10:00 a 11:00","11:00 a 12:00","12:00 a 13:00","13:00 a 14:00","17:00 a 18:00","18:00 a 19:00","19:00 a 20:00","20:00 a 21:00"];
const PAGOS  = ["Bizum","Efectivo","Transferencia","Tarjeta"];

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

export default function PedidoPublico() {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito]     = useState({});
  const [form, setForm]           = useState({ nombre: "", telefono: "", direccion: "", cp: "", formaPago: "", rangoHorario: "" });
  const [paso, setPaso]           = useState("catalogo"); // catalogo | datos | confirmado | enviando
  const [error, setError]         = useState("");

  useEffect(() => {
    getDoc(doc(db, "datos", "productos")).then(snap => {
      if (snap.exists()) {
        setProductos(JSON.parse(snap.data().valor));
      }
    });
  }, []);

  const cambiarCantidad = (productoId, presentacion, delta) => {
    const key = `${productoId}-${presentacion}`;
    setCarrito(prev => {
      const actual = prev[key]?.cantidad || 0;
      const nueva  = Math.max(0, actual + delta);
      if (nueva === 0) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      const prod = productos.find(p => p.id === productoId);
      const vari = prod?.variantes.find(v => v.presentacion === presentacion);
      return { ...prev, [key]: { productoId, nombreProducto: prod?.nombre, presentacion, precio: vari?.precio || 0, cantidad: nueva } };
    });
  };

  const totalCarrito = Object.values(carrito).reduce((s, i) => s + i.precio * i.cantidad, 0);
  const itemsCarrito = Object.values(carrito).filter(i => i.cantidad > 0);

  const enviarPedido = async () => {
    if (!form.nombre.trim())        return setError("Introduce tu nombre.");
    if (!form.telefono.trim())      return setError("Introduce tu teléfono.");
    if (!form.direccion.trim())     return setError("Introduce tu dirección.");
    if (!form.cp.trim())            return setError("Introduce el código postal.");
    if (!form.formaPago)            return setError("Selecciona la forma de pago.");
    if (!form.rangoHorario)         return setError("Selecciona el horario de entrega.");
    if (itemsCarrito.length === 0)  return setError("Añade al menos un producto.");
    setError("");
    setPaso("enviando");
    try {
      const snap = await getDoc(doc(db, "datos", "pedidos"));
      const pedidosActuales = snap.exists() ? JSON.parse(snap.data().valor) : [];
      const nuevoPedido = {
        id: "web-" + Date.now(),
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim(),
        direccion: form.direccion.trim(),
        cp: form.cp.trim(),
        tipoEntrega: "Domicilio",
        formaPago: form.formaPago,
        rangoHorario: form.rangoHorario,
        fecha: hoy(),
        estado: "Pendiente",
        envio: 0,
        repartidorId: "",
        notas: "",
        items: itemsCarrito.map((i, idx) => ({
          id: "item-" + idx,
          productoId: i.productoId,
          nombreProducto: i.nombreProducto,
          presentacion: i.presentacion,
          estado: "Congelado",
          cantidad: i.cantidad,
          precio: i.precio,
          subtotal: i.precio * i.cantidad,
          comision: 0,
          recargoFrito: 0,
        })),
        total: totalCarrito,
      };
      await setDoc(doc(db, "datos", "pedidos"), { valor: JSON.stringify([...pedidosActuales, nuevoPedido]) });
      setPaso("confirmado");
    } catch (e) {
      setError("Error al enviar el pedido. Inténtalo de nuevo.");
      setPaso("datos");
    }
  };

  const categorias = [...new Set(productos.map(p => p.categoria))];

  // ── CONFIRMADO ──
  if (paso === "confirmado") return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif", padding: 24 }}>
      <div style={{ fontSize: 64 }}>✅</div>
      <h2 style={{ color: NAVY, marginTop: 16 }}>¡Pedido recibido!</h2>
      <p style={{ color: "#64748b", textAlign: "center", maxWidth: 320 }}>Nos pondremos en contacto contigo para confirmar la entrega.</p>
      <p style={{ color: ORANGE, fontWeight: 700, fontSize: 22 }}>Total: {totalCarrito.toFixed(2)} €</p>
      <button onClick={() => { setCarrito({}); setForm({ nombre: "", telefono: "", direccion: "", cp: "", formaPago: "", rangoHorario: "" }); setPaso("catalogo"); }}
        style={{ marginTop: 20, background: NAVY, color: "#fff", border: "none", borderRadius: 50, padding: "14px 32px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
        Hacer otro pedido
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", fontFamily: "'Inter', sans-serif", paddingBottom: 100 }}>

      {/* Header */}
      <div style={{ background: NAVY, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 12px #0003" }}>
        <span style={{ fontSize: 28 }}>👨‍🍳</span>
        <div>
          <h1 style={{ color: "#fff", margin: 0, fontSize: 20, fontWeight: 900 }}>Don Pepe Sabor</h1>
          <span style={{ color: "#94b4d4", fontSize: 12 }}>Haz tu pedido online</span>
        </div>
        {itemsCarrito.length > 0 && (
          <div style={{ marginLeft: "auto", background: ORANGE, color: "#fff", borderRadius: 50, padding: "6px 16px", fontWeight: 700, fontSize: 14 }}>
            🛒 {totalCarrito.toFixed(2)} €
          </div>
        )}
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px" }}>

        {/* PASO: CATÁLOGO */}
        {(paso === "catalogo") && (<>
          {categorias.map(cat => (
            <div key={cat} style={{ marginBottom: 24 }}>
              <h3 style={{ color: NAVY, margin: "0 0 12px", fontSize: 16, fontWeight: 800, borderLeft: `4px solid ${ORANGE}`, paddingLeft: 10 }}>{cat}</h3>
              {productos.filter(p => p.categoria === cat).map(prod => (
                <div key={prod.id} style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", marginBottom: 10, boxShadow: "0 1px 6px #0001" }}>
                  <p style={{ margin: "0 0 10px", fontWeight: 700, color: NAVY, fontSize: 15 }}>{prod.nombre}</p>
                  {prod.variantes.map(v => {
                    const key = `${prod.id}-${v.presentacion}`;
                    const cant = carrito[key]?.cantidad || 0;
                    return (
                      <div key={v.presentacion} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ color: "#64748b", fontSize: 14 }}>{v.presentacion}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ color: ORANGE, fontWeight: 700, fontSize: 15 }}>{v.precio} €</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <button onClick={() => cambiarCantidad(prod.id, v.presentacion, -1)}
                              style={{ width: 30, height: 30, borderRadius: 50, border: `1.5px solid ${cant > 0 ? ORANGE : "#cbd5e1"}`, background: cant > 0 ? ORANGE : "#fff", color: cant > 0 ? "#fff" : "#94a3b8", fontWeight: 900, fontSize: 16, cursor: "pointer", lineHeight: 1 }}>−</button>
                            <span style={{ minWidth: 20, textAlign: "center", fontWeight: 700, color: NAVY }}>{cant}</span>
                            <button onClick={() => cambiarCantidad(prod.id, v.presentacion, 1)}
                              style={{ width: 30, height: 30, borderRadius: 50, border: `1.5px solid ${NAVY}`, background: NAVY, color: "#fff", fontWeight: 900, fontSize: 16, cursor: "pointer", lineHeight: 1 }}>+</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}

          {itemsCarrito.length > 0 && (
            <button onClick={() => setPaso("datos")}
              style={{ width: "100%", background: ORANGE, border: "none", borderRadius: 50, color: "#fff", padding: "16px", fontSize: 17, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px #f9731644" }}>
              Continuar — {totalCarrito.toFixed(2)} €
            </button>
          )}
        </>)}

        {/* PASO: DATOS DEL CLIENTE */}
        {(paso === "datos" || paso === "enviando") && (<>
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
                <input type={f.type} placeholder={f.placeholder} value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 15, fontFamily: "inherit", boxSizing: "border-box", outline: "none" }} />
              </div>
            ))}

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Forma de pago *</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {PAGOS.map(p => (
                  <button key={p} onClick={() => setForm(f => ({ ...f, formaPago: p }))}
                    style={{ padding: "9px 16px", borderRadius: 50, border: `1.5px solid ${form.formaPago === p ? ORANGE : "#e2e8f0"}`, background: form.formaPago === p ? ORANGE : "#fff", color: form.formaPago === p ? "#fff" : "#64748b", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 6 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Horario de entrega *</label>
              <select value={form.rangoHorario} onChange={e => setForm(f => ({ ...f, rangoHorario: e.target.value }))}
                style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 15, fontFamily: "inherit", background: "#fff", boxSizing: "border-box" }}>
                <option value="">Selecciona un horario</option>
                {RANGOS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {/* Resumen del pedido */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: "0 1px 6px #0001" }}>
            <h3 style={{ color: NAVY, margin: "0 0 12px", fontSize: 17, fontWeight: 800 }}>🛒 Tu pedido</h3>
            {itemsCarrito.map(i => (
              <div key={`${i.productoId}-${i.presentacion}`} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}>
                <span style={{ color: "#475569" }}>{i.nombreProducto} <span style={{ color: "#94a3b8" }}>({i.presentacion})</span> ×{i.cantidad}</span>
                <span style={{ fontWeight: 700, color: NAVY }}>{(i.precio * i.cantidad).toFixed(2)} €</span>
              </div>
            ))}
            <div style={{ borderTop: "1.5px solid #f1f5f9", marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 800, color: NAVY }}>Total</span>
              <span style={{ fontWeight: 900, color: ORANGE, fontSize: 18 }}>{totalCarrito.toFixed(2)} €</span>
            </div>
          </div>

          {error && <p style={{ color: "#dc2626", fontWeight: 600, fontSize: 14, textAlign: "center", marginBottom: 12 }}>⚠️ {error}</p>}

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { setPaso("catalogo"); setError(""); }}
              style={{ flex: 1, background: "#fff", border: `1.5px solid #e2e8f0`, borderRadius: 50, color: "#64748b", padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              ← Volver
            </button>
            <button onClick={enviarPedido} disabled={paso === "enviando"}
              style={{ flex: 2, background: paso === "enviando" ? "#94a3b8" : NAVY, border: "none", borderRadius: 50, color: "#fff", padding: "14px", fontSize: 15, fontWeight: 700, cursor: paso === "enviando" ? "default" : "pointer" }}>
              {paso === "enviando" ? "Enviando..." : "Confirmar pedido"}
            </button>
          </div>
        </>)}

      </div>
    </div>
  );
}
