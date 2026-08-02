import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import DocumentViewer from './pages/DocumentViewer';
import KnowledgeGraph from './pages/KnowledgeGraph';
import SearchPage from './pages/Search';
import AskAI from './pages/AskAI';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/dashboard" element={<ProtectedRoute />}>
              <Route index element={<Dashboard />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="ask" element={<AskAI />} />
              <Route path="upload" element={<Upload />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="documents/:id" element={<DocumentViewer />} />
              <Route path="graph" element={<KnowledgeGraph />} />
              <Route path="documents" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
