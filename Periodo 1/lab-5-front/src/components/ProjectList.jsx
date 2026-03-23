import React, { useEffect, useMemo, useState } from 'react';
import { deleteProject, getProjects } from '../services/api';
import ProjectForm from './ProjectForm';
import ProjectItem from './ProjectItem';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await getProjects();
      setProjects(data);
      setError(null);
    } catch {
      setError('Error al cargar los proyectos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const editingProject = useMemo(
    () => projects.find((project) => project.id === editingId) || null,
    [projects, editingId]
  );

  const handleDelete = async (id) => {
    if (!window.confirm('Estas seguro de que quieres eliminar este proyecto?')) {
      return;
    }

    try {
      await deleteProject(id);
      setProjects(projects.filter((project) => project.id !== id));
      if (editingId === id) {
        setEditingId(null);
      }
    } catch {
      setError('Error al eliminar el proyecto');
    }
  };

  const handleEdit = (id) => {
    setEditingId(id);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleFormSubmit = () => {
    fetchProjects();
    setEditingId(null);
  };

  if (loading) {
    return <div className="state-card">Cargando proyectos...</div>;
  }

  if (error) {
    return <div className="state-card error">{error}</div>;
  }

  return (
    <div className="project-list">
      <section className="panel panel-form">
        <div className="panel-heading">
          <h2>{editingProject ? 'Editar proyecto' : 'Nuevo proyecto'}</h2>
          {editingProject && (
            <button type="button" className="ghost-btn" onClick={handleCancelEdit}>
              Cancelar edicion
            </button>
          )}
        </div>

        <p className="panel-copy">
          {editingProject
            ? 'Actualiza nombre, descripcion, fecha, integrantes y area del proyecto.'
            : 'Registra un proyecto con su descripcion, fecha, numero de integrantes y area.'}
        </p>

        <ProjectForm
          project={editingProject}
          onSubmitSuccess={handleFormSubmit}
          onCancel={editingProject ? handleCancelEdit : null}
        />
      </section>

      <section className="panel panel-list">
        <div className="panel-heading">
          <h2>Lista de proyectos</h2>
          <span className="badge">
            {projects.length} {projects.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        <div className="projects">
          {projects.length === 0 ? (
            <p className="empty-state">No hay proyectos registrados todavia.</p>
          ) : (
            projects.map((project) => (
              <ProjectItem
                key={project.id}
                project={project}
                onDelete={() => handleDelete(project.id)}
                onEdit={() => handleEdit(project.id)}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default ProjectList;
