import { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

// ─── DATOS INICIALES ────────────────────────────────────────────────────────
const PRODUCTOS_INICIALES = [
  { id: 1, nombre: "Tequeños Queso", categoria: "Tequeños", variantes: [{ presentacion: "Bandeja 25", precio: 0, stock: 10 }, { presentacion: "Bandeja 50", precio: 0, stock: 10 }] },
  { id: 2, nombre: "Tequeños Queso/Chocolate", categoria: "Tequeños", variantes: [{ presentacion: "Bandeja 25", precio: 0, stock: 10 }, { presentacion: "Bandeja 50", precio: 0, stock: 10 }] },
  { id: 3, nombre: "Tequeños Queso/Bocadillo", categoria: "Tequeños", variantes: [{ presentacion: "Bandeja 25", precio: 0, stock: 10 }, { presentacion: "Bandeja 50", precio: 0, stock: 10 }] },
  { id: 4, nombre: "Mini Empanadas Pollo", categoria: "Empanadas", variantes: [{ presentacion: "Bandeja 25", precio: 0, stock: 10 }, { presentacion: "Bandeja 50", precio: 0, stock: 10 }] },
  { id: 5, nombre: "Mini Empanadas Carne", categoria: "Empanadas", variantes: [{ presentacion: "Bandeja 25", precio: 0, stock: 10 }, { presentacion: "Bandeja 50", precio: 0, stock: 10 }] },
  { id: 6, nombre: "Mini Pastelitos Pollo", categoria: "Pastelitos", variantes: [{ presentacion: "Bandeja 25", precio: 0, stock: 10 }, { presentacion: "Bandeja 50", precio: 0, stock: 10 }] },
  { id: 7, nombre: "Mini Pastelitos Carne", categoria: "Pastelitos", variantes: [{ presentacion: "Bandeja 25", precio: 0, stock: 10 }, { presentacion: "Bandeja 50", precio: 0, stock: 10 }] },
];

const CLIENTES_INICIALES = [
  { id: "cli-1", nombre: "María González", telefono: "+34 611 222 333", direccion: "Calle Alcalá 45, 2ºB", cp: "28009" },
  { id: "cli-2", nombre: "Carlos Pérez", telefono: "+34 622 333 444", direccion: "Av. Gran Vía 12, 4ºA", cp: "28013" },
  { id: "cli-3", nombre: "Lucía Fernández", telefono: "+34 633 444 555", direccion: "Calle Serrano 78, 1ºC", cp: "28006" },
  { id: "cli-4", nombre: "Javier Morales", telefono: "+34 644 555 666", direccion: "Paseo de la Castellana 100, 3ºD", cp: "28046" },
  { id: "cli-5", nombre: "Ana Torres", telefono: "+34 655 666 777", direccion: "Calle Toledo 33, Bajo", cp: "28005" },
];

const FORMAS_PAGO = ["Efectivo", "Bizum", "Transferencia", "Tarjeta"];
const HORAS_RANGO = Array.from({ length: 15 }, (_, i) => `${String(i + 9).padStart(2, "0")}:00`);
const ESTADOS_PEDIDO = ["Pendiente", "Confirmado", "En ruta", "Entregado", "Cancelado"];
const ESTADO_COLORS = {
  Pendiente: "#f59e0b",
  Confirmado: "#3b82f6",
  "En ruta": "#8b5cf6",
  Entregado: "#10b981",
  Cancelado: "#ef4444",
};

const hoy = () => new Date().toISOString().split("T")[0];

// ─── UTILIDADES ─────────────────────────────────────────────────────────────
const generarId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

// ─── COMPONENTES UI ─────────────────────────────────────────────────────────
const Badge = ({ estado }) => (
  <span style={{
    background: ESTADO_COLORS[estado] + "22",
    color: ESTADO_COLORS[estado],
    border: `1px solid ${ESTADO_COLORS[estado]}44`,
    borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600
  }}>{estado}</span>
);

const Btn = ({ children, onClick, variant = "primary", small, style = {} }) => {
  const base = {
    border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600,
    padding: small ? "6px 12px" : "10px 18px", fontSize: small ? 12 : 14,
    transition: "opacity .15s", ...style
  };
  const variants = {
    primary: { background: "#c8a84b", color: "#1a1a1a" },
    secondary: { background: "#2a2a2a", color: "#e0e0e0", border: "1px solid #3a3a3a" },
    danger: { background: "#ef444422", color: "#ef4444", border: "1px solid #ef444444" },
    success: { background: "#10b98122", color: "#10b981", border: "1px solid #10b98144" },
  };
  return <button style={{ ...base, ...variants[variant] }} onClick={onClick}>{children}</button>;
};

const Input = ({ label, ...props }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <label style={{ display: "block", color: "#888", fontSize: 12, marginBottom: 4 }}>{label}</label>}
    <input style={{
      width: "100%", background: "#1e1e1e", border: "1px solid #333", borderRadius: 8,
      color: "#e0e0e0", padding: "9px 12px", fontSize: 14, boxSizing: "border-box", outline: "none"
    }} {...props} />
  </div>
);

const Select = ({ label, options, ...props }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <label style={{ display: "block", color: "#888", fontSize: 12, marginBottom: 4 }}>{label}</label>}
    <select style={{
      width: "100%", background: "#1e1e1e", border: "1px solid #333", borderRadius: 8,
      color: "#e0e0e0", padding: "9px 12px", fontSize: 14, boxSizing: "border-box", outline: "none"
    }} {...props}>
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  </div>
);

const Card = ({ children, style = {} }) => (
  <div style={{
    background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12,
    padding: 16, marginBottom: 12, ...style
  }}>{children}</div>
);

