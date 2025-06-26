import './assets/main.css';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';

import App from './App';
import ChildPage from './components/calendario/ChildPage';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/child" element={<ChildPage />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);
