import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { OverviewPage } from "./pages/OverviewPage";
import { TransactionsPage } from "./pages/TransactionsPage";
import { CasesPage } from "./pages/CasesPage";
import { RulesPage } from "./pages/RulesPage";
import { ModelsPage } from "./pages/ModelsPage";
import { EvaluationPage } from "./pages/EvaluationPage";
import { DataAnalysisPage } from "./pages/DataAnalysisPage";
import { PreprocessingPage } from "./pages/PreprocessingPage";
import { PredictionPage } from "./pages/PredictionPage";
import { AuditPage } from "./pages/AuditPage";
import { AboutPage } from "./pages/AboutPage";
import { PresentationMode } from "./pages/PresentationMode";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--th-bg)]">
        <div className="flex items-center gap-3 text-[var(--th-text-secondary)]">
          <div className="w-2 h-2 rounded-full bg-[#C6F24E] pulse-dot" />
          <span className="font-mono text-sm tracking-tight">Verifying session…</span>
        </div>
      </div>
    );
  }
  if (user === null) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/present" element={
        <ProtectedRoute><PresentationMode /></ProtectedRoute>
      } />
      <Route path="/" element={
        <ProtectedRoute><Layout /></ProtectedRoute>
      }>
        <Route index element={<OverviewPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="cases" element={<CasesPage />} />
        <Route path="rules" element={<RulesPage />} />
        <Route path="analysis" element={<DataAnalysisPage />} />
        <Route path="preprocessing" element={<PreprocessingPage />} />
        <Route path="models" element={<ModelsPage />} />
        <Route path="evaluation" element={<EvaluationPage />} />
        <Route path="prediction" element={<PredictionPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="about" element={<AboutPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
