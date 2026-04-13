import CryptoJS from 'crypto-js'
import './App.css'

function App() {
  const cifrar = (texto) => {
    var textoCifrado = CryptoJS.AES.encrypt(texto, '12345678').toString();
    return textoCifrado;
  }

  const decifrar = (texto) => {
    var bytes = CryptoJS.AES.decrypt(texto, '12345678');
    var textoDecifrado = bytes.toString(CryptoJS.enc.Utf8);
    return textoDecifrado;
  }

  return (
    <>
      <section id="center">
          <h1>Cifrador</h1>
          <p>
            Texto cifrado: {cifrar("Hola Mundo")}
          </p>
          <p>
            Texto decifrado: {decifrar(cifrar("Hola Mundo"))}
          </p>
      </section>
    </>
  )
}

export default App
