import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import HomePage from '../pages/HomePage';
import NotFoundPage from '../pages/NotFoundPage';

export default function AppRoutes() {
  const [backendStatus, setBackendStatus] = useState('checking');

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar backendStatus={backendStatus} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage onStatusUpdate={setBackendStatus} />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>Projects, Meetings, Calendar, Knowledge Base • Phase 1 Architecture Foundation</p>
      </footer>
    </div>
  );
}
