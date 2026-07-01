import { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

// ─── DATOS INICIALES (idénticos a App.jsx) ──────────────────────────────────
const PRODUCTOS_INICIALES = [];

const CLIENTES_INICIALES = [];

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
const UNIDADES_MATERIA_PRIMA = ["kg", "litros", "unidades"];
const STOCK_MINIMO_DEFECTO = 5;
const CATEGORIAS_GASTO = ["Limpieza", "Servicios", "Transporte", "Alquiler", "Otros"];
const REPARTIDOR_TIENDA_ID = "tienda";
const REPARTIDORES_INICIALES = [{ id: REPARTIDOR_TIENDA_ID, nombre: "Recoger en Tienda", telefono: "", fijo: true }];

const hoy = () => new Date().toISOString().split("T")[0];
const generarId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const inicioDeMes = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0]; };

// ─── ACENTOS DE COLOR POR SECCIÓN ───────────────────────────────────────────
const ACENTOS = {
  pedidos: "#f59e0b",
  clientes: "#06b6d4",
  inventario: "#c8a84b",
  stock: "#a78bfa",
  produccion: "#34d399",
  proveedores: "#10b981",
  compras: "#ec4899",
  gastos: "#ef4444",
  reporte: "#14b8a6",
  repartidores: "#f97316",
};

// ─── HELPERS STOCK FIFO ──────────────────────────────────────────────────────
function deductFIFO(lotes = [], cantidad) {
  let rem = cantidad;
  const sorted = [...lotes].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const result = [];
  for (const l of sorted) {
    if (rem <= 0) { result.push(l); continue; }
    if (l.cantidad <= rem) { rem -= l.cantidad; }
    else { result.push({ ...l, cantidad: l.cantidad - rem }); rem = 0; }
  }
  return result;
}
function stockTotal(lotes = []) {
  return lotes.reduce((s, l) => s + (l.cantidad || 0), 0);
}

// ─── COMPONENTES UI BASE ─────────────────────────────────────────────────────
const Badge = ({ estado }) => (
  <span style={{
    background: ESTADO_COLORS[estado] + "22", color: ESTADO_COLORS[estado],
    border: `1px solid ${ESTADO_COLORS[estado]}55`, borderRadius: 20, padding: "3px 12px",
    fontSize: 12, fontWeight: 700
  }}>{estado}</span>
);

const Btn = ({ children, onClick, variant = "primary", small, accent, style = {} }) => {
  const base = {
    border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 700,
    padding: small ? "8px 14px" : "12px 20px", fontSize: small ? 13 : 15,
    transition: "transform .12s, opacity .12s", ...style
  };
  const ac = accent || "#c8a84b";
  const variants = {
    primary: { background: ac, color: "#0f0f0f", boxShadow: `0 4px 14px ${ac}33` },
    secondary: { background: "#20212a", color: "#e6e6e6", border: "1px solid #33343f" },
    danger: { background: "#ef444422", color: "#ef4444", border: "1px solid #ef444455" },
    success: { background: "#10b98122", color: "#10b981", border: "1px solid #10b98155" },
    ghost: { background: "transparent", color: ac, border: `1px solid ${ac}55` },
  };
  return (
    <button
      onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"}
      onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
      style={{ ...base, ...variants[variant] }} onClick={onClick}>{children}</button>
  );
};

// Grupo de botones tipo "chip" para reemplazar <select> en opciones cortas
const Chips = ({ label, options, value, onChange, accent = "#c8a84b" }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: "block", color: "#8a8a93", fontSize: 12, marginBottom: 6, fontWeight: 600 }}>{label}</label>}
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {options.map(o => {
        const val = o.value ?? o;
        const lbl = o.label ?? o;
        const activo = val === value;
        return (
          <button key={val} type="button" onClick={() => onChange(val)} style={{
            border: activo ? `1px solid ${accent}` : "1px solid #2d2e38",
            background: activo ? accent : "#1b1c24",
            color: activo ? "#0f0f0f" : "#c9c9d1",
            borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700,
            cursor: "pointer", transition: "all .15s"
          }}>{lbl}</button>
        );
      })}
    </div>
  </div>
);

const Input = ({ label, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: "block", color: "#8a8a93", fontSize: 12, marginBottom: 6, fontWeight: 600 }}>{label}</label>}
    <input style={{
      width: "100%", background: "#1b1c24", border: "1px solid #2d2e38", borderRadius: 10,
      color: "#e6e6e6", padding: "11px 14px", fontSize: 14, boxSizing: "border-box", outline: "none"
    }} {...props} />
  </div>
);

const Select = ({ label, options, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: "block", color: "#8a8a93", fontSize: 12, marginBottom: 6, fontWeight: 600 }}>{label}</label>}
    <select style={{
      width: "100%", background: "#1b1c24", border: "1px solid #2d2e38", borderRadius: 10,
      color: "#e6e6e6", padding: "11px 14px", fontSize: 14, boxSizing: "border-box", outline: "none"
    }} {...props}>
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  </div>
);

const Card = ({ children, accent, style = {} }) => (
  <div style={{
    background: "linear-gradient(180deg, #181922 0%, #15161d 100%)",
    border: "1px solid #25262f", borderLeft: accent ? `3px solid ${accent}` : "1px solid #25262f",
    borderRadius: 14, padding: 16, marginBottom: 12, ...style
  }}>{children}</div>
);

