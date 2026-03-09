import React from 'react';

const CountryItem = ({ country, onDelete, onEdit }) => {
  return (
    <article className="country-item">
      <div className="country-info">
        <p className="country-tag">Pais</p>
        <h3>{country.name}</h3>

        <div className="country-meta">
          <p>
            <span>Capital</span>
            {country.capital || 'No especificada'}
          </p>
          <p>
            <span>Moneda</span>
            {country.currency || 'No especificada'}
          </p>
        </div>
      </div>

      <div className="country-actions">
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

export default CountryItem;
