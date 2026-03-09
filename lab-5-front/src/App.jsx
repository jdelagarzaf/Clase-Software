import ProjectList from './components/ProjectList';
import './App.css';

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="eyebrow">Laboratorio 5</p>
        <h1>Administrador de Proyectos</h1>
        <p className="subtitle">
          Crea, edita y organiza proyectos de software en una interfaz clara y moderna.
        </p>
      </header>

      <main className="app-main">
        <ProjectList />
      </main>

      <footer className="app-footer">
        <p>CRUD de Proyectos © 2026</p>
      </footer>
    </div>
  );
}

export default App;