const Modal = ({ title, accent = "#c8a84b", onClose, children }) => (
  <div style={{
    position: "fixed", inset: 0, background: "#000c", zIndex: 1000,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16
  }}>
    <div style={{
      background: "#141319", border: `1px solid ${accent}33`, borderRadius: 18,
      width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", padding: 24,
      boxShadow: `0 20px 60px ${accent}22`
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ color: accent, margin: 0, fontSize: 19, fontWeight: 800 }}>{title}</h2>
        <button onClick={onClose} style={{ background: "#1f2028", border: "none", color: "#999", fontSize: 18, cursor: "pointer", borderRadius: 8, width: 32, height: 32 }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

const Empty = ({ texto }) => (
  <Card><p style={{ color: "#555", textAlign: "center", margin: 0 }}>{texto}</p></Card>
);

// ─── MÓDULO: PEDIDOS ────────────────────────────────────────────────────────
function FormularioPedido({ productos, clientes, repartidores, onGuardar, onCerrar, pedidoEditar }) {
  const ac = ACENTOS.pedidos;
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
      ...f, items: [...f.items, { ...item, id: generarId(), nombreProducto: prod.nombre, precio: precioFinal, subtotal: precioFinal * item.cantidad }]
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
    <Modal title={pedidoEditar ? "Editar Pedido" : "Nuevo Pedido"} accent={ac} onClose={onCerrar}>
      <Select label="Cliente registrado (opcional)"
        options={[{ value: "", label: "— Seleccionar cliente —" }, ...clientes.map(c => ({ value: c.id, label: `${c.nombre} · ${c.telefono}` }))]}
        value={form.clienteId} onChange={e => selCliente(e.target.value)} />
      <Input label="Nombre y Apellido *" value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Ej: María González" />
      <Input label="Teléfono *" value={form.telefono} onChange={e => set("telefono", e.target.value)} placeholder="+34 6XX XXX XXX" />
      <Input label="Dirección *" value={form.direccion} onChange={e => set("direccion", e.target.value)} placeholder="Calle, número, piso" />
      <Input label="Código Postal *" value={form.cp} onChange={e => set("cp", e.target.value)} placeholder="28XXX" />
      <Chips label="Tipo de entrega" accent={ac} options={["Domicilio", "Recogida"]} value={form.tipoEntrega} onChange={v => cambiarTipoEntrega(v)} />
      <Chips label="Forma de pago" accent={ac} options={FORMAS_PAGO} value={form.formaPago} onChange={v => set("formaPago", v)} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Input label="Fecha de entrega" type="date" value={form.fecha} onChange={e => set("fecha", e.target.value)} />
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", color: "#888", fontSize: 12, marginBottom: 4 }}>Rango horario</label>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <select style={{ flex: 1, background: "#1b1c24", border: "1px solid #2d2e38", borderRadius: 10, color: "#c9c9d1", padding: "9px 8px", fontSize: 13, outline: "none" }}
              value={form.rangoHorario?.split(" a ")[0] || ""}
              onChange={e => { const fin = form.rangoHorario?.split(" a ")[1] || ""; set("rangoHorario", e.target.value + " a " + fin); }}>
              <option value="">--</option>
              {HORAS_RANGO.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <span style={{ color: "#888", fontSize: 13, whiteSpace: "nowrap" }}>a</span>
            <select style={{ flex: 1, background: "#1b1c24", border: "1px solid #2d2e38", borderRadius: 10, color: "#c9c9d1", padding: "9px 8px", fontSize: 13, outline: "none" }}
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
      <Chips label="Repartidor" accent={ac} options={repartidoresFiltrados.map(r => ({ value: r.id, label: r.nombre }))}
        value={form.repartidorId} onChange={v => set("repartidorId", v)} />

      <div style={{ background: "#101015", borderRadius: 14, padding: 14, marginBottom: 14, border: `1px solid ${ac}22` }}>
        <p style={{ color: ac, fontSize: 13, fontWeight: 800, margin: "0 0 10px" }}>➕ Agregar producto</p>
        <Select label="Producto" options={[{ value: "", label: "— Seleccionar —" }, ...productos.map(p => ({ value: p.id, label: p.nombre }))]}
          value={item.productoId} onChange={e => setItem(i => ({ ...i, productoId: e.target.value }))} />
        <Chips label="Presentación" accent={ac} options={["Bandeja 25", "Bandeja 50"]} value={item.presentacion} onChange={v => setItem(i => ({ ...i, presentacion: v }))} />
        <Chips label="Estado" accent={ac} options={["Congelado", "Frito"]} value={item.estado} onChange={v => setItem(i => ({ ...i, estado: v }))} />
        <Input label="Cantidad" type="number" min="1" value={item.cantidad} onChange={e => setItem(i => ({ ...i, cantidad: parseInt(e.target.value) || 1 }))} />
        <div style={{ display: "grid", gridTemplateColumns: item.estado === "Frito" ? "1fr 1fr" : "1fr", gap: 8 }}>
          <Input label="Comisión por unidad (€)" type="number" step="0.01" value={item.comision} onChange={e => setItem(i => ({ ...i, comision: e.target.value }))} placeholder="Ej: 2" />
          {item.estado === "Frito" && (
            <Input label="Recargo por Frito (€)" type="number" step="0.01" value={item.recargoFrito} onChange={e => setItem(i => ({ ...i, recargoFrito: e.target.value }))} placeholder="Ej: 5" />
          )}
        </div>
        {item.productoId && (() => {
          const precioUnit = precioFinalItem(item, productos);
          return (
            <p style={{ color: "#9a9aa2", fontSize: 12, margin: "0 0 10px" }}>
              {precioUnit > 0
                ? `Precio unitario final: ${precioUnit.toFixed(2)}€ · Total: ${(precioUnit * item.cantidad).toFixed(2)}€`
                : "Sin precio asignado para esta presentación (poné el precio en Inventario)"}
            </p>
          );
        })()}
        <Btn onClick={agregarItem} small accent={ac}>Agregar</Btn>
      </div>

      {form.items.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ color: "#8a8a93", fontSize: 12, marginBottom: 6, fontWeight: 700 }}>PRODUCTOS EN EL PEDIDO</p>
          {form.items.map((it, idx) => (
            <div key={it.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #25262f" }}>
              <div>
                <span style={{ color: "#e6e6e6", fontSize: 13 }}>{it.cantidad}x {it.nombreProducto} · {it.presentacion} · {it.estado}</span>
                <div style={{ color: "#666", fontSize: 12, marginTop: 2 }}>
                  {it.precio > 0 ? `Precio unitario: ${it.precio.toFixed(2)}€` : "Precio unitario: — (sin precio en Inventario)"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ color: ac, fontSize: 14, fontWeight: 800 }}>{it.subtotal > 0 ? `${it.subtotal.toFixed(2)}€` : "—"}</span>
                <button onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))}
                  style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16 }}>✕</button>
              </div>
            </div>
          ))}
          {(parseFloat(form.envio) || 0) > 0 && (
            <p style={{ color: "#8a8a93", fontSize: 13, textAlign: "right", margin: "8px 0 0" }}>
              Subtotal: {subtotalProductos.toFixed(2)}€ + Envío: {(parseFloat(form.envio) || 0).toFixed(2)}€
            </p>
          )}
          {total > 0 && <p style={{ color: ac, fontWeight: 800, textAlign: "right", marginTop: 4, fontSize: 17 }}>Total: {total.toFixed(2)}€</p>}
        </div>
      )}

      <Chips label="Estado del pedido" accent={ESTADO_COLORS[form.estado]} options={ESTADOS_PEDIDO} value={form.estado} onChange={v => set("estado", v)} />
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn variant="secondary" onClick={onCerrar}>Cancelar</Btn>
        <Btn accent={ac} onClick={() => onGuardar({ ...form, id: form.id || generarId(), total })}>Guardar Pedido</Btn>
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
  const ac = ACENTOS.pedidos;
  const envio = parseFloat(pedido.envio) || 0;
  return (
    <Modal title="🧾 Factura" accent={ac} onClose={onCerrar}>
      <div id="factura-imprimible">
        <p style={{ color: "#e6e6e6", fontWeight: 800, margin: "0 0 4px", fontSize: 16 }}>{pedido.nombre}</p>
        <p style={{ color: "#9a9aa2", fontSize: 13, margin: "0 0 2px" }}>📞 {pedido.telefono}</p>
        {pedido.tipoEntrega === "Domicilio" && <p style={{ color: "#9a9aa2", fontSize: 13, margin: "0 0 2px" }}>📍 {pedido.direccion} {pedido.cp}</p>}
        <p style={{ color: "#9a9aa2", fontSize: 13, margin: "0 0 12px" }}>📅 {pedido.fecha} · 💳 {pedido.formaPago}</p>
        {pedido.items?.map((it, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #25262f" }}>
            <span style={{ color: "#e6e6e6", fontSize: 14 }}>{it.cantidad}x {lineaFactura(it)}</span>
            <span style={{ color: "#e6e6e6", fontSize: 14, fontWeight: 700 }}>{(it.subtotal || 0).toFixed(2)}€</span>
          </div>
        ))}
        {envio > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #25262f" }}>
            <span style={{ color: "#e6e6e6", fontSize: 14 }}>Envío</span>
            <span style={{ color: "#e6e6e6", fontSize: 14, fontWeight: 700 }}>{envio.toFixed(2)}€</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0" }}>
          <span style={{ color: ac, fontSize: 16, fontWeight: 800 }}>TOTAL</span>
          <span style={{ color: ac, fontSize: 16, fontWeight: 800 }}>{(pedido.total || 0).toFixed(2)}€</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
        <Btn variant="secondary" onClick={onCerrar}>Cerrar</Btn>
        <Btn accent={ac} onClick={() => window.print()}>🖨️ Imprimir</Btn>
      </div>
    </Modal>
  );
}

function ModuloPedidos({ pedidos, setPedidos, productos, setProductos, clientes, repartidores }) {
  const ac = ACENTOS.pedidos;
  const [modal, setModal] = useState(false);
  const [editar, setEditar] = useState(null);
  const [facturaPedido, setFacturaPedido] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroFecha, setFiltroFecha] = useState("");

  const guardar = (p) => {
    const esNuevo = !editar;
    setPedidos(prev => esNuevo ? [p, ...prev] : prev.map(x => x.id === p.id ? p : x));
    if (esNuevo) {
      setProductos(prods => prods.map(prod => ({
        ...prod,
        variantes: prod.variantes.map(v => {
          const it = p.items.find(i => parseInt(i.productoId) === prod.id && i.presentacion === v.presentacion);
          if (!it) return v;
          const nuevosLotes = deductFIFO(v.lotes || [], it.cantidad);
          return { ...v, lotes: nuevosLotes, stock: stockTotal(nuevosLotes) };
        })
      })));
    }
    setModal(false); setEditar(null);
  };
  const eliminar = (id) => { if (confirm("¿Eliminar pedido?")) setPedidos(p => p.filter(x => x.id !== id)); };
  const cambiarEstado = (id, estado) => setPedidos(p => p.map(x => x.id === id ? { ...x, estado } : x));

  const filtrados = pedidos.filter(p => (filtroEstado === "Todos" || p.estado === filtroEstado) && (!filtroFecha || p.fecha === filtroFecha));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ color: ac, margin: 0 }}>📦 Pedidos</h2>
        <Btn accent={ac} onClick={() => { setEditar(null); setModal(true); }}>+ Nuevo</Btn>
      </div>

      <Chips accent={ac} options={["Todos", ...ESTADOS_PEDIDO]} value={filtroEstado} onChange={setFiltroEstado} />
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input type="date" style={{ background: "#1b1c24", border: "1px solid #2d2e38", color: "#e6e6e6", borderRadius: 10, padding: "9px 12px", fontSize: 13 }}
          value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} />
        {filtroFecha && <Btn small variant="secondary" onClick={() => setFiltroFecha("")}>✕ Limpiar fecha</Btn>}
      </div>

      {filtrados.length === 0 ? <Empty texto="No hay pedidos con estos filtros" /> : filtrados.map(p => (
        <Card key={p.id} accent={ESTADO_COLORS[p.estado]}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
            <div>
              <p style={{ color: "#e6e6e6", fontWeight: 800, margin: "0 0 4px" }}>{p.nombre}</p>
              <p style={{ color: "#9a9aa2", fontSize: 13, margin: "0 0 4px" }}>📞 {p.telefono}</p>
              {p.tipoEntrega === "Domicilio" && <p style={{ color: "#9a9aa2", fontSize: 13, margin: "0 0 4px" }}>📍 {p.direccion} {p.cp}</p>}
              <p style={{ color: "#9a9aa2", fontSize: 13, margin: "0 0 4px" }}>📅 {p.fecha} {p.rangoHorario && `· ⏰ ${p.rangoHorario}`}</p>
              <p style={{ color: "#9a9aa2", fontSize: 13, margin: "0 0 6px" }}>💳 {p.formaPago} · {p.tipoEntrega}</p>
              {p.items?.map((it, i) => (
                <span key={i} style={{ fontSize: 12, background: "#1f2028", borderRadius: 8, padding: "3px 9px", marginRight: 4, color: "#c9c9d1" }}>
                  {it.cantidad}x {it.nombreProducto} {it.presentacion} ({it.estado})
                </span>
              ))}
              {(parseFloat(p.envio) || 0) > 0 && <p style={{ color: "#666", fontSize: 12, margin: "4px 0 0" }}>🚴 Envío: {(parseFloat(p.envio) || 0).toFixed(2)}€</p>}
              <p style={{ color: "#666", fontSize: 12, margin: "4px 0 0" }}>🛵 {repartidores.find(r => r.id === p.repartidorId)?.nombre || "Recoger en Tienda"}</p>
              {p.total > 0 && <p style={{ color: ac, fontWeight: 800, margin: "6px 0 0", fontSize: 15 }}>Total: {p.total.toFixed(2)}€</p>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
              <Badge estado={p.estado} />
              <div style={{ display: "flex", gap: 6 }}>
                <Btn small variant="secondary" onClick={() => { setEditar(p); setModal(true); }}>✏️</Btn>
                <Btn small variant="success" onClick={() => setFacturaPedido(p)}>🧾</Btn>
                <Btn small variant="danger" onClick={() => eliminar(p.id)}>🗑️</Btn>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #25262f" }}>
            <Chips accent={ESTADO_COLORS[p.estado]} options={ESTADOS_PEDIDO} value={p.estado} onChange={v => cambiarEstado(p.id, v)} />
          </div>
        </Card>
      ))}

      {(modal || editar) && (
        <FormularioPedido productos={productos} clientes={clientes} repartidores={repartidores}
          onGuardar={guardar} onCerrar={() => { setModal(false); setEditar(null); }} pedidoEditar={editar} />
      )}
      {facturaPedido && <FacturaPedido pedido={facturaPedido} onCerrar={() => setFacturaPedido(null)} />}
    </div>
  );
}

