import React, { useState, useEffect } from 'react';
import { createCountry, updateCountry } from '../services/api.js';
const CountryForm = ({ country, onSubmitSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    capital: '',
    currency: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (country) {
      setFormData({
        name: country.name || '',
        capital: country.capital || '',
        currency: country.currency || ''
      });
    }
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
      setError('El nombre del país es obligatorio');
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
      setFormData({ name: '', capital: '', currency: '' });
      if (onSubmitSuccess) onSubmitSuccess();
    } catch (err) {
      setError('Error al guardar el país');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="country-form">
      {error && <div className="error">{error}</div>}
      <div className="form-group">
        <label htmlFor="name">Nombre*:</label>
        <input type="text" id="name" name="name" value={formData.name}
        onChange={handleChange} disabled={submitting} required />
      </div>
      <div className="form-group">
        <label htmlFor="capital">Capital:</label>
        <input type="text" id="capital" name="capital" value={formData.capital}
        onChange={handleChange} disabled={submitting} />
      </div>
      <div className="form-group">
        <label htmlFor="currency">Moneda:</label>
        <input type="text" id="currency" name="currency" value={formData.currency}
        onChange={handleChange} disabled={submitting} />
      </div>
      <div className="form-actions">
        <button type="submit" disabled={submitting}>
          {submitting ? 'Guardando...' : country ? 'Actualizar' : 'Crear'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={submitting}>
          Cancelar
          </button>
        )}
      </div>
    </form>
  );
};
  
export default CountryForm;