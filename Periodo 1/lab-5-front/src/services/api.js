import axios from 'axios';

const API_URL = 'http://localhost:5000/api/projects';

export const getProjects = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error('Error al obtener los proyectos:', error);
    throw error;
  }
};

export const getProject = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener el proyecto:', error);
    throw error;
  }
};

export const createProject = async (project) => {
  try {
    const response = await axios.post(API_URL, project);
    return response.data;
  } catch (error) {
    console.error('Error al crear el proyecto:', error);
    throw error;
  }
};

export const updateProject = async (id, project) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, project);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar el proyecto:', error);
    throw error;
  }
};

export const deleteProject = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar el proyecto:', error);
    throw error;
  }
};