// ─── MÓDULO: CALENDARIO ──────────────────────────────────────────────────────
function ModuloCalendario({ pedidos }) {
  const ac = ACENTOS.calendario;
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
        <h2 style={{ color: ac, margin: 0 }}>📅 Calendario</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn small variant="secondary" onClick={() => setMesActual(new Date(año, mes - 1, 1))}>‹</Btn>
          <span style={{ color: "#e6e6e6", fontWeight: 700, padding: "6px 12px" }}>{meses[mes]} {año}</span>
          <Btn small variant="secondary" onClick={() => setMesActual(new Date(año, mes + 1, 1))}>›</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 16 }}>
        {diasSemana.map(d => <div key={d} style={{ color: "#666", fontSize: 11, textAlign: "center", fontWeight: 700, padding: "6px 0" }}>{d}</div>)}
        {Array.from({ length: primerDia }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: diasEnMes }).map((_, i) => {
          const dia = i + 1;
          const pp = pedidosPorDia(dia);
          const esHoy = hoy() === `${año}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
          const seleccionado = diaSeleccionado === dia;
          return (
            <div key={dia} onClick={() => setDiaSeleccionado(seleccionado ? null : dia)}
              style={{
                background: seleccionado ? ac + "33" : esHoy ? ac + "18" : "#181922",
                border: `1px solid ${seleccionado ? ac : esHoy ? ac + "55" : "#25262f"}`,
                borderRadius: 10, padding: "8px 4px", textAlign: "center", cursor: "pointer", minHeight: 54, transition: "all .15s"
              }}>
              <div style={{ color: esHoy ? ac : "#e6e6e6", fontSize: 13, fontWeight: esHoy ? 800 : 400 }}>{dia}</div>
              {pp.length > 0 && (
                <span style={{ background: ac, color: "#0f0f0f", borderRadius: 10, padding: "1px 6px", fontSize: 11, fontWeight: 800 }}>{pp.length}</span>
              )}
            </div>
          );
        })}
      </div>

      {diaSeleccionado && (
        <div>
          <p style={{ color: "#9a9aa2", fontSize: 13, marginBottom: 8 }}>Pedidos para el {diaSeleccionado} de {meses[mes]}</p>
          {pedidosDia.length === 0 ? <Empty texto="Sin pedidos este día" /> : pedidosDia.map(p => (
            <Card key={p.id} accent={ESTADO_COLORS[p.estado]}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ color: "#e6e6e6", fontWeight: 800, margin: "0 0 4px" }}>{p.nombre}</p>
                  <p style={{ color: "#9a9aa2", fontSize: 13, margin: 0 }}>⏰ {p.rangoHorario || "Sin horario"} · 💳 {p.formaPago}</p>
                  {p.tipoEntrega === "Domicilio" && <p style={{ color: "#9a9aa2", fontSize: 13, margin: "2px 0 0" }}>📍 {p.direccion}</p>}
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
  const ac = ACENTOS.rutas;
  const [fechaRuta, setFechaRuta] = useState(hoy());
  const pedidosDia = pedidos.filter(p => p.fecha === fechaRuta && p.tipoEntrega === "Domicilio" && p.estado !== "Cancelado" && p.estado !== "Entregado");

  const abrirEnMaps = () => {
    if (pedidosDia.length === 0) return;
    const destinos = pedidosDia.map(p => encodeURIComponent(`${p.direccion} ${p.cp} Madrid`)).join("/");
    window.open(`https://www.google.com/maps/dir/${destinos}`, "_blank");
  };

  return (
    <div>
      <h2 style={{ color: ac, margin: "0 0 16px" }}>🗺️ Rutas del Día</h2>
      <Input label="Fecha de la ruta" type="date" value={fechaRuta} onChange={e => setFechaRuta(e.target.value)} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Entregas", valor: pedidosDia.length, color: ac },
          { label: "Confirmados", valor: pedidosDia.filter(p => p.estado === "Confirmado").length, color: "#3b82f6" },
          { label: "En ruta", valor: pedidosDia.filter(p => p.estado === "En ruta").length, color: "#8b5cf6" },
        ].map(stat => (
          <Card key={stat.label} accent={stat.color} style={{ textAlign: "center", padding: 14 }}>
            <p style={{ color: stat.color, fontSize: 26, fontWeight: 800, margin: 0 }}>{stat.valor}</p>
            <p style={{ color: "#666", fontSize: 11, margin: 0 }}>{stat.label}</p>
          </Card>
        ))}
      </div>

      {pedidosDia.length === 0 ? <Empty texto="Sin entregas a domicilio para esta fecha" /> : (
        <>
          {pedidosDia.map((p, idx) => (
            <Card key={p.id} accent={ac}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ background: ac, color: "#0f0f0f", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{idx + 1}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: "#e6e6e6", fontWeight: 800, margin: "0 0 4px" }}>{p.nombre}</p>
                  <p style={{ color: "#9a9aa2", fontSize: 13, margin: "0 0 2px" }}>📍 {p.direccion}, {p.cp}</p>
                  <p style={{ color: "#9a9aa2", fontSize: 13, margin: "0 0 4px" }}>⏰ {p.rangoHorario || "Sin horario"} · 💳 {p.formaPago}</p>
                  {p.items?.map((it, i) => (
                    <span key={i} style={{ fontSize: 11, background: "#1f2028", borderRadius: 8, padding: "2px 7px", marginRight: 4, color: "#c9c9d1" }}>
                      {it.cantidad}x {it.nombreProducto} ({it.estado})
                    </span>
                  ))}
                  {p.total > 0 && <p style={{ color: ac, fontWeight: 800, margin: "6px 0 0", fontSize: 14 }}>{p.total.toFixed(2)}€</p>}
                </div>
                <Badge estado={p.estado} />
              </div>
            </Card>
          ))}
          <Btn accent={ac} onClick={abrirEnMaps} style={{ width: "100%", marginTop: 4 }}>🗺️ Abrir ruta en Google Maps</Btn>
        </>
      )}
    </div>
  );
}

