import React from 'react';

const ProjectItem = ({ project, onDelete, onEdit }) => {
  return (
    <article className="project-item">
      <div className="project-info">
        <p className="project-tag">Proyecto</p>
        <h3>{project.name}</h3>

        <p className="project-description">{project.description || 'Sin descripcion'}</p>

        <div className="project-meta">
          <p>
            <span>Fecha</span>
            {project.date || 'No especificada'}
          </p>
          <p>
            <span>Integrantes</span>
            {project.numIntegrantes}
          </p>
          <p>
            <span>Area</span>
            {project.area || 'No especificada'}
          </p>
        </div>
      </div>

      <div className="project-actions">
        <button type="button" onClick={onEdit} className="edit-btn">
          Editar
        </button>
        <button type="button" onClick={onDelete} className="delete-btn">
          Eliminar
        </button>
      </div>
    </article>
  );
};

export default ProjectItem;
