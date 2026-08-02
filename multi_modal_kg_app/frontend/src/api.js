import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // Only redirect if not already on login/register to avoid loops
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/api/upload', formData);
  return response.data;
};

export const getDocuments = async () => {
  const response = await api.get('/api/documents');
  return response.data;
};

export const getDocumentById = async (id) => {
  const response = await api.get(`/api/documents/${id}`);
  return response.data;
};

export const triggerEntityExtraction = async (id) => {
  const response = await api.post(`/api/documents/${id}/extract-entities`);
  return response.data;
};

export const reprocessDocument = async (id) => {
  const response = await api.post(`/api/documents/${id}/reprocess`);
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

export const askQuestion = async (question) => {
  const response = await api.post('/api/qa/ask', { question });
  return response.data;
};

export const uploadQAGroundTruth = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/api/evaluation/upload-qa', formData);
  return response.data;
};

export const uploadEntityGroundTruth = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/api/evaluation/upload-entities', formData);
  return response.data;
};

export const getGroundTruthStats = async () => {
  const response = await api.get('/api/evaluation/ground-truth');
  return response.data;
};

export const triggerEvaluation = async () => {
  const response = await api.post('/api/evaluation/run');
  return response.data;
};

export const getEvaluationRuns = async () => {
  const response = await api.get('/api/evaluation/runs');
  return response.data;
};
