import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CodeEditorProvider } from './context/CodeEditorContext';
import { ExecutionProvider } from './context/ExecutionContext';
import { VisualizationProvider } from './context/VisualizationContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/authentication/ProtectedRoute';
import AppNavbar from './components/layout/AppNavbar';
import EditorNavbar from './components/layout/EditorNavbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import EditorPage from './pages/EditorPage';
import './styles/app.css';

const AlgorithmLibraryPage = lazy(() => import('./pages/AlgorithmLibraryPage'));
const SavedSessionsPage = lazy(() => import('./pages/SavedSessionsPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));

function AppRoutes() {
  return (
    <Suspense fallback={<main className="route-loading"><p>Loading...</p></main>}>
      <Routes>
        {/* Public routes — no auth needed */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes — auth required */}
        <Route path="/home" element={<ProtectedRoute element={<HomePage />} />} />
        <Route path="/editor" element={<ProtectedRoute element={<EditorPage />} />} />
        <Route path="/history" element={<ProtectedRoute element={<HistoryPage />} />} />
        <Route path="/profile" element={<ProtectedRoute element={<ProfilePage />} />} />
        <Route path="/library" element={<ProtectedRoute element={<AlgorithmLibraryPage />} />} />
        <Route path="/saved" element={<ProtectedRoute element={<SavedSessionsPage />} />} />
        <Route path="/saved/:id" element={<ProtectedRoute element={<SavedSessionsPage />} />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

// Pages that show no navbar at all (they handle their own top-controls)
const NO_NAVBAR_PAGES = ['/', '/login'];
// Pages that show the minimal editor navbar
const EDITOR_NAVBAR_PAGES = ['/editor', '/history', '/saved', '/library'];

function AppShell() {
  const { pathname } = useLocation();
  const isNoNavbar = NO_NAVBAR_PAGES.includes(pathname);
  const isEditorNavbar = EDITOR_NAVBAR_PAGES.some(p => pathname.startsWith(p));

  return (
    <div className="app-shell">
      {!isNoNavbar && (isEditorNavbar ? <EditorNavbar /> : <AppNavbar />)}
      <AppRoutes />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <LanguageProvider>
            <ExecutionProvider>
              <VisualizationProvider>
                <CodeEditorProvider>
                  <AppShell />
                </CodeEditorProvider>
              </VisualizationProvider>
            </ExecutionProvider>
          </LanguageProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
