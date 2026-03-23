import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { ExpertApp } from './assets/components/ExpertApp'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <ExpertApp />
    </>
  )
}

export default App