// ─── MÓDULO: CLIENTES ────────────────────────────────────────────────────────
function ModuloClientes({ clientes, setClientes, pedidos, irInicio }) {
  const ac = ACENTOS.clientes;
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
        <h2 style={{ color: ac, margin: 0 }}>👥 Clientes</h2>
        <Btn accent={ac} onClick={() => setModal(true)}>+ Nuevo</Btn>
      </div>
      <Input placeholder="🔍 Buscar por nombre o teléfono..." value={buscar} onChange={e => setBuscar(e.target.value)} />

      {filtrados.length === 0 ? <Empty texto="No hay clientes registrados" /> : filtrados.map(c => {
        const historial = pedidos.filter(p => p.telefono === c.telefono);
        const totalGastado = historial.reduce((s, p) => s + (p.total || 0), 0);
        return (
          <Card key={c.id} accent={ac}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ color: "#e6e6e6", fontWeight: 800, margin: "0 0 4px" }}>{c.nombre}</p>
                <p style={{ color: "#9a9aa2", fontSize: 13, margin: "0 0 2px" }}>📞 {c.telefono}</p>
                {c.direccion && <p style={{ color: "#9a9aa2", fontSize: 13, margin: "0 0 2px" }}>📍 {c.direccion} {c.cp}</p>}
                <p style={{ color: "#666", fontSize: 12, margin: "4px 0 0" }}>
                  {historial.length} pedido{historial.length !== 1 ? "s" : ""}{totalGastado > 0 && ` · ${totalGastado.toFixed(2)}€ total`}
                </p>
              </div>
              <Btn small variant="danger" onClick={() => setClientes(cl => cl.filter(x => x.id !== c.id))}>🗑️</Btn>
            </div>
          </Card>
        );
      })}

      {modal && (
        <Modal title="Nuevo Cliente" accent={ac} onClose={() => setModal(false)}>
          <Input label="Nombre y Apellido *" value={form.nombre} onChange={e => set("nombre", e.target.value)} />
          <Input label="Teléfono *" value={form.telefono} onChange={e => set("telefono", e.target.value)} />
          <Input label="Dirección" value={form.direccion} onChange={e => set("direccion", e.target.value)} />
          <Input label="Código Postal" value={form.cp} onChange={e => set("cp", e.target.value)} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setModal(false)}>Cancelar</Btn>
            <Btn accent={ac} onClick={guardar}>Guardar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── MÓDULO: INVENTARIO ──────────────────────────────────────────────────────
function ModuloInventario({ productos, setProductos, irInicio }) {
  const ac = ACENTOS.inventario;
  const [editandoPrecio, setEditandoPrecio] = useState(null);
  const [editandoStock, setEditandoStock] = useState(null);

  const actualizarPrecio = (prodId, presentacion, precio) => {
    setProductos(ps => ps.map(p => p.id === prodId ? { ...p, variantes: p.variantes.map(v => v.presentacion === presentacion ? { ...v, precio: parseFloat(precio) || 0 } : v) } : p));
  };
  const actualizarStock = (prodId, presentacion, stock) => {
    setProductos(ps => ps.map(p => p.id === prodId ? { ...p, variantes: p.variantes.map(v => v.presentacion === presentacion ? { ...v, stock: parseInt(stock) || 0 } : v) } : p));
  };

  const categorias = [...new Set(productos.map(p => p.categoria))];
  const PRECIOS_RAPIDOS = [0, 5, 10, 15, 18, 20, 22, 25, 30, 35, 40];

  return (
    <div>
      <h2 style={{ color: ac, marginBottom: 16 }}>📊 Inventario & Precios</h2>
      {categorias.map(cat => (
        <div key={cat} style={{ marginBottom: 22 }}>
          <p style={{ color: "#777", fontSize: 12, fontWeight: 800, letterSpacing: 1, marginBottom: 8 }}>{cat.toUpperCase()}</p>
          {productos.filter(p => p.categoria === cat).map(prod => (
            <Card key={prod.id} accent={ac}>
              <p style={{ color: "#e6e6e6", fontWeight: 700, margin: "0 0 10px" }}>{prod.nombre}</p>
              {prod.variantes.map(v => {
                const claveP = `${prod.id}-${v.presentacion}`;
                return (
                  <div key={v.presentacion} style={{ padding: "8px 0", borderBottom: "1px solid #25262f" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: editandoPrecio === claveP ? 8 : 0 }}>
                      <span style={{ color: "#9a9aa2", fontSize: 13 }}>{v.presentacion}</span>
                      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                        <div style={{ textAlign: "center" }}>
                          <p style={{ color: "#555", fontSize: 10, margin: "0 0 2px" }}>STOCK</p>
                          {editandoStock === claveP ? (
                            <input type="number" defaultValue={v.stock || 0} style={{ width: 60, background: "#101015", border: `1px solid ${ac}`, borderRadius: 8, color: "#e6e6e6", padding: "3px 6px", fontSize: 13 }}
                              onBlur={e => { actualizarStock(prod.id, v.presentacion, e.target.value); setEditandoStock(null); }} autoFocus />
                          ) : (
                            <span style={{ color: (v.stock || 0) < 5 ? "#ef4444" : "#10b981", fontWeight: 800, cursor: "pointer", fontSize: 14 }}
                              onClick={() => setEditandoStock(claveP)}>{v.stock || 0}</span>
                          )}
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <p style={{ color: "#555", fontSize: 10, margin: "0 0 2px" }}>PRECIO/U</p>
                          <span style={{ color: ac, fontWeight: 800, cursor: "pointer", fontSize: 14 }}
                            onClick={() => setEditandoPrecio(editandoPrecio === claveP ? null : claveP)}>
                            {v.precio > 0 ? `${v.precio.toFixed(2)}€` : "—"}
                          </span>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <p style={{ color: "#555", fontSize: 10, margin: "0 0 2px" }}>TOTAL</p>
                          <span style={{ color: "#e6e6e6", fontWeight: 800, fontSize: 14 }}>
                            {v.precio > 0 ? `${((v.stock || 0) * v.precio).toFixed(2)}€` : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                    {editandoPrecio === claveP && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                        {PRECIOS_RAPIDOS.map(n => (
                          <button key={n} onClick={() => { actualizarPrecio(prod.id, v.presentacion, n); setEditandoPrecio(null); }}
                            style={{
                              border: n === v.precio ? `1px solid ${ac}` : "1px solid #2d2e38",
                              background: n === v.precio ? ac : "#1b1c24", color: n === v.precio ? "#0f0f0f" : "#c9c9d1",
                              borderRadius: 8, padding: "5px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer"
                            }}>{n}€</button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </Card>
          ))}
        </div>
      ))}
      <p style={{ color: "#555", fontSize: 12, textAlign: "center" }}>Toca el precio o stock para editarlo</p>
    </div>
  );
}

// ─── MÓDULO: REPARTIDORES ────────────────────────────────────────────────────
function ModuloPersonal({ repartidores, setRepartidores, trabajadoras, setTrabajadoras, irInicio }) {
  const [seccion, setSeccion] = useState("repartidores");

  // ── Repartidores ──
  const acR = ACENTOS.repartidores;
  const [modalR, setModalR] = useState(false);
  const [editarR, setEditarR] = useState(null);
  const vacioR = { nombre: "", telefono: "" };
  const [formR, setFormR] = useState(vacioR);
  const setR = (k, v) => setFormR(f => ({ ...f, [k]: v }));
  const abrirNuevoR = () => { setEditarR(null); setFormR(vacioR); setModalR(true); };
  const abrirEditarR = (r) => { setEditarR(r); setFormR(r); setModalR(true); };
  const guardarR = () => {
    if (!formR.nombre) return;
    if (editarR) setRepartidores(rs => rs.map(r => r.id === editarR.id ? { ...r, ...formR } : r));
    else setRepartidores(rs => [...rs, { ...formR, id: generarId() }]);
    setModalR(false); setEditarR(null); setFormR(vacioR);
  };
  const eliminarR = (id) => { if (confirm("¿Eliminar repartidor?")) setRepartidores(rs => rs.filter(r => r.id !== id)); };

  // ── Trabajadoras ──
  const acT = ACENTOS.produccion;
  const [modalT, setModalT] = useState(false);
  const [editarT, setEditarT] = useState(null);
  const [nombreT, setNombreT] = useState("");
  const abrirNuevoT = () => { setEditarT(null); setNombreT(""); setModalT(true); };
  const abrirEditarT = (t) => { setEditarT(t.id); setNombreT(t.nombre); setModalT(true); };
  const guardarT = () => {
    if (!nombreT.trim()) return;
    if (editarT) setTrabajadoras(ts => ts.map(t => t.id === editarT ? { ...t, nombre: nombreT.trim() } : t));
    else setTrabajadoras(ts => [...ts, { id: generarId(), nombre: nombreT.trim() }]);
    setModalT(false); setEditarT(null); setNombreT("");
  };
  const eliminarT = (id) => { if (confirm("¿Eliminar trabajadora?")) setTrabajadoras(ts => ts.filter(t => t.id !== id)); };

  const acActivo = seccion === "repartidores" ? acR : acT;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ color: acActivo, margin: 0, fontSize: 18, fontWeight: 900 }}>👥 Personal</h2>
        <button onClick={irInicio} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer" }}>🏠</button>
      </div>

      {/* Selector de sección */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[{ id: "repartidores", label: "🛵 Repartidores", ac: acR }, { id: "trabajadoras", label: "👩‍🍳 Trabajadoras", ac: acT }].map(s => (
          <button key={s.id} onClick={() => setSeccion(s.id)} style={{
            flex: 1, padding: "10px", borderRadius: 12, border: `2px solid ${seccion === s.id ? s.ac : "#2a2a3a"}`,
            background: seccion === s.id ? s.ac + "22" : "#13141a", color: seccion === s.id ? s.ac : "#666",
            fontWeight: 700, fontSize: 14, cursor: "pointer"
          }}>{s.label}</button>
        ))}
      </div>

      {/* ── Sección Repartidores ── */}
      {seccion === "repartidores" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <Btn accent={acR} small onClick={abrirNuevoR}>+ Nuevo</Btn>
          </div>
          {repartidores.length === 0 && <p style={{ color: "#555", textAlign: "center", marginTop: 40 }}>No hay repartidores registrados.</p>}
          {repartidores.map(r => (
            <Card key={r.id} accent={acR}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ color: "#e6e6e6", fontWeight: 800, margin: "0 0 4px" }}>{r.fijo ? "🏠" : "🛵"} {r.nombre}</p>
                  {r.telefono && <p style={{ color: "#9a9aa2", fontSize: 13, margin: 0 }}>📞 {r.telefono}</p>}
                </div>
                {!r.fijo && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn small variant="secondary" onClick={() => abrirEditarR(r)}>✏️</Btn>
                    <Btn small variant="danger" onClick={() => eliminarR(r.id)}>🗑️</Btn>
                  </div>
                )}
              </div>
            </Card>
          ))}
          {modalR && (
            <Modal title={editarR ? "Editar Repartidor" : "Nuevo Repartidor"} accent={acR} onClose={() => { setModalR(false); setEditarR(null); }}>
              <Input label="Nombre *" value={formR.nombre} onChange={e => setR("nombre", e.target.value)} placeholder="Ej: Juan Pérez" />
              <Input label="Teléfono" value={formR.telefono} onChange={e => setR("telefono", e.target.value)} placeholder="+34 6XX XXX XXX" />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <Btn variant="secondary" onClick={() => { setModalR(false); setEditarR(null); }}>Cancelar</Btn>
                <Btn accent={acR} onClick={guardarR}>Guardar</Btn>
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* ── Sección Trabajadoras ── */}
      {seccion === "trabajadoras" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <Btn accent={acT} small onClick={abrirNuevoT}>+ Nueva</Btn>
          </div>
          {trabajadoras.length === 0 && <p style={{ color: "#555", textAlign: "center", marginTop: 40 }}>No hay trabajadoras registradas.</p>}
          {trabajadoras.map(t => (
            <Card key={t.id} accent={acT}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ color: "#e6e6e6", fontWeight: 800, margin: 0 }}>👩‍🍳 {t.nombre}</p>
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn small variant="secondary" onClick={() => abrirEditarT(t)}>✏️</Btn>
                  <Btn small variant="danger" onClick={() => eliminarT(t.id)}>🗑️</Btn>
                </div>
              </div>
            </Card>
          ))}
          {modalT && (
            <Modal title={editarT ? "Editar Trabajadora" : "Nueva Trabajadora"} accent={acT} onClose={() => { setModalT(false); setEditarT(null); setNombreT(""); }}>
              <Input label="Nombre *" value={nombreT} onChange={e => setNombreT(e.target.value)} placeholder="Ej: María López" />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <Btn variant="secondary" onClick={() => { setModalT(false); setEditarT(null); setNombreT(""); }}>Cancelar</Btn>
                <Btn accent={acT} onClick={guardarT}>Guardar</Btn>
              </div>
            </Modal>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MÓDULO: PROVEEDORES ─────────────────────────────────────────────────────
function ModuloProveedores({ proveedores, setProveedores }) {
  const ac = ACENTOS.proveedores;
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
    if (editar) setProveedores(ps => ps.map(p => p.id === editar.id ? { ...form, id: editar.id } : p));
    else setProveedores(ps => [...ps, { ...form, id: generarId() }]);
    setModal(false); setEditar(null); setForm(vacio);
  };
  const eliminar = (id) => { if (confirm("¿Eliminar proveedor?")) setProveedores(ps => ps.filter(p => p.id !== id)); };

  const filtrados = proveedores.filter(p => p.nombre.toLowerCase().includes(buscar.toLowerCase()) || p.producto.toLowerCase().includes(buscar.toLowerCase()));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ color: ac, margin: 0 }}>🚚 Proveedores</h2>
        <Btn accent={ac} onClick={abrirNuevo}>+ Nuevo</Btn>
      </div>
      <Input placeholder="🔍 Buscar por nombre o producto..." value={buscar} onChange={e => setBuscar(e.target.value)} />

      {filtrados.length === 0 ? <Empty texto="No hay proveedores registrados" /> : filtrados.map(p => (
        <Card key={p.id} accent={ac}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ color: "#e6e6e6", fontWeight: 800, margin: "0 0 4px" }}>{p.nombre}</p>
              <p style={{ color: "#9a9aa2", fontSize: 13, margin: "0 0 2px" }}>📞 {p.telefono}</p>
              {p.email && <p style={{ color: "#9a9aa2", fontSize: 13, margin: "0 0 2px" }}>✉️ {p.email}</p>}
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
        <Modal title={editar ? "Editar Proveedor" : "Nuevo Proveedor"} accent={ac} onClose={() => { setModal(false); setEditar(null); }}>
          <Input label="Nombre *" value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Ej: Distribuidora Hojaldre SL" />
          <Input label="Teléfono *" value={form.telefono} onChange={e => set("telefono", e.target.value)} placeholder="+34 6XX XXX XXX" />
          <Input label="Email" type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="contacto@proveedor.com" />
          <Input label="Producto que suministra" value={form.producto} onChange={e => set("producto", e.target.value)} placeholder="Ej: Harina, queso, masa" />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => { setModal(false); setEditar(null); }}>Cancelar</Btn>
            <Btn accent={ac} onClick={guardar}>Guardar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── MÓDULO: COMPRAS / MATERIA PRIMA ─────────────────────────────────────────
function FormularioCompra({ proveedores, ingredientes, onGuardar, onCerrar }) {
  const ac = ACENTOS.compras;
  const [form, setForm] = useState({ proveedorId: "", ingredienteNombre: "", unidad: "kg", cantidad: 1, precio: 0, fecha: hoy() });
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
    <Modal title="Nueva Compra" accent={ac} onClose={onCerrar}>
      <Select label="Proveedor *" options={[{ value: "", label: "— Seleccionar —" }, ...proveedores.map(p => ({ value: p.id, label: p.nombre }))]}
        value={form.proveedorId} onChange={e => set("proveedorId", e.target.value)} />
      <Input label="Ingrediente comprado *" value={form.ingredienteNombre} onChange={e => seleccionarIngrediente(e.target.value)}
        placeholder="Ej: Harina, Queso, Masa de hojaldre" list="lista-ingredientes-moderno" />
      <datalist id="lista-ingredientes-moderno">{ingredientes.map(i => <option key={i.id} value={i.nombre} />)}</datalist>
      <Chips label="Unidad" accent={ac} options={UNIDADES_MATERIA_PRIMA} value={form.unidad} onChange={v => set("unidad", v)} />
      <Input label="Cantidad *" type="number" min="0" step="0.01" value={form.cantidad} onChange={e => set("cantidad", e.target.value)} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Input label="Precio pagado (€)" type="number" min="0" step="0.01" value={form.precio} onChange={e => set("precio", e.target.value)} />
        <Input label="Fecha de compra" type="date" value={form.fecha} onChange={e => set("fecha", e.target.value)} />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn variant="secondary" onClick={onCerrar}>Cancelar</Btn>
        <Btn accent={ac} onClick={guardar}>Registrar Compra</Btn>
      </div>
    </Modal>
  );
}

function ModuloCompras({ compras, setCompras, proveedores, ingredientes, setIngredientes }) {
  const ac = ACENTOS.compras;
  const [modal, setModal] = useState(false);
  const [vista, setVista] = useState("stock");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroProveedor, setFiltroProveedor] = useState("");

  const registrarCompra = (compra) => {
    setCompras(cs => [compra, ...cs]);
    setIngredientes(ings => {
      const existente = ings.find(i => i.nombre === compra.ingredienteNombre);
      if (existente) return ings.map(i => i.id === existente.id ? { ...i, stock: (i.stock || 0) + compra.cantidad, unidad: compra.unidad } : i);
      return [...ings, { id: generarId(), nombre: compra.ingredienteNombre, unidad: compra.unidad, stock: compra.cantidad, stockMinimo: STOCK_MINIMO_DEFECTO }];
    });
    setModal(false);
  };

  const eliminarCompra = (id) => { if (confirm("¿Eliminar esta compra del historial?")) setCompras(cs => cs.filter(c => c.id !== id)); };
  const nombreProveedor = (id) => proveedores.find(p => p.id === id)?.nombre || "—";

  const comprasFiltradas = compras.filter(c => (!filtroFecha || c.fecha === filtroFecha) && (!filtroProveedor || c.proveedorId === filtroProveedor));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ color: ac, margin: 0 }}>🧺 Compras / Materia Prima</h2>
        <Btn accent={ac} onClick={() => setModal(true)}>+ Nueva</Btn>
      </div>

      <Chips accent={ac} options={[{ value: "stock", label: "Stock actual" }, { value: "historial", label: "Historial" }]} value={vista} onChange={setVista} />

      {vista === "stock" && (
        ingredientes.length === 0 ? <Empty texto="Sin materia prima registrada todavía" /> : ingredientes.map(i => {
          const bajo = (i.stock || 0) < (i.stockMinimo ?? STOCK_MINIMO_DEFECTO);
          return (
            <Card key={i.id} accent={bajo ? "#ef4444" : ac}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ color: "#e6e6e6", fontWeight: 800, margin: "0 0 4px" }}>{i.nombre}</p>
                  {bajo && <span style={{ color: "#ef4444", fontSize: 12, fontWeight: 700 }}>⚠️ Stock bajo</span>}
                </div>
                <p style={{ color: bajo ? "#ef4444" : "#10b981", fontWeight: 800, fontSize: 18, margin: 0 }}>{i.stock} {i.unidad}</p>
              </div>
            </Card>
          );
        })
      )}

      {vista === "historial" && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <input type="date" style={{ background: "#1b1c24", border: "1px solid #2d2e38", color: "#e6e6e6", borderRadius: 10, padding: "9px 12px", fontSize: 13 }}
              value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} />
            <select style={{ background: "#1b1c24", border: "1px solid #2d2e38", color: "#e6e6e6", borderRadius: 10, padding: "9px 12px", fontSize: 13 }}
              value={filtroProveedor} onChange={e => setFiltroProveedor(e.target.value)}>
              <option value="">Todos los proveedores</option>
              {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            {(filtroFecha || filtroProveedor) && <Btn small variant="secondary" onClick={() => { setFiltroFecha(""); setFiltroProveedor(""); }}>✕ Limpiar</Btn>}
          </div>

          {comprasFiltradas.length === 0 ? <Empty texto="Sin compras con estos filtros" /> : comprasFiltradas.map(c => (
            <Card key={c.id} accent={ac}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ color: "#e6e6e6", fontWeight: 800, margin: "0 0 4px" }}>{c.ingredienteNombre}</p>
                  <p style={{ color: "#9a9aa2", fontSize: 13, margin: "0 0 2px" }}>🚚 {nombreProveedor(c.proveedorId)}</p>
                  <p style={{ color: "#9a9aa2", fontSize: 13, margin: "0 0 2px" }}>📅 {c.fecha}</p>
                  <p style={{ color: "#9a9aa2", fontSize: 13, margin: 0 }}>{c.cantidad} {c.unidad}{c.precio > 0 && ` · ${c.precio.toFixed(2)}€`}</p>
                </div>
                <Btn small variant="danger" onClick={() => eliminarCompra(c.id)}>🗑️</Btn>
              </div>
            </Card>
          ))}
        </>
      )}

      {modal && <FormularioCompra proveedores={proveedores} ingredientes={ingredientes} onGuardar={registrarCompra} onCerrar={() => setModal(false)} />}
    </div>
  );
}

