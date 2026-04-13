import { useState } from 'react'
import CryptoJS from 'crypto-js'
import './App.css'

const CLAVE = '12345678'

function App() {
  const [textoPlano, setTextoPlano] = useState('')
  const [textoCifrado, setTextoCifrado] = useState('')

  const manejarCambioTextoPlano = (event) => {
    setTextoPlano(event.target.value)
  }

  const manejarCambioTextoCifrado = (event) => {
    setTextoCifrado(event.target.value)
  }

  const cifrar = (texto) => {
    return CryptoJS.AES.encrypt(texto, CLAVE).toString()
  }

  const descifrar = (texto) => {
    const bytes = CryptoJS.AES.decrypt(texto, CLAVE)
    return bytes.toString(CryptoJS.enc.Utf8)
  }

  const manejarCifrado = () => {
    if (!textoPlano.trim()) {
      setTextoCifrado('')
      return
    }

    setTextoCifrado(cifrar(textoPlano))
  }

  const manejarDescifrado = () => {
    if (!textoCifrado) {
      setTextoPlano('')
      return
    }

    const resultado = descifrar(textoCifrado)
    setTextoPlano(resultado || 'No fue posible descifrar el texto.')
  }

  return (
    <main className="app-shell">
      <section className="cipher-card">
        <header className="hero">
          <div>
            <p className="eyebrow">Laboratorio 3</p>
            <h1>Cifrador y descifrador</h1>
            <p className="intro">
              Cifra un mensaje propio o pega un texto cifrado externo para
              descifrarlo con la misma clave AES.
            </p>
          </div>
          <div className="hero-tag">AES</div>
        </header>

        <form
          className="cipher-form"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="field-grid">
            <div className="field">
              <div className="field-top">
                <label htmlFor="textoPlano">Texto plano</label>
                <small>{textoPlano.length} caracteres</small>
              </div>
              <textarea
                id="textoPlano"
                name="textoPlano"
                placeholder="Escribe aqui el mensaje que quieres cifrar"
                value={textoPlano}
                onChange={manejarCambioTextoPlano}
                rows="5"
              />
              <small className="field-note">
                Usa este campo para generar un nuevo texto cifrado.
              </small>
            </div>

            <div className="field">
              <div className="field-top">
                <label htmlFor="textoCifrado">Texto cifrado</label>
                <small>{textoCifrado.length} caracteres</small>
              </div>
              <textarea
                id="textoCifrado"
                name="textoCifrado"
                placeholder="Pega aqui un texto cifrado para descifrarlo"
                value={textoCifrado}
                onChange={manejarCambioTextoCifrado}
                rows="5"
              />
              <small className="field-note">
                Puedes pegar un texto cifrado aunque no haya sido generado por
                esta pagina.
              </small>
            </div>
          </div>

          <div className="actions">
            <button type="button" onClick={manejarCifrado}>
              Cifrar texto
            </button>
            <button
              type="button"
              className="secondary"
              onClick={manejarDescifrado}
              disabled={!textoCifrado}
            >
              Descifrar texto
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}

export default App
