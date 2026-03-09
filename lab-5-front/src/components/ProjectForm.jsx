import React, { useEffect, useState } from 'react';
import { createProject, updateProject } from '../services/api.js';

const emptyForm = {
  name: '',
  description: '',
  date: '',
  numIntegrantes: 1,
  area: ''
};

const ProjectForm = ({ project, onSubmitSuccess, onCancel }) => {
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        date: project.date || '',
        numIntegrantes: project.numIntegrantes || 1,
        area: project.area || ''
      });
      return;
    }

    setFormData(emptyForm);
  }, [project]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'numIntegrantes' ? Number(value) : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('El nombre del proyecto es obligatorio');
      return;
    }

    if (!formData.date) {
      setError('La fecha es obligatoria');
      return;
    }

    if (!Number.isInteger(Number(formData.numIntegrantes)) || Number(formData.numIntegrantes) < 1) {
      setError('El numero de integrantes debe ser mayor o igual a 1');
      return;
    }

    if (!formData.area.trim()) {
      setError('El area es obligatoria');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (project) {
        await updateProject(project.id, formData);
      } else {
        await createProject(formData);
      }

      setFormData(emptyForm);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch {
      setError('Error al guardar el proyecto');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="project-form">
      {error && <div className="error">{error}</div>}

      <div className="form-group">
        <label htmlFor="name">Nombre</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          disabled={submitting}
          placeholder="Ej. Plataforma de Gestion"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Descripcion</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          disabled={submitting}
          placeholder="Resumen breve del proyecto"
          rows="3"
        />
      </div>

      <div className="form-group">
        <label htmlFor="date">Fecha</label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          disabled={submitting}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="numIntegrantes">Num. Integrantes</label>
        <input
          type="number"
          id="numIntegrantes"
          name="numIntegrantes"
          value={formData.numIntegrantes}
          onChange={handleChange}
          disabled={submitting}
          min="1"
          step="1"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="area">Area</label>
        <input
          type="text"
          id="area"
          name="area"
          value={formData.area}
          onChange={handleChange}
          disabled={submitting}
          placeholder="Ej. Web, IA, Movil"
          required
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="primary-btn" disabled={submitting}>
          {submitting ? 'Guardando...' : project ? 'Actualizar proyecto' : 'Crear proyecto'}
        </button>

        {onCancel && (
          <button
            type="button"
            className="secondary-btn"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
};

export default ProjectForm;
