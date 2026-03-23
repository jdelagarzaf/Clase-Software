import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppUsuarios from './Usuarios.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppUsuarios />
  </StrictMode>
)
