import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import './clases/string'
import './clases/arrays'
import './clases/objetos'
import './clases/funciones'
import './clases/array'
import './clases/import'

import Bancos from './Bancos'
import HolaMundo from './HolaMundo'
import Variables from './Variables'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <div className="card">
        <HolaMundo />
        <Variables />
        <Bancos />
      </div>
    </>
  )
}

export default App
