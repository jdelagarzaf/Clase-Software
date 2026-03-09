import React from 'react';

const CountryItem = ({ country, onDelete, onEdit }) => {
  return (
    <div className="country-item">
      <div className="country-info">
        <h3>{country.name}</h3>
        <p><strong>Capital:</strong> {country.capital || 'No especificada'}</p>
        <p><strong>Moneda:</strong> {country.currency || 'No especificada'}</p>
      </div>
      <div className="country-actions">
        <button onClick={onEdit} className="edit-btn">Editar</button>
        <button onClick={onDelete} className="delete-btn">Eliminar</button>
      </div>
    </div>
  );
};

export default CountryItem;