const Modal = ({ title, onClose, children }) => (
  <div style={{
    position: "fixed", inset: 0, background: "#000a", zIndex: 1000,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16
  }}>
    <div style={{
      background: "#141414", border: "1px solid #2a2a2a", borderRadius: 16,
      width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto", padding: 24
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ color: "#c8a84b", margin: 0, fontSize: 18 }}>{title}</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#888", fontSize: 22, cursor: "pointer" }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

// ─── MÓDULO: PEDIDOS ────────────────────────────────────────────────────────
function FormularioPedido({ productos, clientes, repartidores, onGuardar, onCerrar, pedidoEditar }) {
  const [form, setForm] = useState(pedidoEditar || {
    clienteId: "", nombre: "", telefono: "", direccion: "", cp: "",
    tipoEntrega: "Domicilio", formaPago: "Efectivo", repartidorId: "",
    rangoHorario: "", fecha: hoy(), estado: "Pendiente", items: [], envio: 0
  });
  const [item, setItem] = useState({ productoId: "", presentacion: "Bandeja 25", estado: "Congelado", cantidad: 1, comision: 0, recargoFrito: 0 });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const cambiarTipoEntrega = (tipo) => {
    const nuevoRep = tipo === "Recogida"
      ? REPARTIDOR_TIENDA_ID
      : (repartidores.find(r => r.id !== REPARTIDOR_TIENDA_ID)?.id || "");
    setForm(f => ({ ...f, tipoEntrega: tipo, repartidorId: nuevoRep }));
  };

  const repartidoresFiltrados = form.tipoEntrega === "Recogida"
    ? repartidores.filter(r => r.id === REPARTIDOR_TIENDA_ID)
    : repartidores.filter(r => r.id !== REPARTIDOR_TIENDA_ID);

  const precioFinalItem = (it, productosRef) => {
    const prod = productosRef.find(p => p.id === parseInt(it.productoId));
    const variante = prod?.variantes.find(v => v.presentacion === it.presentacion);
    const base = variante?.precio || 0;
    const comision = parseFloat(it.comision) || 0;
    const recargoFrito = it.estado === "Frito" ? (parseFloat(it.recargoFrito) || 0) : 0;
    return base + comision + recargoFrito;
  };

  const agregarItem = () => {
    if (!item.productoId) return;
    const prod = productos.find(p => p.id === parseInt(item.productoId));
    const precioFinal = precioFinalItem(item, productos);
    setForm(f => ({
      ...f, items: [...f.items, {
        ...item, id: generarId(),
        nombreProducto: prod.nombre,
        precio: precioFinal,
        subtotal: precioFinal * item.cantidad
      }]
    }));
    setItem({ productoId: "", presentacion: "Bandeja 25", estado: "Congelado", cantidad: 1, comision: 0, recargoFrito: 0 });
  };

  const subtotalProductos = form.items.reduce((s, i) => s + (i.subtotal || 0), 0);
  const total = subtotalProductos + (parseFloat(form.envio) || 0);

  const selCliente = (id) => {
    const c = clientes.find(c => c.id === id);
    if (c) setForm(f => ({ ...f, clienteId: id, nombre: c.nombre, telefono: c.telefono, direccion: c.direccion, cp: c.cp }));
  };

  return (
    <Modal title={pedidoEditar ? "Editar Pedido" : "Nuevo Pedido"} onClose={onCerrar}>
      <Select label="Cliente registrado (opcional)"
        options={[{ value: "", label: "— Seleccionar cliente —" }, ...clientes.map(c => ({ value: c.id, label: `${c.nombre} · ${c.telefono}` }))]}
        value={form.clienteId} onChange={e => selCliente(e.target.value)} />
      <Input label="Nombre y Apellido *" value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Ej: María González" />
      <Input label="Teléfono *" value={form.telefono} onChange={e => set("telefono", e.target.value)} placeholder="+34 6XX XXX XXX" />
      <Input label="Dirección *" value={form.direccion} onChange={e => set("direccion", e.target.value)} placeholder="Calle, número, piso" />
      <Input label="Código Postal *" value={form.cp} onChange={e => set("cp", e.target.value)} placeholder="28XXX" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Select label="Tipo de entrega" options={["Domicilio", "Recogida"]} value={form.tipoEntrega} onChange={e => cambiarTipoEntrega(e.target.value)} />
        <Select label="Forma de pago" options={FORMAS_PAGO} value={form.formaPago} onChange={e => set("formaPago", e.target.value)} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Input label="Fecha de entrega" type="date" value={form.fecha} onChange={e => set("fecha", e.target.value)} />
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", color: "#888", fontSize: 12, marginBottom: 4 }}>Rango horario</label>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <select style={{ flex: 1, background: "#1e1e1e", border: "1px solid #333", borderRadius: 8, color: "#e0e0e0", padding: "9px 8px", fontSize: 14, outline: "none" }}
              value={form.rangoHorario?.split(" a ")[0] || ""}
              onChange={e => { const fin = form.rangoHorario?.split(" a ")[1] || ""; set("rangoHorario", e.target.value + " a " + fin); }}>
              <option value="">--</option>
              {HORAS_RANGO.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <span style={{ color: "#888", fontSize: 13, whiteSpace: "nowrap" }}>a</span>
            <select style={{ flex: 1, background: "#1e1e1e", border: "1px solid #333", borderRadius: 8, color: "#e0e0e0", padding: "9px 8px", fontSize: 14, outline: "none" }}
              value={form.rangoHorario?.split(" a ")[1] || ""}
              onChange={e => { const ini = form.rangoHorario?.split(" a ")[0] || ""; set("rangoHorario", ini + " a " + e.target.value); }}>
              <option value="">--</option>
              {HORAS_RANGO.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        </div>
      </div>
      {form.tipoEntrega === "Domicilio" && (
        <Input label="Costo de envío (€)" type="number" min="0" step="0.01" value={form.envio} onChange={e => set("envio", e.target.value)} placeholder="Ej: 5" />
      )}
      <Select label="Repartidor"
        options={repartidoresFiltrados.map(r => ({ value: r.id, label: r.nombre }))}
        value={form.repartidorId} onChange={e => set("repartidorId", e.target.value)} />

      {/* Agregar productos */}
      <div style={{ background: "#111", borderRadius: 10, padding: 12, marginBottom: 12 }}>
        <p style={{ color: "#c8a84b", fontSize: 13, fontWeight: 700, margin: "0 0 8px" }}>➕ Agregar producto</p>
        <Select label="Producto" options={[{ value: "", label: "— Seleccionar —" }, ...productos.map(p => ({ value: p.id, label: p.nombre }))]}
          value={item.productoId} onChange={e => setItem(i => ({ ...i, productoId: e.target.value }))} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <Select label="Presentación" options={["Bandeja 25", "Bandeja 50"]} value={item.presentacion} onChange={e => setItem(i => ({ ...i, presentacion: e.target.value }))} />
          <Select label="Estado" options={["Congelado", "Frito"]} value={item.estado} onChange={e => setItem(i => ({ ...i, estado: e.target.value }))} />
          <Input label="Cantidad" type="number" min="1" value={item.cantidad} onChange={e => setItem(i => ({ ...i, cantidad: parseInt(e.target.value) || 1 }))} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: item.estado === "Frito" ? "1fr 1fr" : "1fr", gap: 8 }}>
          <Input label="Comisión por unidad (€)" type="number" step="0.01" value={item.comision}
            onChange={e => setItem(i => ({ ...i, comision: e.target.value }))} placeholder="Ej: 2" />
          {item.estado === "Frito" && (
            <Input label="Recargo por Frito (€)" type="number" step="0.01" value={item.recargoFrito}
              onChange={e => setItem(i => ({ ...i, recargoFrito: e.target.value }))} placeholder="Ej: 5" />
          )}
        </div>
        {item.productoId && (() => {
          const precioUnit = precioFinalItem(item, productos);
          return (
            <p style={{ color: "#888", fontSize: 12, margin: "0 0 10px" }}>
              {precioUnit > 0
                ? `Precio unitario final: ${precioUnit.toFixed(2)}€ · Total: ${(precioUnit * item.cantidad).toFixed(2)}€`
                : "Sin precio asignado para esta presentación (poné el precio en Inventario)"}
            </p>
          );
        })()}
        <Btn onClick={agregarItem} small>Agregar</Btn>
      </div>

      {form.items.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ color: "#888", fontSize: 12, marginBottom: 6 }}>PRODUCTOS EN EL PEDIDO</p>
          {form.items.map((it, idx) => (
            <div key={it.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #222" }}>
              <div>
                <span style={{ color: "#e0e0e0", fontSize: 13 }}>{it.cantidad}x {it.nombreProducto} · {it.presentacion} · {it.estado}</span>
                <div style={{ color: "#666", fontSize: 12, marginTop: 2 }}>
                  {it.precio > 0 ? `Precio unitario: ${it.precio.toFixed(2)}€` : "Precio unitario: — (sin precio en Inventario)"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ color: "#c8a84b", fontSize: 14, fontWeight: 700 }}>{it.subtotal > 0 ? `${it.subtotal.toFixed(2)}€` : "—"}</span>
                <button onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))}
                  style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16 }}>✕</button>
              </div>
            </div>
          ))}
          {(parseFloat(form.envio) || 0) > 0 && (
            <p style={{ color: "#888", fontSize: 13, textAlign: "right", margin: "8px 0 0" }}>
              Subtotal: {subtotalProductos.toFixed(2)}€ + Envío: {(parseFloat(form.envio) || 0).toFixed(2)}€
            </p>
          )}
          {total > 0 && <p style={{ color: "#c8a84b", fontWeight: 700, textAlign: "right", marginTop: 4 }}>Total: {total.toFixed(2)}€</p>}
        </div>
      )}

      <Select label="Estado del pedido" options={ESTADOS_PEDIDO} value={form.estado} onChange={e => set("estado", e.target.value)} />
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn variant="secondary" onClick={onCerrar}>Cancelar</Btn>
        <Btn onClick={() => onGuardar({ ...form, id: form.id || generarId(), total })}>Guardar Pedido</Btn>
      </div>
    </Modal>
  );
}

function lineaFactura(it) {
  const numero = it.presentacion?.split(" ")[1] || "";
  const sufijo = it.estado === "Frito" ? "Fritos" : "Congelados";
  return `Bandeja ${it.nombreProducto} ${numero} - ${sufijo}`;
}

