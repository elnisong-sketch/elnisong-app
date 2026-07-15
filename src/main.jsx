import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppModerno from './AppModerno.jsx'
import AppRepartidor from './AppRepartidor.jsx'
import PedidoPublico from './PedidoPublico.jsx'

const NAVY   = "#1e3a5f";
const ORANGE = "#f97316";
const PASS   = "ayala1992";

const hostname = window.location.hostname;
const params   = new URLSearchParams(window.location.search);

const esPublico     = hostname.includes("donpepesabor");
const esRepartidor  = params.has("repartidor");

function LoginGestion({ onLogin }) {
  const [clave, setClave] = useState("");
  const [error, setError] = useState(false);

  const intentar = () => {
    if (clave === PASS) { onLogin(); }
    else { setError(true); setClave(""); setTimeout(() => setError(false), 2000); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "40px 32px", maxWidth: 360, width: "100%", boxShadow: "0 4px 32px #0002", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
        <h1 style={{ color: NAVY, fontSize: 20, fontWeight: 900, margin: "0 0 4px" }}>Inversiones Ayala 1992</h1>
        <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 28px" }}>Acceso a gestión interna</p>

        <input
          type="password"
          placeholder="Contraseña"
          value={clave}
          onChange={e => setClave(e.target.value)}
          onKeyDown={e => e.key === "Enter" && intentar()}
          style={{ width: "100%", padding: "13px 16px", border: `2px solid ${error ? "#ef4444" : "#e2e8f0"}`, borderRadius: 12, fontSize: 16, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 12, textAlign: "center", letterSpacing: 4 }}
        />

        {error && <p style={{ color: "#ef4444", fontSize: 13, fontWeight: 600, margin: "0 0 12px" }}>Contraseña incorrecta</p>}

        <button onClick={intentar} style={{ width: "100%", background: NAVY, border: "none", borderRadius: 50, color: "#fff", padding: "14px", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
          Entrar
        </button>

        <p style={{ color: "#cbd5e1", fontSize: 11, marginTop: 24 }}>Don Pepe Sabor · Sistema de gestión</p>
      </div>
    </div>
  );
}

function Root() {
  const [autenticado, setAutenticado] = useState(
    () => sessionStorage.getItem("ayala_auth") === "1"
  );

  const login = () => { sessionStorage.setItem("ayala_auth", "1"); setAutenticado(true); };

  if (esRepartidor) return <AppRepartidor />;
  if (esPublico)    return <PedidoPublico />;
  if (!autenticado) return <LoginGestion onLogin={login} />;
  return <AppModerno />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode><Root /></StrictMode>
)
