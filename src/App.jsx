import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import { CodeEditorProvider } from "./context/CodeEditorContext";
import { ExecutionProvider } from "./context/ExecutionContext";
import { VisualizationProvider } from "./context/VisualizationContext";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { ProtectedRoute } from "./components/authentication/ProtectedRoute";
import EditorPage from "./pages/EditorPage";
import LoginPage from "./pages/LoginPage";
import "./styles/app.css";

const AlgorithmLibraryPage = lazy(() => import("./pages/AlgorithmLibraryPage"));
const SavedSessionsPage = lazy(() => import("./pages/SavedSessionsPage"));

function AppRoutes() {
  return (
    <Suspense
      fallback={
        <main className="route-loading">
          <p>Loading route...</p>
        </main>
      }
    >
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/editor" replace />} />
        <Route path="/editor" element={<ProtectedRoute element={<EditorPage />} />} />
        <Route path="/library" element={<ProtectedRoute element={<AlgorithmLibraryPage />} />} />
        <Route path="/saved" element={<ProtectedRoute element={<SavedSessionsPage />} />} />
        <Route path="/saved/:id" element={<ProtectedRoute element={<SavedSessionsPage />} />} />
        <Route path="*" element={<Navigate to="/editor" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <ExecutionProvider>
            <VisualizationProvider>
              <CodeEditorProvider>
                <div className="app-shell">
                  <Navbar />
                  <AppRoutes />
                </div>
              </CodeEditorProvider>
            </VisualizationProvider>
          </ExecutionProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