// ─── MÓDULO: GASTOS ──────────────────────────────────────────────────────────
function ModuloGastos({ gastos, setGastos, irInicio }) {
  const ac = ACENTOS.gastos;
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
    if (editar) setGastos(gs => gs.map(g => g.id === editar.id ? { ...datos, id: editar.id } : g));
    else setGastos(gs => [{ ...datos, id: generarId() }, ...gs]);
    setModal(false); setEditar(null); setForm(vacio);
  };
  const eliminar = (id) => { if (confirm("¿Eliminar gasto?")) setGastos(gs => gs.filter(g => g.id !== id)); };

  const filtrados = gastos.filter(g => (!filtroFecha || g.fecha === filtroFecha) && (filtroCategoria === "Todas" || g.categoria === filtroCategoria));
  const totalFiltrado = filtrados.reduce((s, g) => s + (g.monto || 0), 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ color: ac, margin: 0 }}>🧹 Gastos</h2>
        <Btn accent={ac} onClick={abrirNuevo}>+ Nuevo</Btn>
      </div>
      <p style={{ color: "#666", fontSize: 12, marginBottom: 16 }}>Limpieza u otros gastos no relacionados a la producción</p>

      <Chips accent={ac} options={["Todas", ...CATEGORIAS_GASTO]} value={filtroCategoria} onChange={setFiltroCategoria} />
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <input type="date" style={{ background: "#1b1c24", border: "1px solid #2d2e38", color: "#e6e6e6", borderRadius: 10, padding: "9px 12px", fontSize: 13 }}
          value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} />
        {(filtroFecha || filtroCategoria !== "Todas") && <Btn small variant="secondary" onClick={() => { setFiltroFecha(""); setFiltroCategoria("Todas"); }}>✕ Limpiar</Btn>}
      </div>

      {filtrados.length === 0 ? <Empty texto="Sin gastos registrados con estos filtros" /> : (
        <>
          {filtrados.map(g => (
            <Card key={g.id} accent={ac}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ color: "#e6e6e6", fontWeight: 800, margin: "0 0 4px" }}>{g.concepto}</p>
                  <p style={{ color: "#9a9aa2", fontSize: 13, margin: "0 0 2px" }}>🏷️ {g.categoria}</p>
                  <p style={{ color: "#9a9aa2", fontSize: 13, margin: 0 }}>📅 {g.fecha}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                  <p style={{ color: ac, fontWeight: 800, fontSize: 16, margin: 0 }}>{g.monto.toFixed(2)}€</p>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn small variant="secondary" onClick={() => abrirEditar(g)}>✏️</Btn>
                    <Btn small variant="danger" onClick={() => eliminar(g.id)}>🗑️</Btn>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          <p style={{ color: "#9a9aa2", textAlign: "right", fontWeight: 800, fontSize: 14 }}>Total: {totalFiltrado.toFixed(2)}€</p>
        </>
      )}

      {modal && (
        <Modal title={editar ? "Editar Gasto" : "Nuevo Gasto"} accent={ac} onClose={() => { setModal(false); setEditar(null); }}>
          <Input label="Concepto *" value={form.concepto} onChange={e => set("concepto", e.target.value)} placeholder="Ej: Detergente, guantes, bolsas" />
          <Chips label="Categoría" accent={ac} options={CATEGORIAS_GASTO} value={form.categoria} onChange={v => set("categoria", v)} />
          <Input label="Monto (€) *" type="number" min="0" step="0.01" value={form.monto} onChange={e => set("monto", e.target.value)} />
          <Input label="Fecha" type="date" value={form.fecha} onChange={e => set("fecha", e.target.value)} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => { setModal(false); setEditar(null); }}>Cancelar</Btn>
            <Btn accent={ac} onClick={guardar}>Guardar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── MÓDULO: REPORTE HACIENDA ────────────────────────────────────────────────
function ModuloReporte({ pedidos, compras, gastos }) {
  const ac = ACENTOS.reporte;
  const [desde, setDesde] = useState(inicioDeMes());
  const [hasta, setHasta] = useState(hoy());
  const enRango = (fecha) => fecha >= desde && fecha <= hasta;

  const pedidosRango = pedidos.filter(p => enRango(p.fecha) && p.estado !== "Cancelado");
  const comprasRango = compras.filter(c => enRango(c.fecha));
  const gastosRango = gastos.filter(g => enRango(g.fecha));

  const ingresos = pedidosRango.reduce((s, p) => s + (p.total || 0), 0);
  const costoMateriaPrima = comprasRango.reduce((s, c) => s + (c.precio || 0), 0);
  const otrosGastos = gastosRango.reduce((s, g) => s + (g.monto || 0), 0);
  const beneficio = ingresos - costoMateriaPrima - otrosGastos;

  const gastosPorCategoria = CATEGORIAS_GASTO.map(cat => ({
    categoria: cat, total: gastosRango.filter(g => g.categoria === cat).reduce((s, g) => s + (g.monto || 0), 0)
  })).filter(c => c.total > 0);

  return (
    <div>
      <h2 style={{ color: ac, margin: "0 0 16px" }}>📈 Reporte Hacienda</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Input label="Desde" type="date" value={desde} onChange={e => setDesde(e.target.value)} />
        <Input label="Hasta" type="date" value={hasta} onChange={e => setHasta(e.target.value)} />
      </div>

      <div id="reporte-imprimible">
        <Card accent={ac}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #25262f" }}>
            <span style={{ color: "#9a9aa2", fontSize: 14 }}>Ingresos (ventas)</span>
            <span style={{ color: "#10b981", fontWeight: 800, fontSize: 14 }}>{ingresos.toFixed(2)}€</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #25262f" }}>
            <span style={{ color: "#9a9aa2", fontSize: 14 }}>Costo de materia prima</span>
            <span style={{ color: "#ef4444", fontWeight: 800, fontSize: 14 }}>-{costoMateriaPrima.toFixed(2)}€</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #25262f" }}>
            <span style={{ color: "#9a9aa2", fontSize: 14 }}>Otros gastos</span>
            <span style={{ color: "#ef4444", fontWeight: 800, fontSize: 14 }}>-{otrosGastos.toFixed(2)}€</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0" }}>
            <span style={{ color: ac, fontWeight: 800, fontSize: 16 }}>BENEFICIO NETO</span>
            <span style={{ color: beneficio >= 0 ? ac : "#ef4444", fontWeight: 800, fontSize: 16 }}>{beneficio.toFixed(2)}€</span>
          </div>
        </Card>

        {gastosPorCategoria.length > 0 && (
          <Card accent={ac}>
            <p style={{ color: "#9a9aa2", fontSize: 12, fontWeight: 800, margin: "0 0 8px" }}>OTROS GASTOS POR CATEGORÍA</p>
            {gastosPorCategoria.map(c => (
              <div key={c.categoria} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                <span style={{ color: "#e6e6e6", fontSize: 13 }}>{c.categoria}</span>
                <span style={{ color: "#e6e6e6", fontSize: 13 }}>{c.total.toFixed(2)}€</span>
              </div>
            ))}
          </Card>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          <Card accent={ac} style={{ textAlign: "center", padding: 14 }}>
            <p style={{ color: "#666", fontSize: 11, margin: "0 0 4px" }}>PEDIDOS</p>
            <p style={{ color: "#e6e6e6", fontWeight: 800, fontSize: 18, margin: 0 }}>{pedidosRango.length}</p>
          </Card>
          <Card accent={ac} style={{ textAlign: "center", padding: 14 }}>
            <p style={{ color: "#666", fontSize: 11, margin: "0 0 4px" }}>COMPRAS</p>
            <p style={{ color: "#e6e6e6", fontWeight: 800, fontSize: 18, margin: 0 }}>{comprasRango.length}</p>
          </Card>
          <Card accent={ac} style={{ textAlign: "center", padding: 14 }}>
            <p style={{ color: "#666", fontSize: 11, margin: "0 0 4px" }}>GASTOS</p>
            <p style={{ color: "#e6e6e6", fontWeight: 800, fontSize: 18, margin: 0 }}>{gastosRango.length}</p>
          </Card>
        </div>
      </div>

      <Btn accent={ac} onClick={() => window.print()} style={{ width: "100%", marginTop: 4 }}>🖨️ Imprimir / Exportar PDF</Btn>
    </div>
  );
}

// ─── MÓDULO STOCK ────────────────────────────────────────────────────────────
function ModuloStock({ productos, irInicio }) {
  const ac = ACENTOS.stock;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ color: ac, margin: 0, fontSize: 18, fontWeight: 900 }}>🗃️ Stock por Lotes</h2>
        <button onClick={irInicio} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer" }}>🏠</button>
      </div>
      {productos.length === 0 && <p style={{ color: "#555", textAlign: "center", marginTop: 40 }}>No hay productos registrados.</p>}
      {productos.map(prod => (
        <div key={prod.id} style={{ background: "#13141a", border: "1px solid #1d1e26", borderRadius: 14, marginBottom: 12, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #1d1e26", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>{prod.nombre}</span>
            <span style={{ color: "#555", fontSize: 12 }}>{prod.categoria}</span>
          </div>
          {prod.variantes.map((v, i) => {
            const total = stockTotal(v.lotes);
            const lotes = [...(v.lotes || [])].sort((a, b) => a.fecha.localeCompare(b.fecha));
            return (
              <div key={i} style={{ padding: "10px 16px", borderBottom: i < prod.variantes.length - 1 ? "1px solid #1d1e26" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: lotes.length > 0 ? 8 : 0 }}>
                  <span style={{ color: "#aaa", fontSize: 14 }}>{v.presentacion}</span>
                  <span style={{ color: total > 0 ? ac : "#ef4444", fontWeight: 800, fontSize: 15 }}>{total} uds</span>
                </div>
                {lotes.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {lotes.map((l, j) => (
                      <div key={j} style={{ display: "flex", justifyContent: "space-between", background: "#0c0c10", borderRadius: 8, padding: "5px 10px" }}>
                        <span style={{ color: "#666", fontSize: 12 }}>📅 {l.fecha}</span>
                        <span style={{ color: "#e6e6e6", fontSize: 12, fontWeight: 600 }}>{l.cantidad} uds</span>
                      </div>
                    ))}
                  </div>
                )}
                {lotes.length === 0 && <span style={{ color: "#444", fontSize: 12 }}>Sin stock</span>}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── MÓDULO PRODUCCIÓN ───────────────────────────────────────────────────────
function ModuloProduccion({ producciones, setProducciones, trabajadoras, setTrabajadoras, productos, setProductos, irInicio }) {
  const ac = ACENTOS.produccion;
  const [vista, setVista] = useState("lista");
  const FORM_VACIO = { fecha: hoy(), trabajadoraId: "", items: [{ productoId: "", presentacion: "", cantidad: 1 }] };
  const [form, setForm] = useState(FORM_VACIO);
  const [modalTrab, setModalTrab] = useState(false);
  const [nombreTrab, setNombreTrab] = useState("");

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const agregarItem = () => setForm(f => ({ ...f, items: [...f.items, { productoId: "", presentacion: "", cantidad: 1 }] }));
  const quitarItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, j) => j !== i) }));
  const setItem = (i, k, v) => setForm(f => ({
    ...f,
    items: f.items.map((it, j) => j === i ? { ...it, [k]: v, ...(k === "productoId" ? { presentacion: "" } : {}) } : it)
  }));

  const guardar = () => {
    if (!form.trabajadoraId || form.items.some(it => !it.productoId || !it.presentacion || !it.cantidad)) return;
    const nueva = { ...form, id: generarId(), items: form.items.map(it => ({ ...it, cantidad: parseInt(it.cantidad) || 0 })) };
    setProducciones(p => [nueva, ...p]);
    setProductos(prods => prods.map(prod => ({
      ...prod,
      variantes: prod.variantes.map(v => {
        const it = nueva.items.find(i => parseInt(i.productoId) === prod.id && i.presentacion === v.presentacion);
        if (!it) return v;
        const nuevosLotes = [...(v.lotes || [])];
        const loteExistente = nuevosLotes.findIndex(l => l.fecha === nueva.fecha);
        if (loteExistente >= 0) nuevosLotes[loteExistente] = { ...nuevosLotes[loteExistente], cantidad: nuevosLotes[loteExistente].cantidad + it.cantidad };
        else nuevosLotes.push({ fecha: nueva.fecha, cantidad: it.cantidad });
        return { ...v, lotes: nuevosLotes, stock: stockTotal(nuevosLotes) };
      })
    })));
    setForm(FORM_VACIO);
    setVista("lista");
  };

  const guardarTrab = () => {
    if (!nombreTrab.trim()) return;
    setTrabajadoras(t => [...t, { id: generarId(), nombre: nombreTrab.trim() }]);
    setNombreTrab("");
    setModalTrab(false);
  };

  if (vista === "nueva") return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button onClick={() => setVista("lista")} style={{ background: "none", border: "none", color: "#888", fontSize: 14, cursor: "pointer" }}>← Volver</button>
        <button onClick={irInicio} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer" }}>🏠</button>
      </div>
      <h2 style={{ color: ac, margin: "0 0 16px", fontSize: 18, fontWeight: 900 }}>Nueva Producción</h2>

      <div style={{ background: "#13141a", border: "1px solid #1d1e26", borderRadius: 14, padding: 16, marginBottom: 12 }}>
        <label style={{ color: "#666", fontSize: 12, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Fecha de producción</label>
        <input type="date" value={form.fecha} onChange={e => setF("fecha", e.target.value)}
          style={{ width: "100%", background: "#0c0c10", border: "1px solid #2a2a3a", borderRadius: 10, color: "#e6e6e6", padding: "10px 12px", fontSize: 14, boxSizing: "border-box" }} />
      </div>

      <div style={{ background: "#13141a", border: "1px solid #1d1e26", borderRadius: 14, padding: 16, marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <label style={{ color: "#666", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Trabajadora</label>
          <button onClick={() => setModalTrab(true)} style={{ background: "none", border: "none", color: ac, fontSize: 12, cursor: "pointer", fontWeight: 700 }}>+ Nueva</button>
        </div>
        <select value={form.trabajadoraId} onChange={e => setF("trabajadoraId", e.target.value)}
          style={{ width: "100%", background: "#0c0c10", border: "1px solid #2a2a3a", borderRadius: 10, color: form.trabajadoraId ? "#e6e6e6" : "#555", padding: "10px 12px", fontSize: 14, boxSizing: "border-box" }}>
          <option value="">Seleccionar trabajadora...</option>
          {trabajadoras.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
        </select>
      </div>

      <div style={{ background: "#13141a", border: "1px solid #1d1e26", borderRadius: 14, padding: 16, marginBottom: 12 }}>
        <label style={{ color: "#666", fontSize: 12, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 10 }}>Productos producidos</label>
        {form.items.map((it, i) => {
          const prod = productos.find(p => p.id === parseInt(it.productoId));
          return (
            <div key={i} style={{ background: "#0c0c10", borderRadius: 10, padding: 12, marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <select value={it.productoId} onChange={e => setItem(i, "productoId", e.target.value)}
                  style={{ flex: 2, background: "#13141a", border: "1px solid #2a2a3a", borderRadius: 8, color: it.productoId ? "#e6e6e6" : "#555", padding: "8px 10px", fontSize: 13 }}>
                  <option value="">Producto...</option>
                  {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                {form.items.length > 1 && (
                  <button onClick={() => quitarItem(i)} style={{ background: "#ef444422", border: "1px solid #ef444444", borderRadius: 8, color: "#ef4444", padding: "0 10px", cursor: "pointer", fontSize: 16 }}>✕</button>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <select value={it.presentacion} onChange={e => setItem(i, "presentacion", e.target.value)}
                  style={{ flex: 2, background: "#13141a", border: "1px solid #2a2a3a", borderRadius: 8, color: it.presentacion ? "#e6e6e6" : "#555", padding: "8px 10px", fontSize: 13 }}>
                  <option value="">Presentación...</option>
                  {prod?.variantes.map(v => <option key={v.presentacion} value={v.presentacion}>{v.presentacion}</option>)}
                </select>
                <input type="number" min="1" value={it.cantidad} onChange={e => setItem(i, "cantidad", e.target.value)}
                  placeholder="Cant." style={{ flex: 1, background: "#13141a", border: "1px solid #2a2a3a", borderRadius: 8, color: "#e6e6e6", padding: "8px 10px", fontSize: 13, minWidth: 0 }} />
              </div>
            </div>
          );
        })}
        <button onClick={agregarItem} style={{ width: "100%", background: "transparent", border: `1px dashed ${ac}55`, borderRadius: 10, color: ac, padding: "10px", fontSize: 13, cursor: "pointer", fontWeight: 700, marginTop: 4 }}>
          + Agregar producto
        </button>
      </div>

      <button onClick={guardar} style={{ width: "100%", background: ac, color: "#0c0c10", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
        💾 Guardar Producción
      </button>

      {modalTrab && (
        <div style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#13141a", border: "1px solid #2a2a3a", borderRadius: 18, padding: 24, width: "100%", maxWidth: 360 }}>
            <h3 style={{ color: ac, margin: "0 0 16px", fontSize: 16 }}>Nueva Trabajadora</h3>
            <input autoFocus value={nombreTrab} onChange={e => setNombreTrab(e.target.value)} onKeyDown={e => e.key === "Enter" && guardarTrab()}
              placeholder="Nombre completo" style={{ width: "100%", background: "#0c0c10", border: "1px solid #2a2a3a", borderRadius: 10, color: "#e6e6e6", padding: "12px", fontSize: 14, boxSizing: "border-box", marginBottom: 12 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setModalTrab(false)} style={{ flex: 1, background: "#1a1a2a", border: "1px solid #2a2a3a", borderRadius: 10, color: "#888", padding: 12, cursor: "pointer" }}>Cancelar</button>
              <button onClick={guardarTrab} style={{ flex: 1, background: ac, border: "none", borderRadius: 10, color: "#0c0c10", padding: 12, fontWeight: 800, cursor: "pointer" }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const agrupadas = producciones.reduce((acc, p) => {
    const dia = p.fecha || "Sin fecha";
    acc[dia] = acc[dia] || [];
    acc[dia].push(p);
    return acc;
  }, {});
  const dias = Object.keys(agrupadas).sort((a, b) => b.localeCompare(a));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ color: ac, margin: 0, fontSize: 18, fontWeight: 900 }}>🏭 Producción</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={irInicio} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer" }}>🏠</button>
          <Btn accent={ac} onClick={() => setVista("nueva")}>+ Nueva</Btn>
        </div>
      </div>

      {dias.length === 0 && <p style={{ color: "#555", textAlign: "center", marginTop: 40 }}>No hay registros de producción aún.</p>}
      {dias.map(dia => (
        <div key={dia} style={{ marginBottom: 16 }}>
          <p style={{ color: "#555", fontSize: 12, fontWeight: 700, textTransform: "uppercase", margin: "0 0 8px" }}>📅 {dia}</p>
          {agrupadas[dia].map(prod => {
            const trab = trabajadoras.find(t => t.id === prod.trabajadoraId);
            return (
              <div key={prod.id} style={{ background: "#13141a", border: "1px solid #1d1e26", borderRadius: 14, padding: 14, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ color: ac, fontWeight: 700, fontSize: 14 }}>👩‍🍳 {trab?.nombre || "—"}</span>
                  <span style={{ color: "#555", fontSize: 12 }}>{prod.items?.length} producto{prod.items?.length !== 1 ? "s" : ""}</span>
                </div>
                {prod.items?.map((it, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderTop: i > 0 ? "1px solid #1d1e26" : "none" }}>
                    <span style={{ color: "#aaa", fontSize: 13 }}>{it.productoId ? (productos.find(p => p.id === parseInt(it.productoId))?.nombre || it.productoId) : "—"} · {it.presentacion}</span>
                    <span style={{ color: "#e6e6e6", fontWeight: 700, fontSize: 13 }}>{it.cantidad} uds</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── APP PRINCIPAL (DISEÑO MODERNO) ─────────────────────────────────────────
const TABS = [
  { id: "pedidos", label: "Pedidos", icon: "📦" },
  { id: "clientes", label: "Clientes", icon: "👥" },
  { id: "inventario", label: "Inventario", icon: "📊" },
  { id: "stock", label: "Stock", icon: "🗃️" },
  { id: "produccion", label: "Producc.", icon: "🏭" },
  { id: "proveedores", label: "Proveed.", icon: "🚚" },
  { id: "compras", label: "Compras", icon: "🧺" },
  { id: "gastos", label: "Gastos", icon: "🧹" },
  { id: "reporte", label: "Reporte", icon: "📈" },
  { id: "personal", label: "Personal", icon: "🧑‍💼" },
];

function cargarLS(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}

export default function AppModerno() {
  const [tab, setTab] = useState("pedidos");
  const [pedidos, setPedidos] = useState(() => cargarLS("pedidos", []));
  const [clientes, setClientes] = useState(() => cargarLS("clientes", []));
  const [productos, setProductos] = useState(() => {
    const g = cargarLS("productos", []);
    return g.map(p => ({ ...p, variantes: p.variantes.map(v => ({ ...v, stock: v.stock ?? 0, lotes: v.lotes || [] })) }));
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
  const [producciones, setProducciones] = useState(() => cargarLS("producciones", []));
  const [trabajadoras, setTrabajadoras] = useState(() => cargarLS("trabajadoras", []));

  const [listo, setListo] = useState(false);

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
  useEffect(() => { if (listo) sync("producciones", producciones); }, [JSON.stringify(producciones)]);
  useEffect(() => { if (listo) sync("trabajadoras", trabajadoras); }, [JSON.stringify(trabajadoras)]);

  // Escuchar cambios de pedidos desde Firebase en tiempo real
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

  const ac = ACENTOS[tab] || ACENTOS.pedidos;
  const pendientes = pedidos.filter(p => p.estado === "Pendiente").length;
  const hoyEntregas = pedidos.filter(p => p.fecha === hoy() && p.estado !== "Cancelado").length;
  const irInicio = () => setTab("pedidos");

  const exportarDatos = () => {
    const datos = { pedidos, clientes, productos, proveedores, compras, ingredientes, gastos, repartidores, producciones, trabajadoras, exportado: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `elnisong-backup-${hoy()}.json`;
    a.click();
  };

  return (
    <div style={{ background: "#0c0c10", minHeight: "100vh", fontFamily: "'Inter', sans-serif", color: "#e6e6e6" }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${ac}22 0%, #0c0c10 70%)`, borderBottom: "1px solid #1d1e26", padding: "14px 20px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={irInicio} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
            <h1 style={{ color: ac, margin: 0, fontSize: 20, fontWeight: 900, letterSpacing: -0.5 }}>🫓 ELNISONG</h1>
            <p style={{ color: "#666", fontSize: 11, margin: 0 }}>Toca para volver al inicio</p>
          </button>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {pendientes > 0 && (
              <div style={{ textAlign: "center", background: "#f59e0b18", borderRadius: 12, padding: "6px 12px" }}>
                <p style={{ color: "#f59e0b", fontWeight: 800, fontSize: 18, margin: 0 }}>{pendientes}</p>
                <p style={{ color: "#888", fontSize: 10, margin: 0 }}>Pendientes</p>
              </div>
            )}
            <div style={{ textAlign: "center", background: `${ac}18`, borderRadius: 12, padding: "6px 12px" }}>
              <p style={{ color: ac, fontWeight: 800, fontSize: 18, margin: 0 }}>{hoyEntregas}</p>
              <p style={{ color: "#888", fontSize: 10, margin: 0 }}>Hoy</p>
            </div>
            <button onClick={exportarDatos} title="Exportar backup"
              style={{ background: "#1a1a2a", border: "1px solid #2a2a3a", borderRadius: 10, color: "#888", padding: "8px 10px", cursor: "pointer", fontSize: 16 }}>
              💾
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "20px 16px 110px" }}>
        {tab === "pedidos" && <ModuloPedidos pedidos={pedidos} setPedidos={setPedidos} productos={productos} setProductos={setProductos} clientes={clientes} repartidores={repartidores} />}
        {tab === "clientes" && <ModuloClientes clientes={clientes} setClientes={setClientes} pedidos={pedidos} irInicio={irInicio} />}
        {tab === "inventario" && <ModuloInventario productos={productos} setProductos={setProductos} irInicio={irInicio} />}
        {tab === "stock" && <ModuloStock productos={productos} irInicio={irInicio} />}
        {tab === "produccion" && <ModuloProduccion producciones={producciones} setProducciones={setProducciones} trabajadoras={trabajadoras} setTrabajadoras={setTrabajadoras} productos={productos} setProductos={setProductos} irInicio={irInicio} />}
        {tab === "proveedores" && <ModuloProveedores proveedores={proveedores} setProveedores={setProveedores} irInicio={irInicio} />}
        {tab === "compras" && <ModuloCompras compras={compras} setCompras={setCompras} proveedores={proveedores} ingredientes={ingredientes} setIngredientes={setIngredientes} irInicio={irInicio} />}
        {tab === "gastos" && <ModuloGastos gastos={gastos} setGastos={setGastos} irInicio={irInicio} />}
        {tab === "reporte" && <ModuloReporte pedidos={pedidos} compras={compras} gastos={gastos} irInicio={irInicio} />}
        {tab === "personal" && <ModuloPersonal repartidores={repartidores} setRepartidores={setRepartidores} trabajadoras={trabajadoras} setTrabajadoras={setTrabajadoras} irInicio={irInicio} />}
      </div>

      {/* Navegación inferior tipo botones grandes */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, background: "#13141a",
        borderTop: "1px solid #1d1e26", overflowX: "auto", zIndex: 50
      }}>
        <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", padding: "8px 6px", gap: 4 }}>
          {TABS.map(t => {
            const activo = tab === t.id;
            const color = ACENTOS[t.id];
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: "1 0 auto", minWidth: 64, display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                background: activo ? `${color}22` : "transparent", border: activo ? `1px solid ${color}55` : "1px solid transparent",
                borderRadius: 12, padding: "8px 6px", cursor: "pointer", transition: "all .15s"
              }}>
                <span style={{ fontSize: 18 }}>{t.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: activo ? color : "#777" }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
