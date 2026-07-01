import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppModerno from './AppModerno.jsx'
import AppRepartidor from './AppRepartidor.jsx'

const esVistaRepartidor = new URLSearchParams(window.location.search).has("repartidor");

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {esVistaRepartidor ? <AppRepartidor /> : <AppModerno />}
  </StrictMode>,
)
