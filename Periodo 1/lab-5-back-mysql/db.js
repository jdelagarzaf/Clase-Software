const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();
// Configuración de la conexión a la base de datos PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'paises',
  port: process.env.DB_PORT || 3306,
  max: 10, // máximo número de clientes en el pool
});

// Función para verificar la conexión
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Conexión a PostgreSQL establecida con éxito');
    client.release();
  } catch (error) {
    console.error('Error al conectar a PostgreSQL:', error);
  }
}

testConnection();
module.exports = pool;