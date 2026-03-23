const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'bdpaises',
  port: process.env.DB_PORT || 5432,
  max: 10
});

async function initializeDatabase() {
  try {
    await pool.query('SELECT 1');
    console.log('Conexion a PostgreSQL establecida con exito');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS project (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        "date" DATE NOT NULL,
        num_integrantes INTEGER NOT NULL CHECK (num_integrantes >= 1),
        area VARCHAR(255) NOT NULL
      )
    `);

    console.log('Tabla project verificada/lista');
  } catch (error) {
    console.error('Error al inicializar PostgreSQL:', error);
  }
}

initializeDatabase();

module.exports = pool;
