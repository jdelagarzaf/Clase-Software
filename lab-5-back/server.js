const express = require('express');
const cors = require('cors');
const projectRoutes = require('./routes/projectRoutes');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/projects', projectRoutes);

app.get('/', (req, res) => {
  res.send('API de Proyectos funcionando correctamente con PostgreSQL');
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
