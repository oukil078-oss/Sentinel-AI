import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  X, ChevronLeft, ChevronRight, Play, Pause, Shield, BarChart3, Database,
  Cpu, AlertTriangle, CheckCircle2, Sparkles, ShieldCheck,
} from "lucide-react";
import { api } from "../lib/api";

export function PresentationMode() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    document.body.classList.add("presentation-mode");
    return () => document.body.classList.remove("presentation-mode");
  }, []);

  useEffect(() => {
    api.get("/api/dashboard/stats").then((r) => setStats(r.data));
    api.get("/api/ml/metrics").then((r) => setMetrics(r.data));
  }, []);

  const slides = useMemo(() => [
    {
      title: "Credit card fraud",
      subtitle: "is a $32 billion problem.",
      body: "Every year, fraudulent transactions cost the card industry tens of billions. We built Sentinel AI to fight back — in real time.",
      visual: <Shield className="w-48 h-48 text-[#C6F24E]" strokeWidth={0.8} />,
      notes: "Open with the scale of the problem. $32B annually. This motivates everything that follows — from data choices to model selection.",
    },
    {
      title: "The data",
      subtitle: "284,808 transactions · only 0.17% fraud.",
      body: "Our training set is extremely imbalanced. Most transactions are legitimate — but missing fraud is costly. This shapes every metric and model choice.",
      visual: (
        <div className="grid grid-cols-1 gap-3 min-w-[380px]">
          {[
            { label: "Total", value: "284,808", color: "#C6F24E" },
            { label: "Legitimate", value: "284,316", color: "#5AC8FA" },
            { label: "Fraudulent", value: "492", color: "#FF3B30" },
            { label: "Fraud rate", value: "0.17 %", color: "#FFB800" },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between p-5 rounded-3xl bg-[var(--th-subtle)] border border-[var(--th-border-strong)]">
              <span className="text-sm text-[var(--th-text-secondary)] font-medium">{s.label}</span>
              <span className="font-mono text-3xl tnum font-light" style={{ color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>
      ),
      notes: "Highlight imbalance. Plain accuracy is misleading here — a model predicting 'legit' for everything would score 99.83% accuracy but detect zero fraud.",
    },
    {
      title: "Preprocessing",
      subtitle: "SMOTE balances the training set.",
      body: "StandardScaler normalizes features for KNN/SVM. SMOTE synthesizes fraud examples in feature space — but only in training, never on the test set.",
      visual: (
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--th-text-secondary)] font-bold mb-4">Before</p>
            <div className="relative w-48 h-48 rounded-full bg-[#5AC8FA]/20 flex items-center justify-center">
              <div className="absolute top-2 right-4 w-3 h-3 rounded-full bg-[#FF3B30]" />
              <span className="text-4xl font-mono tnum text-[var(--th-text)] font-light">0.17%</span>
            </div>
            <p className="text-xs text-[var(--th-text-secondary)] mt-3">fraud</p>
          </div>
          <ChevronRight className="w-10 h-10 text-[#C6F24E]" />
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-[#C6F24E] font-bold mb-4">After SMOTE</p>
            <div className="relative w-48 h-48 rounded-full overflow-hidden bg-[#5AC8FA]/20">
              <div className="absolute inset-0 bg-gradient-to-r from-[#5AC8FA]/30 to-[#C6F24E]/30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-mono tnum text-[var(--th-text)] font-light">50 / 50</span>
              </div>
            </div>
            <p className="text-xs text-[var(--th-text-secondary)] mt-3">balanced</p>
          </div>
        </div>
      ),
      notes: "Critical moment: explain why we DON'T apply SMOTE to test data. This keeps evaluation honest and prevents data leakage.",
    },
    {
      title: "Five models",
      subtitle: "Random Forest wins at ROC-AUC.",
      body: "We compare KNN, Logistic Regression, Decision Tree, SVM, and Random Forest on hold-out data. RF balances precision and recall best.",
      visual: (
        <div className="grid grid-cols-1 gap-3 min-w-[420px]">
          {metrics?.metrics && Object.entries(metrics.metrics).sort((a: any, b: any) => b[1].roc_auc - a[1].roc_auc).map(([k, v]: any) => (
            <div key={k} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
              v.roc_auc === Math.max(...Object.values(metrics.metrics).map((m: any) => m.roc_auc))
                ? "bg-[#C6F24E]/10 border-[#C6F24E]/30"
                : "bg-[var(--th-subtle)] border-[var(--th-border-strong)]"
            }`}>
              <span className="text-sm text-[var(--th-text)] font-medium capitalize">{k.replace("_", " ")}</span>
              <div className="flex items-center gap-6">
                <span className="text-xs text-[var(--th-text-secondary)]">ACC <span className="font-mono tnum text-[var(--th-text)]">{(v.accuracy * 100).toFixed(2)}%</span></span>
                <span className="text-xs text-[var(--th-text-secondary)]">AUC <span className="font-mono tnum text-[#C6F24E]">{(v.roc_auc * 100).toFixed(1)}%</span></span>
              </div>
            </div>
          ))}
        </div>
      ),
      notes: "Walk through why Random Forest wins: ensemble learning, feature randomization, handles non-linear fraud patterns.",
    },
    {
      title: "Live operations",
      subtitle: "Every transaction gets scored. Every alert gets handled.",
      body: "Our production dashboard pairs ML predictions with analyst case management, rules engine, and full audit trail.",
      visual: (
        <div className="grid grid-cols-2 gap-4 min-w-[480px]">
          {[
            { label: "Transactions monitored", value: stats?.total_transactions || 0, color: "#C6F24E", icon: Database },
            { label: "Fraud detected", value: stats?.fraud_detected || 0, color: "#FF3B30", icon: AlertTriangle },
            { label: "Amount protected", value: `$${Math.round((stats?.amount_saved || 0) / 1000)}K`, color: "#5AC8FA", icon: ShieldCheck, isString: true },
            { label: "Cases resolved", value: stats?.cases?.resolved || 0, color: "#FFB800", icon: CheckCircle2 },
          ].map((s) => (
            <div key={s.label} className="p-6 rounded-3xl bg-[var(--th-subtle)] border border-[var(--th-border-strong)]">
              <s.icon className="w-6 h-6 mb-3" strokeWidth={1.5} style={{ color: s.color }} />
              <p className="font-mono text-3xl tnum font-light text-[var(--th-text)]">{s.isString ? s.value : (s.value as number).toLocaleString()}</p>
              <p className="text-xs text-[var(--th-text-secondary)] mt-2">{s.label}</p>
            </div>
          ))}
        </div>
      ),
      notes: "Show that Sentinel is not just a model — it's an end-to-end fraud operations platform. Emphasize the analyst workflow.",
    },
    {
      title: "Thank you.",
      subtitle: "Questions?",
      body: "Built on Kaggle creditcardfraud · trained with SMOTE · deployed with FastAPI + React.",
      visual: (
        <div className="flex flex-col items-center gap-6">
          <div className="w-28 h-28 rounded-[32px] bg-[#C6F24E] flex items-center justify-center text-[#0B0B0D]">
            <Shield strokeWidth={2} className="w-14 h-14" />
          </div>
          <div className="text-center">
            <p className="font-display text-3xl text-[var(--th-text)] font-light">Sentinel AI</p>
            <p className="text-[var(--th-text-secondary)] text-sm">Fraud Detection Platform · v2.0</p>
          </div>
        </div>
      ),
      notes: "Thank teacher/audience. Offer to demo the prediction lab or transaction explorer.",
    },
  ], [stats, metrics]);

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % slides.length), 9000);
    return () => clearTimeout(t);
  }, [playing, index, slides.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); setIndex((i) => Math.min(i + 1, slides.length - 1)); }
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
      if (e.key === "Escape") navigate("/");
      if (e.key === "p") setPlaying((p) => !p);
      if (e.key === "n") setShowNotes((s) => !s);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [slides.length, navigate]);

  const current = slides[index];

  return (
    <div className="fixed inset-0 bg-[var(--th-bg)] z-[1000] overflow-hidden">
      {/* Ambient */}
      <div className="absolute top-1/3 -left-40 w-[700px] h-[700px] bg-[#C6F24E]/[0.06] blur-[160px] rounded-full" />
      <div className="absolute bottom-0 -right-40 w-[600px] h-[600px] bg-[#C6F24E]/[0.04] blur-[140px] rounded-full" />

      {/* Controls */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-2">
        <button
          onClick={() => setShowNotes((s) => !s)}
          data-testid="present-notes-toggle"
          className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
            showNotes ? "bg-[#C6F24E] text-[#0B0B0D] border-[#C6F24E]" : "bg-[var(--th-surface)] text-[var(--th-text)] border-[var(--th-border-strong)] hover:border-[var(--th-border-strong)]"
          }`}
        >
          Notes
        </button>
        <button
          onClick={() => setPlaying((p) => !p)}
          data-testid="present-play-toggle"
          className="w-10 h-10 rounded-full bg-[var(--th-surface)] border border-[var(--th-border-strong)] flex items-center justify-center text-[var(--th-text)] hover:border-[var(--th-border-strong)] transition-all"
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" strokeWidth={2.5} />}
        </button>
        <button
          onClick={() => navigate("/")}
          data-testid="present-exit-btn"
          className="w-10 h-10 rounded-full bg-[#FF3B30]/10 border border-[#FF3B30]/20 flex items-center justify-center text-[#FF3B30] hover:bg-[#FF3B30]/20 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Slide counter */}
      <div className="absolute top-6 left-6 z-50 px-4 py-2 rounded-full bg-[var(--th-surface)]/80 backdrop-blur-xl border border-[var(--th-border-strong)] font-mono text-xs text-[var(--th-text-secondary)] tnum">
        {String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
      </div>

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-[var(--th-border)] z-50">
        <motion.div
          key={index + (playing ? "p" : "s")}
          initial={{ width: "0%" }}
          animate={{ width: playing ? "100%" : `${((index + 1) / slides.length) * 100}%` }}
          transition={{ duration: playing ? 9 : 0.4, ease: "linear" }}
          className="h-full bg-[#C6F24E]"
        />
      </div>

      {/* Slide */}
      <div className="relative h-full flex items-center justify-center px-8 sm:px-12 lg:px-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-[1400px] w-full"
          >
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-[#C6F24E] font-bold mb-6">
                Slide {String(index + 1).padStart(2, "0")} · Sentinel AI
              </p>
              <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-light text-[var(--th-text)] tracking-[-0.03em] leading-[0.95] mb-6 text-balance">
                {current.title}
              </h2>
              <h3 className="font-display text-2xl sm:text-3xl text-[#C6F24E] font-light mb-8 text-balance">
                {current.subtitle}
              </h3>
              <p className="text-base sm:text-lg text-[var(--th-text-secondary)] leading-relaxed max-w-xl text-balance">
                {current.body}
              </p>
            </div>
            <div className="flex items-center justify-center">
              {current.visual}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Speaker notes */}
      <AnimatePresence>
        {showNotes && (
          <motion.div
            initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 120, opacity: 0 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 max-w-[640px] w-full mx-auto px-6"
          >
            <div className="rounded-3xl bg-[var(--th-surface)] border border-[#C6F24E]/20 p-5 shadow-2xl">
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#C6F24E] font-bold mb-2">Speaker notes</p>
              <p className="text-sm text-[var(--th-text)] leading-relaxed">{current.notes}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav buttons */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          data-testid="present-prev-btn"
          className="w-12 h-12 rounded-full bg-[var(--th-surface)] border border-[var(--th-border-strong)] flex items-center justify-center text-[var(--th-text)] hover:border-[var(--th-border-strong)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`transition-all rounded-full ${
                i === index ? "w-10 h-2 bg-[#C6F24E]" : "w-2 h-2 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => setIndex((i) => Math.min(slides.length - 1, i + 1))}
          disabled={index === slides.length - 1}
          data-testid="present-next-btn"
          className="w-12 h-12 rounded-full bg-[#C6F24E] text-[#0B0B0D] flex items-center justify-center hover:bg-[#D4F475] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_4px_30px_rgba(198,242,78,0.4)]"
        >
          <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
        </button>
      </div>

      <div className="absolute bottom-3 right-6 text-[10px] text-[var(--th-text-dim)] font-mono tnum">
        ← → to navigate · P to pause · N for notes · ESC to exit
      </div>
    </div>
  );
}
