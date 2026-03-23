import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { CustomHook } from './components/customHook.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CustomHook/>
  </StrictMode>,
)
