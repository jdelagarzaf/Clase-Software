const pool = require('../db');

function validateProjectInput(project) {
  const { name, date, numIntegrantes, area } = project;

  if (!name || !name.trim()) {
    return 'El nombre del proyecto es obligatorio';
  }

  if (!date) {
    return 'La fecha del proyecto es obligatoria';
  }

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return 'La fecha del proyecto no es valida';
  }

  const parsedNumIntegrantes = Number(numIntegrantes);
  if (!Number.isInteger(parsedNumIntegrantes) || parsedNumIntegrantes < 1) {
    return 'El numero de integrantes debe ser un entero mayor o igual a 1';
  }

  if (!area || !area.trim()) {
    return 'El area del proyecto es obligatoria';
  }

  return null;
}

exports.getAllProjects = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, description, "date", num_integrantes AS "numIntegrantes", area FROM project ORDER BY name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener los proyectos:', error);
    res.status(500).json({ error: 'Error al obtener los proyectos' });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, description, "date", num_integrantes AS "numIntegrantes", area FROM project WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener el proyecto:', error);
    res.status(500).json({ error: 'Error al obtener el proyecto' });
  }
};

exports.createProject = async (req, res) => {
  const { name, description, date, numIntegrantes, area } = req.body;

  const validationError = validateProjectInput({ name, date, numIntegrantes, area });
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const result = await pool.query(
      'INSERT INTO project (name, description, "date", num_integrantes, area) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, description, "date", num_integrantes AS "numIntegrantes", area',
      [name.trim(), description?.trim() || null, date, Number(numIntegrantes), area.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear el proyecto:', error);
    res.status(500).json({ error: 'Error al crear el proyecto' });
  }
};

exports.updateProject = async (req, res) => {
  const projectId = req.params.id;
  const { name, description, date, numIntegrantes, area } = req.body;

  const validationError = validateProjectInput({ name, date, numIntegrantes, area });
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const checkResult = await pool.query('SELECT id FROM project WHERE id = $1', [projectId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const updateResult = await pool.query(
      'UPDATE project SET name = $1, description = $2, "date" = $3, num_integrantes = $4, area = $5 WHERE id = $6 RETURNING id, name, description, "date", num_integrantes AS "numIntegrantes", area',
      [name.trim(), description?.trim() || null, date, Number(numIntegrantes), area.trim(), projectId]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Error al actualizar el proyecto:', error);
    res.status(500).json({ error: 'Error al actualizar el proyecto' });
  }
};

exports.deleteProject = async (req, res) => {
  const projectId = req.params.id;

  try {
    const checkResult = await pool.query('SELECT id FROM project WHERE id = $1', [projectId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    await pool.query('DELETE FROM project WHERE id = $1', [projectId]);
    res.json({ message: 'Proyecto eliminado con exito' });
  } catch (error) {
    console.error('Error al eliminar el proyecto:', error);
    res.status(500).json({ error: 'Error al eliminar el proyecto' });
  }
};