function FacturaPedido({ pedido, onCerrar }) {
  const envio = parseFloat(pedido.envio) || 0;
  return (
    <Modal title="🧾 Factura" onClose={onCerrar}>
      <div id="factura-imprimible">
        <p style={{ color: "#e0e0e0", fontWeight: 700, margin: "0 0 4px", fontSize: 16 }}>{pedido.nombre}</p>
        <p style={{ color: "#888", fontSize: 13, margin: "0 0 2px" }}>📞 {pedido.telefono}</p>
        {pedido.tipoEntrega === "Domicilio" && <p style={{ color: "#888", fontSize: 13, margin: "0 0 2px" }}>📍 {pedido.direccion} {pedido.cp}</p>}
        <p style={{ color: "#888", fontSize: 13, margin: "0 0 12px" }}>📅 {pedido.fecha} · 💳 {pedido.formaPago}</p>

        {pedido.items?.map((it, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #222" }}>
            <span style={{ color: "#e0e0e0", fontSize: 14 }}>{it.cantidad}x {lineaFactura(it)}</span>
            <span style={{ color: "#e0e0e0", fontSize: 14, fontWeight: 600 }}>{(it.subtotal || 0).toFixed(2)}€</span>
          </div>
        ))}

        {envio > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #222" }}>
            <span style={{ color: "#e0e0e0", fontSize: 14 }}>Envío</span>
            <span style={{ color: "#e0e0e0", fontSize: 14, fontWeight: 600 }}>{envio.toFixed(2)}€</span>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0" }}>
          <span style={{ color: "#c8a84b", fontSize: 16, fontWeight: 700 }}>TOTAL</span>
          <span style={{ color: "#c8a84b", fontSize: 16, fontWeight: 700 }}>{(pedido.total || 0).toFixed(2)}€</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
        <Btn variant="secondary" onClick={onCerrar}>Cerrar</Btn>
        <Btn onClick={() => window.print()}>🖨️ Imprimir</Btn>
      </div>
    </Modal>
  );
}

function ModuloPedidos({ pedidos, setPedidos, productos, setProductos, clientes, repartidores }) {
  const [modal, setModal] = useState(false);
  const [editar, setEditar] = useState(null);
  const [facturaPedido, setFacturaPedido] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroFecha, setFiltroFecha] = useState("");

  const guardar = (p) => {
    const esNuevo = !editar;
    setPedidos(prev => esNuevo ? [p, ...prev] : prev.map(x => x.id === p.id ? p : x));

    // Descontar stock solo en pedidos nuevos
    if (esNuevo) {
      setProductos(prods => prods.map(prod => ({
        ...prod,
        variantes: prod.variantes.map(v => {
          const itemPedido = p.items.find(it => parseInt(it.productoId) === prod.id && it.presentacion === v.presentacion);
          if (!itemPedido) return v;
          return { ...v, stock: Math.max(0, (v.stock || 0) - itemPedido.cantidad) };
        })
      })));
    }

    setModal(false); setEditar(null);
  };

  const eliminar = (id) => { if (confirm("¿Eliminar pedido?")) setPedidos(p => p.filter(x => x.id !== id)); };

  const cambiarEstado = (id, estado) => setPedidos(p => p.map(x => x.id === id ? { ...x, estado } : x));

  const filtrados = pedidos.filter(p =>
    (filtroEstado === "Todos" || p.estado === filtroEstado) &&
    (!filtroFecha || p.fecha === filtroFecha)
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ color: "#c8a84b", margin: 0 }}>📦 Pedidos</h2>
        <Btn onClick={() => { setEditar(null); setModal(true); }}>+ Nuevo Pedido</Btn>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <select style={{ background: "#1e1e1e", border: "1px solid #333", color: "#e0e0e0", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}
          value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
          {["Todos", ...ESTADOS_PEDIDO].map(e => <option key={e}>{e}</option>)}
        </select>
        <input type="date" style={{ background: "#1e1e1e", border: "1px solid #333", color: "#e0e0e0", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}
          value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} />
        {filtroFecha && <Btn small variant="secondary" onClick={() => setFiltroFecha("")}>✕ Limpiar fecha</Btn>}
      </div>

      {filtrados.length === 0 ? (
        <Card><p style={{ color: "#555", textAlign: "center", margin: 0 }}>No hay pedidos con estos filtros</p></Card>
      ) : filtrados.map(p => (
        <Card key={p.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
            <div>
              <p style={{ color: "#e0e0e0", fontWeight: 700, margin: "0 0 4px" }}>{p.nombre}</p>
              <p style={{ color: "#888", fontSize: 13, margin: "0 0 4px" }}>📞 {p.telefono}</p>
              {p.tipoEntrega === "Domicilio" && <p style={{ color: "#888", fontSize: 13, margin: "0 0 4px" }}>📍 {p.direccion} {p.cp}</p>}
              <p style={{ color: "#888", fontSize: 13, margin: "0 0 4px" }}>📅 {p.fecha} {p.rangoHorario && `· ⏰ ${p.rangoHorario}`}</p>
              <p style={{ color: "#888", fontSize: 13, margin: "0 0 6px" }}>💳 {p.formaPago} · {p.tipoEntrega}</p>
              {p.items?.map((it, i) => (
                <span key={i} style={{ fontSize: 12, background: "#222", borderRadius: 6, padding: "2px 8px", marginRight: 4, color: "#bbb" }}>
                  {it.cantidad}x {it.nombreProducto} {it.presentacion} ({it.estado})
                </span>
              ))}
              {(parseFloat(p.envio) || 0) > 0 && <p style={{ color: "#666", fontSize: 12, margin: "4px 0 0" }}>🚴 Envío: {(parseFloat(p.envio) || 0).toFixed(2)}€</p>}
              <p style={{ color: "#666", fontSize: 12, margin: "4px 0 0" }}>
                🛵 Repartidor: {repartidores.find(r => r.id === p.repartidorId)?.nombre || "Recoger en Tienda"}
              </p>
              {p.total > 0 && <p style={{ color: "#c8a84b", fontWeight: 700, margin: "6px 0 0", fontSize: 15 }}>Total: {p.total.toFixed(2)}€</p>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
              <Badge estado={p.estado} />
              <select style={{ background: "#1e1e1e", border: "1px solid #333", color: "#e0e0e0", borderRadius: 6, padding: "4px 8px", fontSize: 12 }}
                value={p.estado} onChange={e => cambiarEstado(p.id, e.target.value)}>
                {ESTADOS_PEDIDO.map(e => <option key={e}>{e}</option>)}
              </select>
              <div style={{ display: "flex", gap: 6 }}>
                <Btn small variant="secondary" onClick={() => { setEditar(p); setModal(true); }}>✏️</Btn>
                <Btn small variant="success" onClick={() => setFacturaPedido(p)}>🧾</Btn>
                <Btn small variant="danger" onClick={() => eliminar(p.id)}>🗑️</Btn>
              </div>
            </div>
          </div>
        </Card>
      ))}

      {(modal || editar) && (
        <FormularioPedido productos={productos} clientes={clientes} repartidores={repartidores}
          onGuardar={guardar} onCerrar={() => { setModal(false); setEditar(null); }}
          pedidoEditar={editar} />
      )}

      {facturaPedido && (
        <FacturaPedido pedido={facturaPedido} onCerrar={() => setFacturaPedido(null)} />
      )}
    </div>
  );
}

// ─── MÓDULO: CALENDARIO ──────────────────────────────────────────────────────
function ModuloCalendario({ pedidos, setPedidos }) {
  const [mesActual, setMesActual] = useState(new Date());

  const año = mesActual.getFullYear();
  const mes = mesActual.getMonth();
  const primerDia = new Date(año, mes, 1).getDay();
  const diasEnMes = new Date(año, mes + 1, 0).getDate();
  const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  const pedidosPorDia = (dia) => {
    const fecha = `${año}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    return pedidos.filter(p => p.fecha === fecha);
  };

  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const pedidosDia = diaSeleccionado ? pedidosPorDia(diaSeleccionado) : [];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ color: "#c8a84b", margin: 0 }}>📅 Calendario</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn small variant="secondary" onClick={() => setMesActual(new Date(año, mes - 1, 1))}>‹</Btn>
          <span style={{ color: "#e0e0e0", fontWeight: 600, padding: "6px 12px" }}>{meses[mes]} {año}</span>
          <Btn small variant="secondary" onClick={() => setMesActual(new Date(año, mes + 1, 1))}>›</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 16 }}>
        {diasSemana.map(d => (
          <div key={d} style={{ color: "#666", fontSize: 11, textAlign: "center", fontWeight: 700, padding: "6px 0" }}>{d}</div>
        ))}
        {Array.from({ length: primerDia }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: diasEnMes }).map((_, i) => {
          const dia = i + 1;
          const pp = pedidosPorDia(dia);
          const esHoy = hoy() === `${año}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
          const seleccionado = diaSeleccionado === dia;
          return (
            <div key={dia} onClick={() => setDiaSeleccionado(seleccionado ? null : dia)}
              style={{
                background: seleccionado ? "#c8a84b22" : esHoy ? "#2a2a1a" : "#1a1a1a",
                border: `1px solid ${seleccionado ? "#c8a84b" : esHoy ? "#c8a84b44" : "#2a2a2a"}`,
                borderRadius: 8, padding: "8px 4px", textAlign: "center", cursor: "pointer",
                minHeight: 54, transition: "all .15s"
              }}>
              <div style={{ color: esHoy ? "#c8a84b" : "#e0e0e0", fontSize: 13, fontWeight: esHoy ? 700 : 400 }}>{dia}</div>
              {pp.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  <span style={{ background: "#c8a84b", color: "#1a1a1a", borderRadius: 10, padding: "1px 6px", fontSize: 11, fontWeight: 700 }}>{pp.length}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {diaSeleccionado && (
        <div>
          <p style={{ color: "#888", fontSize: 13, marginBottom: 8 }}>Pedidos para el {diaSeleccionado} de {meses[mes]}</p>
          {pedidosDia.length === 0 ? (
            <Card><p style={{ color: "#555", textAlign: "center", margin: 0 }}>Sin pedidos este día</p></Card>
          ) : pedidosDia.map(p => (
            <Card key={p.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ color: "#e0e0e0", fontWeight: 700, margin: "0 0 4px" }}>{p.nombre}</p>
                  <p style={{ color: "#888", fontSize: 13, margin: 0 }}>⏰ {p.rangoHorario || "Sin horario"} · 💳 {p.formaPago}</p>
                  {p.tipoEntrega === "Domicilio" && <p style={{ color: "#888", fontSize: 13, margin: "2px 0 0" }}>📍 {p.direccion}</p>}
                </div>
                <Badge estado={p.estado} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MÓDULO: RUTAS ───────────────────────────────────────────────────────────
function ModuloRutas({ pedidos }) {
  const [fechaRuta, setFechaRuta] = useState(hoy());

  const pedidosDia = pedidos.filter(p =>
    p.fecha === fechaRuta && p.tipoEntrega === "Domicilio" &&
    p.estado !== "Cancelado" && p.estado !== "Entregado"
  );

  const abrirEnMaps = () => {
    if (pedidosDia.length === 0) return;
    const destinos = pedidosDia.map(p => encodeURIComponent(`${p.direccion} ${p.cp} Madrid`)).join("/");
    window.open(`https://www.google.com/maps/dir/${destinos}`, "_blank");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ color: "#c8a84b", margin: 0 }}>🗺️ Rutas del Día</h2>
      </div>

      <Input label="Fecha de la ruta" type="date" value={fechaRuta} onChange={e => setFechaRuta(e.target.value)} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Entregas", valor: pedidosDia.length, color: "#c8a84b" },
          { label: "Confirmados", valor: pedidosDia.filter(p => p.estado === "Confirmado").length, color: "#3b82f6" },
          { label: "En ruta", valor: pedidosDia.filter(p => p.estado === "En ruta").length, color: "#8b5cf6" },
        ].map(stat => (
          <Card key={stat.label} style={{ textAlign: "center", padding: 12 }}>
            <p style={{ color: stat.color, fontSize: 24, fontWeight: 700, margin: 0 }}>{stat.valor}</p>
            <p style={{ color: "#666", fontSize: 11, margin: 0 }}>{stat.label}</p>
          </Card>
        ))}
      </div>

      {pedidosDia.length === 0 ? (
        <Card><p style={{ color: "#555", textAlign: "center", margin: 0 }}>Sin entregas a domicilio para esta fecha</p></Card>
      ) : (
        <>
          {pedidosDia.map((p, idx) => (
            <Card key={p.id}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ background: "#c8a84b", color: "#1a1a1a", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{idx + 1}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: "#e0e0e0", fontWeight: 700, margin: "0 0 4px" }}>{p.nombre}</p>
                  <p style={{ color: "#888", fontSize: 13, margin: "0 0 2px" }}>📍 {p.direccion}, {p.cp}</p>
                  <p style={{ color: "#888", fontSize: 13, margin: "0 0 4px" }}>⏰ {p.rangoHorario || "Sin horario"} · 💳 {p.formaPago}</p>
                  {p.items?.map((it, i) => (
                    <span key={i} style={{ fontSize: 11, background: "#222", borderRadius: 6, padding: "2px 6px", marginRight: 4, color: "#bbb" }}>
                      {it.cantidad}x {it.nombreProducto} ({it.estado})
                    </span>
                  ))}
                  {p.total > 0 && <p style={{ color: "#c8a84b", fontWeight: 700, margin: "6px 0 0", fontSize: 14 }}>{p.total.toFixed(2)}€</p>}
                </div>
                <Badge estado={p.estado} />
              </div>
            </Card>
          ))}
          <Btn onClick={abrirEnMaps} style={{ width: "100%", marginTop: 4 }}>
            🗺️ Abrir ruta en Google Maps
          </Btn>
        </>
      )}
    </div>
  );
}

// ─── MÓDULO: CLIENTES ────────────────────────────────────────────────────────
function ModuloClientes({ clientes, setClientes, pedidos }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nombre: "", telefono: "", direccion: "", cp: "" });
  const [buscar, setBuscar] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const guardar = () => {
    if (!form.nombre || !form.telefono) return;
    setClientes(c => [...c, { ...form, id: generarId() }]);
    setForm({ nombre: "", telefono: "", direccion: "", cp: "" });
    setModal(false);
  };

  const buscarDigitos = buscar.replace(/\D/g, "");
  const filtrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(buscar.toLowerCase()) ||
    (buscarDigitos.length > 0 && c.telefono.replace(/\D/g, "").includes(buscarDigitos))
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ color: "#c8a84b", margin: 0 }}>👥 Clientes</h2>
        <Btn onClick={() => setModal(true)}>+ Nuevo Cliente</Btn>
      </div>
      <Input placeholder="🔍 Buscar por nombre o teléfono..." value={buscar} onChange={e => setBuscar(e.target.value)} />

      {filtrados.length === 0 ? (
        <Card><p style={{ color: "#555", textAlign: "center", margin: 0 }}>No hay clientes registrados</p></Card>
      ) : filtrados.map(c => {
        const historial = pedidos.filter(p => p.telefono === c.telefono);
        const totalGastado = historial.reduce((s, p) => s + (p.total || 0), 0);
        return (
          <Card key={c.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ color: "#e0e0e0", fontWeight: 700, margin: "0 0 4px" }}>{c.nombre}</p>
                <p style={{ color: "#888", fontSize: 13, margin: "0 0 2px" }}>📞 {c.telefono}</p>
                {c.direccion && <p style={{ color: "#888", fontSize: 13, margin: "0 0 2px" }}>📍 {c.direccion} {c.cp}</p>}
                <p style={{ color: "#666", fontSize: 12, margin: "4px 0 0" }}>
                  {historial.length} pedido{historial.length !== 1 ? "s" : ""}
                  {totalGastado > 0 && ` · ${totalGastado.toFixed(2)}€ total`}
                </p>
              </div>
              <Btn small variant="danger" onClick={() => setClientes(cl => cl.filter(x => x.id !== c.id))}>🗑️</Btn>
            </div>
          </Card>
        );
      })}

      {modal && (
        <Modal title="Nuevo Cliente" onClose={() => setModal(false)}>
          <Input label="Nombre y Apellido *" value={form.nombre} onChange={e => set("nombre", e.target.value)} />
          <Input label="Teléfono *" value={form.telefono} onChange={e => set("telefono", e.target.value)} />
          <Input label="Dirección" value={form.direccion} onChange={e => set("direccion", e.target.value)} />
          <Input label="Código Postal" value={form.cp} onChange={e => set("cp", e.target.value)} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setModal(false)}>Cancelar</Btn>
            <Btn onClick={guardar}>Guardar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── MÓDULO: INVENTARIO ──────────────────────────────────────────────────────
function ModuloInventario({ productos, setProductos }) {
  const [editandoPrecio, setEditandoPrecio] = useState(null);
  const [editandoStock, setEditandoStock] = useState(null);

  const actualizarPrecio = (prodId, presentacion, precio) => {
    setProductos(ps => ps.map(p => p.id === prodId ? {
      ...p, variantes: p.variantes.map(v => v.presentacion === presentacion ? { ...v, precio: parseFloat(precio) || 0 } : v)
    } : p));
  };

  const actualizarStock = (prodId, presentacion, stock) => {
    setProductos(ps => ps.map(p => p.id === prodId ? {
      ...p, variantes: p.variantes.map(v => v.presentacion === presentacion ? { ...v, stock: parseInt(stock) || 0 } : v)
    } : p));
  };

  const categorias = [...new Set(productos.map(p => p.categoria))];

  return (
    <div>
      <h2 style={{ color: "#c8a84b", marginBottom: 16 }}>📊 Inventario & Precios</h2>
      {categorias.map(cat => (
        <div key={cat} style={{ marginBottom: 20 }}>
          <p style={{ color: "#666", fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>{cat.toUpperCase()}</p>
          {productos.filter(p => p.categoria === cat).map(prod => (
            <Card key={prod.id}>
              <p style={{ color: "#e0e0e0", fontWeight: 600, margin: "0 0 10px" }}>{prod.nombre}</p>
              {prod.variantes.map(v => (
                <div key={v.presentacion} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #222" }}>
                  <span style={{ color: "#888", fontSize: 13 }}>{v.presentacion}</span>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ color: "#555", fontSize: 10, margin: "0 0 2px" }}>STOCK</p>
                      {editandoStock === `${prod.id}-${v.presentacion}` ? (
                        <input type="number" defaultValue={v.stock || 0} style={{ width: 60, background: "#111", border: "1px solid #c8a84b", borderRadius: 6, color: "#e0e0e0", padding: "2px 6px", fontSize: 13 }}
                          onBlur={e => { actualizarStock(prod.id, v.presentacion, e.target.value); setEditandoStock(null); }}
                          autoFocus />
                      ) : (
                        <span style={{ color: (v.stock || 0) < 5 ? "#ef4444" : "#10b981", fontWeight: 700, cursor: "pointer", fontSize: 14 }}
                          onClick={() => setEditandoStock(`${prod.id}-${v.presentacion}`)}>
                          {v.stock || 0}
                        </span>
                      )}
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ color: "#555", fontSize: 10, margin: "0 0 2px" }}>PRECIO/U</p>
                      {editandoPrecio === `${prod.id}-${v.presentacion}` ? (
                        <select defaultValue={v.precio} style={{ width: 76, background: "#111", border: "1px solid #c8a84b", borderRadius: 6, color: "#e0e0e0", padding: "2px 4px", fontSize: 13 }}
                          onChange={e => { actualizarPrecio(prod.id, v.presentacion, e.target.value); setEditandoPrecio(null); }}
                          onBlur={() => setEditandoPrecio(null)}
                          autoFocus>
                          {Array.from({ length: 41 }, (_, n) => (
                            <option key={n} value={n}>{n}€</option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ color: "#c8a84b", fontWeight: 700, cursor: "pointer", fontSize: 14 }}
                          onClick={() => setEditandoPrecio(`${prod.id}-${v.presentacion}`)}>
                          {v.precio > 0 ? `${v.precio.toFixed(2)}€` : "—"}
                        </span>
                      )}
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ color: "#555", fontSize: 10, margin: "0 0 2px" }}>TOTAL</p>
                      <span style={{ color: "#e0e0e0", fontWeight: 700, fontSize: 14 }}>
                        {v.precio > 0 ? `${((v.stock || 0) * v.precio).toFixed(2)}€` : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          ))}
        </div>
      ))}
      <p style={{ color: "#555", fontSize: 12, textAlign: "center" }}>Toca el precio o stock para editarlo directamente</p>
    </div>
  );
}

// ─── MÓDULO: REPARTIDORES ────────────────────────────────────────────────────
const REPARTIDOR_TIENDA_ID = "tienda";
const REPARTIDORES_INICIALES = [
  { id: REPARTIDOR_TIENDA_ID, nombre: "Recoger en Tienda", telefono: "", fijo: true },
];

function ModuloRepartidores({ repartidores, setRepartidores }) {
  const [modal, setModal] = useState(false);
  const [editar, setEditar] = useState(null);
  const vacio = { nombre: "", telefono: "" };
  const [form, setForm] = useState(vacio);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const abrirNuevo = () => { setEditar(null); setForm(vacio); setModal(true); };
  const abrirEditar = (r) => { setEditar(r); setForm(r); setModal(true); };

  const guardar = () => {
    if (!form.nombre) return;
    if (editar) {
      setRepartidores(rs => rs.map(r => r.id === editar.id ? { ...r, ...form } : r));
    } else {
      setRepartidores(rs => [...rs, { ...form, id: generarId() }]);
    }
    setModal(false); setEditar(null); setForm(vacio);
  };

  const eliminar = (id) => { if (confirm("¿Eliminar repartidor?")) setRepartidores(rs => rs.filter(r => r.id !== id)); };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ color: "#c8a84b", margin: 0 }}>🛵 Repartidores</h2>
        <Btn onClick={abrirNuevo}>+ Nuevo Repartidor</Btn>
      </div>

      {repartidores.map(r => (
        <Card key={r.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ color: "#e0e0e0", fontWeight: 700, margin: "0 0 4px" }}>
                {r.fijo ? "🏠" : "🛵"} {r.nombre}
              </p>
              {r.telefono && <p style={{ color: "#888", fontSize: 13, margin: 0 }}>📞 {r.telefono}</p>}
            </div>
            {!r.fijo && (
              <div style={{ display: "flex", gap: 6 }}>
                <Btn small variant="secondary" onClick={() => abrirEditar(r)}>✏️</Btn>
                <Btn small variant="danger" onClick={() => eliminar(r.id)}>🗑️</Btn>
              </div>
            )}
          </div>
        </Card>
      ))}

      {modal && (
        <Modal title={editar ? "Editar Repartidor" : "Nuevo Repartidor"} onClose={() => { setModal(false); setEditar(null); }}>
          <Input label="Nombre *" value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Ej: Juan Pérez" />
          <Input label="Teléfono" value={form.telefono} onChange={e => set("telefono", e.target.value)} placeholder="+34 6XX XXX XXX" />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => { setModal(false); setEditar(null); }}>Cancelar</Btn>
            <Btn onClick={guardar}>Guardar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── MÓDULO: PROVEEDORES ─────────────────────────────────────────────────────
function ModuloProveedores({ proveedores, setProveedores }) {
  const [modal, setModal] = useState(false);
  const [editar, setEditar] = useState(null);
  const [buscar, setBuscar] = useState("");
  const vacio = { nombre: "", telefono: "", email: "", producto: "" };
  const [form, setForm] = useState(vacio);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const abrirNuevo = () => { setEditar(null); setForm(vacio); setModal(true); };
  const abrirEditar = (p) => { setEditar(p); setForm(p); setModal(true); };

  const guardar = () => {
    if (!form.nombre || !form.telefono) return;
    if (editar) {
      setProveedores(ps => ps.map(p => p.id === editar.id ? { ...form, id: editar.id } : p));
    } else {
      setProveedores(ps => [...ps, { ...form, id: generarId() }]);
    }
    setModal(false); setEditar(null); setForm(vacio);
  };

  const eliminar = (id) => { if (confirm("¿Eliminar proveedor?")) setProveedores(ps => ps.filter(p => p.id !== id)); };

  const filtrados = proveedores.filter(p =>
    p.nombre.toLowerCase().includes(buscar.toLowerCase()) ||
    p.producto.toLowerCase().includes(buscar.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ color: "#c8a84b", margin: 0 }}>🚚 Proveedores</h2>
        <Btn onClick={abrirNuevo}>+ Nuevo Proveedor</Btn>
      </div>
      <Input placeholder="🔍 Buscar por nombre o producto..." value={buscar} onChange={e => setBuscar(e.target.value)} />

      {filtrados.length === 0 ? (
        <Card><p style={{ color: "#555", textAlign: "center", margin: 0 }}>No hay proveedores registrados</p></Card>
      ) : filtrados.map(p => (
        <Card key={p.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ color: "#e0e0e0", fontWeight: 700, margin: "0 0 4px" }}>{p.nombre}</p>
              <p style={{ color: "#888", fontSize: 13, margin: "0 0 2px" }}>📞 {p.telefono}</p>
              {p.email && <p style={{ color: "#888", fontSize: 13, margin: "0 0 2px" }}>✉️ {p.email}</p>}
              {p.producto && <p style={{ color: "#666", fontSize: 12, margin: "4px 0 0" }}>📦 Suministra: {p.producto}</p>}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <Btn small variant="secondary" onClick={() => abrirEditar(p)}>✏️</Btn>
              <Btn small variant="danger" onClick={() => eliminar(p.id)}>🗑️</Btn>
            </div>
          </div>
        </Card>
      ))}

      {modal && (
        <Modal title={editar ? "Editar Proveedor" : "Nuevo Proveedor"} onClose={() => { setModal(false); setEditar(null); }}>
          <Input label="Nombre *" value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Ej: Distribuidora Hojaldre SL" />
          <Input label="Teléfono *" value={form.telefono} onChange={e => set("telefono", e.target.value)} placeholder="+34 6XX XXX XXX" />
          <Input label="Email" type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="contacto@proveedor.com" />
          <Input label="Producto que suministra" value={form.producto} onChange={e => set("producto", e.target.value)} placeholder="Ej: Harina, queso, masa" />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => { setModal(false); setEditar(null); }}>Cancelar</Btn>
            <Btn onClick={guardar}>Guardar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── MÓDULO: COMPRAS / MATERIA PRIMA ─────────────────────────────────────────
const UNIDADES_MATERIA_PRIMA = ["kg", "litros", "unidades"];
const STOCK_MINIMO_DEFECTO = 5;

function FormularioCompra({ proveedores, ingredientes, onGuardar, onCerrar }) {
  const [form, setForm] = useState({
    proveedorId: "", ingredienteNombre: "", unidad: "kg",
    cantidad: 1, precio: 0, fecha: hoy()
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const seleccionarIngrediente = (nombre) => {
    const existente = ingredientes.find(i => i.nombre === nombre);
    setForm(f => ({ ...f, ingredienteNombre: nombre, unidad: existente ? existente.unidad : f.unidad }));
  };

  const guardar = () => {
    if (!form.proveedorId || !form.ingredienteNombre || !form.cantidad) return;
    onGuardar({ ...form, id: generarId(), cantidad: parseFloat(form.cantidad) || 0, precio: parseFloat(form.precio) || 0 });
  };

  return (
    <Modal title="Nueva Compra" onClose={onCerrar}>
      <Select label="Proveedor *"
        options={[{ value: "", label: "— Seleccionar —" }, ...proveedores.map(p => ({ value: p.id, label: p.nombre }))]}
        value={form.proveedorId} onChange={e => set("proveedorId", e.target.value)} />

      <Input label="Ingrediente comprado *" value={form.ingredienteNombre}
        onChange={e => seleccionarIngrediente(e.target.value)}
        placeholder="Ej: Harina, Queso, Masa de hojaldre" list="lista-ingredientes" />
      <datalist id="lista-ingredientes">
        {ingredientes.map(i => <option key={i.id} value={i.nombre} />)}
      </datalist>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Input label="Cantidad *" type="number" min="0" step="0.01" value={form.cantidad} onChange={e => set("cantidad", e.target.value)} />
        <Select label="Unidad" options={UNIDADES_MATERIA_PRIMA} value={form.unidad} onChange={e => set("unidad", e.target.value)} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Input label="Precio pagado (€)" type="number" min="0" step="0.01" value={form.precio} onChange={e => set("precio", e.target.value)} />
        <Input label="Fecha de compra" type="date" value={form.fecha} onChange={e => set("fecha", e.target.value)} />
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn variant="secondary" onClick={onCerrar}>Cancelar</Btn>
        <Btn onClick={guardar}>Registrar Compra</Btn>
      </div>
    </Modal>
  );
}

function ModuloCompras({ compras, setCompras, proveedores, ingredientes, setIngredientes }) {
  const [modal, setModal] = useState(false);
  const [vista, setVista] = useState("stock");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroProveedor, setFiltroProveedor] = useState("");

  const registrarCompra = (compra) => {
    setCompras(cs => [compra, ...cs]);
    setIngredientes(ings => {
      const existente = ings.find(i => i.nombre === compra.ingredienteNombre);
      if (existente) {
        return ings.map(i => i.id === existente.id ? { ...i, stock: (i.stock || 0) + compra.cantidad, unidad: compra.unidad } : i);
      }
      return [...ings, { id: generarId(), nombre: compra.ingredienteNombre, unidad: compra.unidad, stock: compra.cantidad, stockMinimo: STOCK_MINIMO_DEFECTO }];
    });
    setModal(false);
  };

  const eliminarCompra = (id) => { if (confirm("¿Eliminar esta compra del historial?")) setCompras(cs => cs.filter(c => c.id !== id)); };

  const nombreProveedor = (id) => proveedores.find(p => p.id === id)?.nombre || "—";

  const comprasFiltradas = compras.filter(c =>
    (!filtroFecha || c.fecha === filtroFecha) &&
    (!filtroProveedor || c.proveedorId === filtroProveedor)
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ color: "#c8a84b", margin: 0 }}>🧺 Compras / Materia Prima</h2>
        <Btn onClick={() => setModal(true)}>+ Nueva Compra</Btn>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <Btn small variant={vista === "stock" ? "primary" : "secondary"} onClick={() => setVista("stock")}>Stock actual</Btn>
        <Btn small variant={vista === "historial" ? "primary" : "secondary"} onClick={() => setVista("historial")}>Historial de compras</Btn>
      </div>

      {vista === "stock" && (
        ingredientes.length === 0 ? (
          <Card><p style={{ color: "#555", textAlign: "center", margin: 0 }}>Sin materia prima registrada todavía</p></Card>
        ) : ingredientes.map(i => {
          const bajo = (i.stock || 0) < (i.stockMinimo ?? STOCK_MINIMO_DEFECTO);
          return (
            <Card key={i.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ color: "#e0e0e0", fontWeight: 700, margin: "0 0 4px" }}>{i.nombre}</p>
                  {bajo && <span style={{ color: "#ef4444", fontSize: 12, fontWeight: 600 }}>⚠️ Stock bajo</span>}
                </div>
                <p style={{ color: bajo ? "#ef4444" : "#10b981", fontWeight: 700, fontSize: 18, margin: 0 }}>
                  {i.stock} {i.unidad}
                </p>
              </div>
            </Card>
          );
        })
      )}

      {vista === "historial" && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <input type="date" style={{ background: "#1e1e1e", border: "1px solid #333", color: "#e0e0e0", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}
              value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} />
            <select style={{ background: "#1e1e1e", border: "1px solid #333", color: "#e0e0e0", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}
              value={filtroProveedor} onChange={e => setFiltroProveedor(e.target.value)}>
              <option value="">Todos los proveedores</option>
              {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            {(filtroFecha || filtroProveedor) && (
              <Btn small variant="secondary" onClick={() => { setFiltroFecha(""); setFiltroProveedor(""); }}>✕ Limpiar filtros</Btn>
            )}
          </div>

          {comprasFiltradas.length === 0 ? (
            <Card><p style={{ color: "#555", textAlign: "center", margin: 0 }}>Sin compras con estos filtros</p></Card>
          ) : comprasFiltradas.map(c => (
            <Card key={c.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ color: "#e0e0e0", fontWeight: 700, margin: "0 0 4px" }}>{c.ingredienteNombre}</p>
                  <p style={{ color: "#888", fontSize: 13, margin: "0 0 2px" }}>🚚 {nombreProveedor(c.proveedorId)}</p>
                  <p style={{ color: "#888", fontSize: 13, margin: "0 0 2px" }}>📅 {c.fecha}</p>
                  <p style={{ color: "#888", fontSize: 13, margin: 0 }}>{c.cantidad} {c.unidad}{c.precio > 0 && ` · ${c.precio.toFixed(2)}€`}</p>
                </div>
                <Btn small variant="danger" onClick={() => eliminarCompra(c.id)}>🗑️</Btn>
              </div>
            </Card>
          ))}
        </>
      )}

      {modal && (
        <FormularioCompra proveedores={proveedores} ingredientes={ingredientes}
          onGuardar={registrarCompra} onCerrar={() => setModal(false)} />
      )}
    </div>
  );
}

