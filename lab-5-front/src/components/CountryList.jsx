import React, { useEffect, useMemo, useState } from 'react';
import { deleteCountry, getCountries } from '../services/api';
import CountryForm from './CountryForm';
import CountryItem from './CountryItem';

const CountryList = () => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const fetchCountries = async () => {
    setLoading(true);
    try {
      const data = await getCountries();
      setCountries(data);
      setError(null);
    } catch {
      setError('Error al cargar los paises');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  const editingCountry = useMemo(
    () => countries.find((country) => country.id === editingId) || null,
    [countries, editingId]
  );

  const handleDelete = async (id) => {
    if (!window.confirm('Estas seguro de que quieres eliminar este pais?')) {
      return;
    }

    try {
      await deleteCountry(id);
      setCountries(countries.filter((country) => country.id !== id));
      if (editingId === id) {
        setEditingId(null);
      }
    } catch {
      setError('Error al eliminar el pais');
    }
  };

  const handleEdit = (id) => {
    setEditingId(id);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleFormSubmit = () => {
    fetchCountries();
    setEditingId(null);
  };

  if (loading) {
    return <div className="state-card">Cargando paises...</div>;
  }

  if (error) {
    return <div className="state-card error">{error}</div>;
  }

  return (
    <div className="country-list">
      <section className="panel panel-form">
        <div className="panel-heading">
          <h2>{editingCountry ? 'Editar pais' : 'Nuevo pais'}</h2>
          {editingCountry && (
            <button type="button" className="ghost-btn" onClick={handleCancelEdit}>
              Cancelar edicion
            </button>
          )}
        </div>

        <p className="panel-copy">
          {editingCountry
            ? 'Actualiza los datos del pais seleccionado y guarda los cambios.'
            : 'Registra un nuevo pais con su capital y moneda principal.'}
        </p>

        <CountryForm
          country={editingCountry}
          onSubmitSuccess={handleFormSubmit}
          onCancel={editingCountry ? handleCancelEdit : null}
        />
      </section>

      <section className="panel panel-list">
        <div className="panel-heading">
          <h2>Lista de paises</h2>
          <span className="badge">
            {countries.length} {countries.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        <div className="countries">
          {countries.length === 0 ? (
            <p className="empty-state">No hay paises registrados todavia.</p>
          ) : (
            countries.map((country) => (
              <CountryItem
                key={country.id}
                country={country}
                onDelete={() => handleDelete(country.id)}
                onEdit={() => handleEdit(country.id)}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default CountryList;
