import React from 'react'
import { bancos } from './clases/bancos'

const Bancos = () => {
  return (
    <div>
        <h1>Listado de Bancos</h1>
        <ul>
          {bancos.map((banco) => (
            <li key={banco.id}>{banco.name} - {banco.country}</li>
          ))}
        </ul>
    </div>
  )
}

export default Bancos