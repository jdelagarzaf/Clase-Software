import CountryList from './components/CountryList';
import './App.css';

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="eyebrow">Laboratorio 5</p>
        <h1>Administrador de Paises</h1>
        <p className="subtitle">
          Crea, edita y organiza paises en una interfaz clara y moderna.
        </p>
      </header>

      <main className="app-main">
        <CountryList />
      </main>

      <footer className="app-footer">
        <p>CRUD de Paises © 2026</p>
      </footer>
    </div>
  );
}

export default App;
