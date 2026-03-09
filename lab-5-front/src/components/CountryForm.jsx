import React, { useEffect, useState } from 'react';
import { createCountry, updateCountry } from '../services/api.js';

const emptyForm = {
  name: '',
  capital: '',
  currency: ''
};

const CountryForm = ({ country, onSubmitSuccess, onCancel }) => {
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (country) {
      setFormData({
        name: country.name || '',
        capital: country.capital || '',
        currency: country.currency || ''
      });
      return;
    }

    setFormData(emptyForm);
  }, [country]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('El nombre del pais es obligatorio');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (country) {
        await updateCountry(country.id, formData);
      } else {
        await createCountry(formData);
      }

      setFormData(emptyForm);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch {
      setError('Error al guardar el pais');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="country-form">
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
          placeholder="Ej. Mexico"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="capital">Capital</label>
        <input
          type="text"
          id="capital"
          name="capital"
          value={formData.capital}
          onChange={handleChange}
          disabled={submitting}
          placeholder="Ej. Ciudad de Mexico"
        />
      </div>

      <div className="form-group">
        <label htmlFor="currency">Moneda</label>
        <input
          type="text"
          id="currency"
          name="currency"
          value={formData.currency}
          onChange={handleChange}
          disabled={submitting}
          placeholder="Ej. Peso mexicano"
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="primary-btn" disabled={submitting}>
          {submitting ? 'Guardando...' : country ? 'Actualizar pais' : 'Crear pais'}
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

export default CountryForm;
