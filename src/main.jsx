import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppModerno from './AppModerno.jsx'
import AppRepartidor from './AppRepartidor.jsx'
import PedidoPublico from './PedidoPublico.jsx'

const params = new URLSearchParams(window.location.search);
const esRepartidor = params.has("repartidor");
const esPedido     = window.location.pathname === "/pedido" || params.has("pedido");

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {esRepartidor ? <AppRepartidor /> : esPedido ? <PedidoPublico /> : <AppModerno />}
  </StrictMode>,
)