// ─── MÓDULO: GASTOS (no relacionados a producción) ──────────────────────────
const CATEGORIAS_GASTO = ["Limpieza", "Servicios", "Transporte", "Alquiler", "Otros"];

function ModuloGastos({ gastos, setGastos }) {
  const [modal, setModal] = useState(false);
  const [editar, setEditar] = useState(null);
  const vacio = { concepto: "", categoria: "Limpieza", monto: 0, fecha: hoy() };
  const [form, setForm] = useState(vacio);
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const abrirNuevo = () => { setEditar(null); setForm(vacio); setModal(true); };
  const abrirEditar = (g) => { setEditar(g); setForm(g); setModal(true); };

  const guardar = () => {
    if (!form.concepto || !form.monto) return;
    const datos = { ...form, monto: parseFloat(form.monto) || 0 };
    if (editar) {
      setGastos(gs => gs.map(g => g.id === editar.id ? { ...datos, id: editar.id } : g));
    } else {
      setGastos(gs => [{ ...datos, id: generarId() }, ...gs]);
    }
    setModal(false); setEditar(null); setForm(vacio);
  };

  const eliminar = (id) => { if (confirm("¿Eliminar gasto?")) setGastos(gs => gs.filter(g => g.id !== id)); };

  const filtrados = gastos.filter(g =>
    (!filtroFecha || g.fecha === filtroFecha) &&
    (filtroCategoria === "Todas" || g.categoria === filtroCategoria)
  );

  const totalFiltrado = filtrados.reduce((s, g) => s + (g.monto || 0), 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ color: "#c8a84b", margin: 0 }}>🧹 Gastos</h2>
        <Btn onClick={abrirNuevo}>+ Nuevo Gasto</Btn>
      </div>
      <p style={{ color: "#555", fontSize: 12, marginTop: -8, marginBottom: 16 }}>
        Productos de limpieza u otros gastos no relacionados a la producción
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <select style={{ background: "#1e1e1e", border: "1px solid #333", color: "#e0e0e0", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}
          value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
          {["Todas", ...CATEGORIAS_GASTO].map(c => <option key={c}>{c}</option>)}
        </select>
        <input type="date" style={{ background: "#1e1e1e", border: "1px solid #333", color: "#e0e0e0", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}
          value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} />
        {(filtroFecha || filtroCategoria !== "Todas") && (
          <Btn small variant="secondary" onClick={() => { setFiltroFecha(""); setFiltroCategoria("Todas"); }}>✕ Limpiar filtros</Btn>
        )}
      </div>

      {filtrados.length === 0 ? (
        <Card><p style={{ color: "#555", textAlign: "center", margin: 0 }}>Sin gastos registrados con estos filtros</p></Card>
      ) : (
        <>
          {filtrados.map(g => (
            <Card key={g.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ color: "#e0e0e0", fontWeight: 700, margin: "0 0 4px" }}>{g.concepto}</p>
                  <p style={{ color: "#888", fontSize: 13, margin: "0 0 2px" }}>🏷️ {g.categoria}</p>
                  <p style={{ color: "#888", fontSize: 13, margin: 0 }}>📅 {g.fecha}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                  <p style={{ color: "#c8a84b", fontWeight: 700, fontSize: 16, margin: 0 }}>{g.monto.toFixed(2)}€</p>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn small variant="secondary" onClick={() => abrirEditar(g)}>✏️</Btn>
                    <Btn small variant="danger" onClick={() => eliminar(g.id)}>🗑️</Btn>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          <p style={{ color: "#888", textAlign: "right", fontWeight: 700, fontSize: 14 }}>Total: {totalFiltrado.toFixed(2)}€</p>
        </>
      )}

      {modal && (
        <Modal title={editar ? "Editar Gasto" : "Nuevo Gasto"} onClose={() => { setModal(false); setEditar(null); }}>
          <Input label="Concepto *" value={form.concepto} onChange={e => set("concepto", e.target.value)} placeholder="Ej: Detergente, guantes, bolsas" />
          <Select label="Categoría" options={CATEGORIAS_GASTO} value={form.categoria} onChange={e => set("categoria", e.target.value)} />
          <Input label="Monto (€) *" type="number" min="0" step="0.01" value={form.monto} onChange={e => set("monto", e.target.value)} />
          <Input label="Fecha" type="date" value={form.fecha} onChange={e => set("fecha", e.target.value)} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => { setModal(false); setEditar(null); }}>Cancelar</Btn>
            <Btn onClick={guardar}>Guardar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── MÓDULO: REPORTE HACIENDA ────────────────────────────────────────────────
function inicioDeMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
}

function ModuloReporte({ pedidos, compras, gastos }) {
  const [desde, setDesde] = useState(inicioDeMes());
  const [hasta, setHasta] = useState(hoy());

  const enRango = (fecha) => fecha >= desde && fecha <= hasta;

  const pedidosRango = pedidos.filter(p => enRango(p.fecha) && p.estado !== "Cancelado");
  const comprasRango = compras.filter(c => enRango(c.fecha));
  const gastosRango = gastos.filter(g => enRango(g.fecha));

  const ingresos = pedidosRango.reduce((s, p) => s + (p.total || 0), 0);
  const costoMateriaPrima = comprasRango.reduce((s, c) => s + (c.precio || 0), 0);
  const otrosGastos = gastosRango.reduce((s, g) => s + (g.monto || 0), 0);
  const costosTotales = costoMateriaPrima + otrosGastos;
  const beneficio = ingresos - costosTotales;

  const gastosPorCategoria = CATEGORIAS_GASTO.map(cat => ({
    categoria: cat,
    total: gastosRango.filter(g => g.categoria === cat).reduce((s, g) => s + (g.monto || 0), 0)
  })).filter(c => c.total > 0);

  return (
    <div>
      <h2 style={{ color: "#c8a84b", margin: "0 0 16px" }}>📈 Reporte Hacienda</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Input label="Desde" type="date" value={desde} onChange={e => setDesde(e.target.value)} />
        <Input label="Hasta" type="date" value={hasta} onChange={e => setHasta(e.target.value)} />
      </div>

      <div id="reporte-imprimible">
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #222" }}>
            <span style={{ color: "#888", fontSize: 14 }}>Ingresos (ventas)</span>
            <span style={{ color: "#10b981", fontWeight: 700, fontSize: 14 }}>{ingresos.toFixed(2)}€</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #222" }}>
            <span style={{ color: "#888", fontSize: 14 }}>Costo de materia prima</span>
            <span style={{ color: "#ef4444", fontWeight: 700, fontSize: 14 }}>-{costoMateriaPrima.toFixed(2)}€</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #222" }}>
            <span style={{ color: "#888", fontSize: 14 }}>Otros gastos (limpieza, etc.)</span>
            <span style={{ color: "#ef4444", fontWeight: 700, fontSize: 14 }}>-{otrosGastos.toFixed(2)}€</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0" }}>
            <span style={{ color: "#c8a84b", fontWeight: 700, fontSize: 16 }}>BENEFICIO NETO</span>
            <span style={{ color: beneficio >= 0 ? "#c8a84b" : "#ef4444", fontWeight: 700, fontSize: 16 }}>{beneficio.toFixed(2)}€</span>
          </div>
        </Card>

        {gastosPorCategoria.length > 0 && (
          <Card>
            <p style={{ color: "#888", fontSize: 12, fontWeight: 700, margin: "0 0 8px" }}>OTROS GASTOS POR CATEGORÍA</p>
            {gastosPorCategoria.map(c => (
              <div key={c.categoria} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                <span style={{ color: "#e0e0e0", fontSize: 13 }}>{c.categoria}</span>
                <span style={{ color: "#e0e0e0", fontSize: 13 }}>{c.total.toFixed(2)}€</span>
              </div>
            ))}
          </Card>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          <Card style={{ textAlign: "center", padding: 12 }}>
            <p style={{ color: "#666", fontSize: 11, margin: "0 0 4px" }}>PEDIDOS</p>
            <p style={{ color: "#e0e0e0", fontWeight: 700, fontSize: 18, margin: 0 }}>{pedidosRango.length}</p>
          </Card>
          <Card style={{ textAlign: "center", padding: 12 }}>
            <p style={{ color: "#666", fontSize: 11, margin: "0 0 4px" }}>COMPRAS</p>
            <p style={{ color: "#e0e0e0", fontWeight: 700, fontSize: 18, margin: 0 }}>{comprasRango.length}</p>
          </Card>
          <Card style={{ textAlign: "center", padding: 12 }}>
            <p style={{ color: "#666", fontSize: 11, margin: "0 0 4px" }}>GASTOS</p>
            <p style={{ color: "#e0e0e0", fontWeight: 700, fontSize: 18, margin: 0 }}>{gastosRango.length}</p>
          </Card>
        </div>
      </div>

      <Btn onClick={() => window.print()} style={{ width: "100%", marginTop: 4 }}>🖨️ Imprimir / Exportar PDF</Btn>
    </div>
  );
}

// ─── VISTA REPARTIDOR ────────────────────────────────────────────────────────
const ESTADOS_REPARTO = ["Pendiente", "Confirmado", "En ruta", "Entregado", "Cancelado"];

function VistaRepartidor({ repartidores, pedidos, setPedidos, onSalir }) {
  const [seleccionado, setSeleccionado] = useState(null);
  const [telefono, setTelefono] = useState("");
  const [repartidor, setRepartidor] = useState(null);
  const [error, setError] = useState("");

  const repartidoresActivos = repartidores.filter(r => !r.fijo && r.nombre);

  const login = () => {
    const telDigitos = telefono.replace(/\D/g, "");
    const repDigitos = seleccionado?.telefono?.replace(/\D/g, "") || "";
    if (telDigitos && repDigitos && telDigitos === repDigitos) {
      setRepartidor(seleccionado); setError("");
    } else {
      setError("Número incorrecto");
    }
  };

  const actualizarPedido = (pedidoId, cambios) => {
    setPedidos(ps => ps.map(p => p.id === pedidoId ? { ...p, ...cambios } : p));
  };

  const misPedidos = repartidor
    ? pedidos.filter(p => p.repartidorId === repartidor.id && p.estado !== "Cancelado")
    : [];

  const s = {
    page: { minHeight: "100vh", background: "#0f0f0f", fontFamily: "'Inter',sans-serif", color: "#e0e0e0", padding: 0 },
    header: { background: "#1a1a1a", borderBottom: "1px solid #2a2a2a", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
    card: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: 16, marginBottom: 12 },
    label: { color: "#888", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 },
    select: { width: "100%", background: "#111", border: "1px solid #333", borderRadius: 8, color: "#e0e0e0", padding: "10px 12px", fontSize: 14, outline: "none", marginTop: 4 },
  };

  if (!repartidor) {
    return (
      <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 360, padding: 24 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <p style={{ fontSize: 48, margin: 0 }}>🛵</p>
            <h1 style={{ color: "#c8a84b", fontSize: 22, margin: "8px 0 4px" }}>ELNISONG</h1>
            <p style={{ color: "#555", fontSize: 13, margin: 0 }}>Acceso Repartidor</p>
          </div>

          {/* Paso 1: seleccionar nombre */}
          <p style={{ color: "#888", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 10px" }}>
            {seleccionado ? "Repartidor seleccionado" : "¿Quién eres?"}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {repartidoresActivos.map(r => (
              <button key={r.id} onClick={() => { setSeleccionado(r); setTelefono(""); setError(""); }}
                style={{
                  background: seleccionado?.id === r.id ? "#c8a84b" : "#1a1a1a",
                  color: seleccionado?.id === r.id ? "#0f0f0f" : "#e0e0e0",
                  border: seleccionado?.id === r.id ? "1px solid #c8a84b" : "1px solid #2a2a2a",
                  borderRadius: 12, padding: "14px 18px", fontSize: 16, fontWeight: 700,
                  cursor: "pointer", textAlign: "left"
                }}>
                🛵 {r.nombre}
              </button>
            ))}
          </div>

          {/* Paso 2: confirmar con teléfono */}
          {seleccionado && (
            <>
              <p style={{ color: "#888", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 8px" }}>
                Confirma tu número de móvil
              </p>
              <input
                type="tel" inputMode="numeric"
                value={telefono} onChange={e => { setTelefono(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && login()}
                placeholder="Ej: +34 611 222 333"
                style={{ ...s.select, fontSize: 16, marginBottom: 12 }}
              />
              {error && <p style={{ color: "#ef4444", fontSize: 13, textAlign: "center", margin: "0 0 10px" }}>{error}</p>}
              <button onClick={login} style={{ width: "100%", background: "#c8a84b", color: "#0f0f0f", border: "none", borderRadius: 10, padding: "14px", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
                Entrar
              </button>
            </>
          )}

          <button onClick={onSalir} style={{ width: "100%", background: "none", border: "none", color: "#444", fontSize: 13, marginTop: 16, cursor: "pointer" }}>
            ← Panel principal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>🛵 {repartidor.nombre}</p>
          <p style={{ margin: 0, color: "#555", fontSize: 12 }}>{misPedidos.length} pedido{misPedidos.length !== 1 ? "s" : ""} asignado{misPedidos.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setRepartidor(null)} style={{ background: "#2a2a2a", border: "1px solid #333", color: "#888", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13 }}>
          Cerrar sesión
        </button>
      </div>

      <div style={{ padding: 16 }}>
        {misPedidos.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#555" }}>
            <p style={{ fontSize: 40 }}>📭</p>
            <p>No tienes pedidos asignados</p>
          </div>
        ) : misPedidos.map(p => (
          <div key={p.id} style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{p.nombre}</p>
                <p style={{ margin: "2px 0 0", color: "#888", fontSize: 13 }}>📞 {p.telefono}</p>
                {p.direccion && <p style={{ margin: "2px 0 0", color: "#888", fontSize: 13 }}>📍 {p.direccion}{p.cp ? `, ${p.cp}` : ""}</p>}
                <p style={{ margin: "4px 0 0", color: "#555", fontSize: 12 }}>📅 {p.fecha}{p.rangoHorario ? ` · ${p.rangoHorario}` : ""}</p>
              </div>
              <span style={{
                background: ESTADO_COLORS[p.estado] + "22", color: ESTADO_COLORS[p.estado],
                border: `1px solid ${ESTADO_COLORS[p.estado]}44`, borderRadius: 20,
                padding: "3px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap"
              }}>{p.estado}</span>
            </div>

            <div style={{ background: "#111", borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
              {p.items?.map((it, i) => (
                <p key={i} style={{ margin: "2px 0", fontSize: 13, color: "#ccc" }}>
                  {it.cantidad}× {it.nombreProducto} ({it.presentacion}) — {it.precio?.toFixed(2)}€
                </p>
              ))}
              {p.envio > 0 && <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>🚚 Envío: {parseFloat(p.envio).toFixed(2)}€</p>}
              <p style={{ margin: "6px 0 0", fontWeight: 700, color: "#c8a84b", fontSize: 15 }}>
                Total: {(p.items?.reduce((s, i) => s + (i.subtotal || 0), 0) + (parseFloat(p.envio) || 0)).toFixed(2)}€
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <label style={s.label}>Estado del reparto</label>
                <select style={s.select} value={p.estado}
                  onChange={e => actualizarPedido(p.id, { estado: e.target.value })}>
                  {ESTADOS_REPARTO.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Forma de pago</label>
                <select style={s.select} value={p.formaPago}
                  onChange={e => actualizarPedido(p.id, { formaPago: e.target.value })}>
                  {FORMAS_PAGO.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── HELPERS CARGA ───────────────────────────────────────────────────────────
function cargarLS(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}

// ─── APP PRINCIPAL ───────────────────────────────────────────────────────────
export default function App() {
  const [modoRepartidor, setModoRepartidor] = useState(false);
  const [tab, setTab] = useState("pedidos");
  const [pedidos, setPedidos] = useState(() => cargarLS("pedidos", []));
  const [clientes, setClientes] = useState(() => {
    const g = cargarLS("clientes", []);
    return g.length > 0 ? g : CLIENTES_INICIALES;
  });
  const [productos, setProductos] = useState(() => {
    const g = cargarLS("productos", []);
    if (g.length === 0) return PRODUCTOS_INICIALES;
    return g.map(p => ({ ...p, variantes: p.variantes.map(v => ({ ...v, stock: v.stock === undefined ? 10 : v.stock })) }));
  });
  const [proveedores, setProveedores] = useState(() => cargarLS("proveedores", []));
  const [compras, setCompras] = useState(() => cargarLS("compras", []));
  const [ingredientes, setIngredientes] = useState(() => cargarLS("ingredientes", []));
  const [gastos, setGastos] = useState(() => cargarLS("gastos", []));
  const [repartidores, setRepartidores] = useState(() => {
    const g = cargarLS("repartidores", null);
    if (!g) return REPARTIDORES_INICIALES;
    const tieneFijo = g.some(r => r.id === REPARTIDOR_TIENDA_ID);
    return tieneFijo ? g : [...REPARTIDORES_INICIALES, ...g];
  });

  const [listo, setListo] = useState(false);

  // Guardar en localStorage Y Firebase
  const sync = (key, data) => {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
    setDoc(doc(db, "datos", key), { valor: JSON.stringify(data) }).catch(() => {});
  };

  useEffect(() => { if (listo) sync("pedidos", pedidos); }, [JSON.stringify(pedidos)]);
  useEffect(() => { if (listo) sync("clientes", clientes); }, [JSON.stringify(clientes)]);
  useEffect(() => { if (listo) sync("productos", productos); }, [JSON.stringify(productos)]);
  useEffect(() => { if (listo) sync("proveedores", proveedores); }, [JSON.stringify(proveedores)]);
  useEffect(() => { if (listo) sync("compras", compras); }, [JSON.stringify(compras)]);
  useEffect(() => { if (listo) sync("ingredientes", ingredientes); }, [JSON.stringify(ingredientes)]);
  useEffect(() => { if (listo) sync("gastos", gastos); }, [JSON.stringify(gastos)]);
  useEffect(() => { if (listo) sync("repartidores", repartidores); }, [JSON.stringify(repartidores)]);

  // Escuchar cambios de pedidos desde Firebase (para ver updates de repartidores en tiempo real)
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "datos", "pedidos"), (snap) => {
      if (snap.exists()) {
        const data = JSON.parse(snap.data().valor);
        setPedidos(data);
        try { localStorage.setItem("pedidos", JSON.stringify(data)); } catch {}
      }
      setListo(true);
    }, () => setListo(true));
    return () => unsub();
  }, []);

  const tabs = [
    { id: "pedidos", label: "📦 Pedidos" },
    { id: "calendario", label: "📅 Calendario" },
    { id: "rutas", label: "🗺️ Rutas" },
    { id: "clientes", label: "👥 Clientes" },
    { id: "inventario", label: "📊 Inventario" },
    { id: "proveedores", label: "🚚 Proveedores" },
    { id: "compras", label: "🧺 Compras" },
    { id: "gastos", label: "🧹 Gastos" },
    { id: "reporte", label: "📈 Reporte" },
    { id: "repartidores", label: "🛵 Repartidores" },
  ];

  const pendientes = pedidos.filter(p => p.estado === "Pendiente").length;
  const hoyEntregas = pedidos.filter(p => p.fecha === hoy() && p.estado !== "Cancelado").length;

  if (modoRepartidor) {
    return <VistaRepartidor repartidores={repartidores} pedidos={pedidos} setPedidos={setPedidos} onSalir={() => setModoRepartidor(false)} />;
  }

  return (
    <div style={{ background: "#0f0f0f", minHeight: "100vh", fontFamily: "'Inter', sans-serif", color: "#e0e0e0" }}>
      {/* Header */}
      <div style={{ background: "#141414", borderBottom: "1px solid #2a2a2a", padding: "14px 20px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ color: "#c8a84b", margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>🫓 ELNISONG</h1>
            <p style={{ color: "#555", fontSize: 11, margin: 0 }}>Gestión de Pedidos</p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {pendientes > 0 && <div style={{ textAlign: "center" }}>
              <p style={{ color: "#f59e0b", fontWeight: 700, fontSize: 18, margin: 0 }}>{pendientes}</p>
              <p style={{ color: "#666", fontSize: 10, margin: 0 }}>Pendientes</p>
            </div>}
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "#c8a84b", fontWeight: 700, fontSize: 18, margin: 0 }}>{hoyEntregas}</p>
              <p style={{ color: "#666", fontSize: 10, margin: 0 }}>Hoy</p>
            </div>
            <button onClick={() => setModoRepartidor(true)} style={{ background: "#1a1a1a", border: "1px solid #333", color: "#c8a84b", borderRadius: 8, padding: "8px 12px", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
              🛵 Repartidor
            </button>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ background: "#141414", borderBottom: "1px solid #2a2a2a", overflowX: "auto" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", display: "flex" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: "none", border: "none", cursor: "pointer", padding: "12px 16px",
              color: tab === t.id ? "#c8a84b" : "#555", fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
              borderBottom: `2px solid ${tab === t.id ? "#c8a84b" : "transparent"}`,
              whiteSpace: "nowrap", transition: "all .15s"
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "20px 16px 100px" }}>
        {tab === "pedidos" && <ModuloPedidos pedidos={pedidos} setPedidos={setPedidos} productos={productos} setProductos={setProductos} clientes={clientes} repartidores={repartidores} />}
        {tab === "calendario" && <ModuloCalendario pedidos={pedidos} setPedidos={setPedidos} />}
        {tab === "rutas" && <ModuloRutas pedidos={pedidos} />}
        {tab === "clientes" && <ModuloClientes clientes={clientes} setClientes={setClientes} pedidos={pedidos} />}
        {tab === "inventario" && <ModuloInventario productos={productos} setProductos={setProductos} />}
        {tab === "proveedores" && <ModuloProveedores proveedores={proveedores} setProveedores={setProveedores} />}
        {tab === "compras" && <ModuloCompras compras={compras} setCompras={setCompras} proveedores={proveedores} ingredientes={ingredientes} setIngredientes={setIngredientes} />}
        {tab === "gastos" && <ModuloGastos gastos={gastos} setGastos={setGastos} />}
        {tab === "reporte" && <ModuloReporte pedidos={pedidos} compras={compras} gastos={gastos} />}
        {tab === "repartidores" && <ModuloRepartidores repartidores={repartidores} setRepartidores={setRepartidores} />}
      </div>
    </div>
  );
}
