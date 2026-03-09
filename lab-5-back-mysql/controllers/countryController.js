const pool = require('../db');

// Obtener todos los países
exports.getAllCountries = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM country ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener los países:', error);
    res.status(500).json({ error: 'Error al obtener los países' });
  }
};

// Obtener un país por ID
exports.getCountryById = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM country WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'País no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener el país:', error);
    res.status(500).json({ error: 'Error al obtener el país' });
  }
};

// Crear un nuevo país
exports.createCountry = async (req, res) => {
  const { name, capital, currency } = req.body;

  // Validación básica
  if (!name) {
    return res.status(400).json({ error: 'El nombre del país es obligatorio' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO country (name, capital, currency) VALUES ($1, $2, $3) RETURNING *',
      [name, capital, currency]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear el país:', error);
    res.status(500).json({ error: 'Error al crear el país' });
  }
};

// Actualizar un país existente
exports.updateCountry = async (req, res) => {
  const { name, capital, currency } = req.body;
  const countryId = req.params.id;

  // Validación básica
  if (!name) {
    return res.status(400).json({ error: 'El nombre del país es obligatorio' });
  }

  try {
    // Verificar si el país existe
    const checkResult = await pool.query('SELECT * FROM country WHERE id = $1', [countryId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'País no encontrado' });
    }

    // Actualizar el país
    const updateResult = await pool.query(
      'UPDATE country SET name = $1, capital = $2, currency = $3 WHERE id = $4 RETURNING *',
      [name, capital, currency, countryId]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Error al actualizar el país:', error);
    res.status(500).json({ error: 'Error al actualizar el país' });
  }
};

// Eliminar un país
exports.deleteCountry = async (req, res) => {
  const countryId = req.params.id;
  try {
    // Verificar si el país existe
    const checkResult = await pool.query('SELECT * FROM country WHERE id = $1', [countryId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'País no encontrado' });
    }
    
    // Eliminar el país
    await pool.query('DELETE FROM country WHERE id = $1', [countryId]);
    res.json({ message: 'País eliminado con éxito' });
  } catch (error) {
    console.error('Error al eliminar el país:', error);
    res.status(500).json({ error: 'Error al eliminar el país' });
  }
};