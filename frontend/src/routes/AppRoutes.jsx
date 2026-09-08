import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import HomePage from '../pages/HomePage';
import SystemStatusPage from '../pages/SystemStatusPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import NotFoundPage from '../pages/NotFoundPage';
import ProtectedRoute from '../components/common/ProtectedRoute';

import ProjectsPage from '../pages/ProjectsPage';
import ProjectDetailsPage from '../pages/ProjectDetailsPage';
import TasksPage from '../pages/TasksPage';
import MeetingsPage from '../pages/MeetingsPage';
import MeetingDetailsPage from '../pages/MeetingDetailsPage';
import CalendarPage from '../pages/CalendarPage';
import KnowledgePage from '../pages/KnowledgePage';
import ArticleDetailsPage from '../pages/ArticleDetailsPage';
import TeamsPage from '../pages/TeamsPage';
import TeamDetailsPage from '../pages/TeamDetailsPage';

export default function AppRoutes() {
  const [backendStatus, setBackendStatus] = useState('checking');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isLandingPage = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white">
      <Navbar
        backendStatus={backendStatus}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="flex-1">
        <Routes>
          {/* Public SaaS Landing Page */}
          <Route path="/" element={<HomePage onStatusUpdate={setBackendStatus} />} />

          {/* Developer / Technical Health Pages */}
          <Route
            path="/system-status"
            element={<SystemStatusPage onStatusUpdate={setBackendStatus} />}
          />
          <Route
            path="/admin/health"
            element={<SystemStatusPage onStatusUpdate={setBackendStatus} />}
          />

          {/* Authentication */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Application Modules */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams"
            element={
              <ProtectedRoute>
                <TeamsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams/:id"
            element={
              <ProtectedRoute>
                <TeamDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <ProjectDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <TasksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meetings"
            element={
              <ProtectedRoute>
                <MeetingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meetings/:id"
            element={
              <ProtectedRoute>
                <MeetingDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/knowledge"
            element={
              <ProtectedRoute>
                <KnowledgePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/knowledge-base"
            element={
              <ProtectedRoute>
                <KnowledgePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/knowledge/:id"
            element={
              <ProtectedRoute>
                <ArticleDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/knowledge-base/:id"
            element={
              <ProtectedRoute>
                <ArticleDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {/* Show AppRoutes minimal footer only on in-app pages (Landing page has its own rich LandingFooter) */}
      {!isLandingPage && (
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>Projects, Meetings, Calendar, Knowledge Base • PMCKB Workspace OS</p>
            <p>© 2026 PMCKB. All rights reserved.</p>
          </div>
        </footer>
      )}
    </div>
  );
}
