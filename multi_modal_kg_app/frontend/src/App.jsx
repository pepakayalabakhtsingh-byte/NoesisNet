import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import DocumentViewer from './pages/DocumentViewer';
import KnowledgeGraph from './pages/KnowledgeGraph';
import SearchPage from './pages/Search';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="upload" element={<Upload />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="documents/:id" element={<DocumentViewer />} />
          <Route path="graph" element={<KnowledgeGraph />} />
          <Route path="documents" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
