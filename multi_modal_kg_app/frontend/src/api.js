import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getDocuments = async () => {
  const response = await api.get('/documents');
  return response.data;
};

export const getDocumentById = async (id) => {
  const response = await api.get(`/documents/${id}`);
  return response.data;
};

export const triggerEntityExtraction = async (id) => {
  const response = await api.post(`/documents/${id}/extract-entities`);
  return response.data;
};

export const fetchGraphData = async (limit = 200) => {
  const response = await api.get(`/api/graph/graph-data?limit=${limit}`);
  return response.data;
};

export const triggerFullBuild = async () => {
  const response = await api.post('/api/graph/build');
  return response.data;
};

export const searchDocuments = async (query, top_k = 5) => {
  const response = await api.get(`/api/search?q=${encodeURIComponent(query)}&top_k=${top_k}`);
  return response.data;
};

export const triggerRebuildEmbeddings = async () => {
  const response = await api.post('/api/search/embeddings/rebuild-all');
  return response.data;
};
