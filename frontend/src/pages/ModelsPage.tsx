import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Cpu, Play, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { api, formatApiError } from "../lib/api";
import { PageHeader, Panel, Button, StatusPill } from "../components/ui";
import { useToast } from "../components/Toast";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";

const MODEL_META: Record<string, { label: string; desc: string; color: string }> = {
  random_forest: { label: "Random Forest", desc: "120 trees · max depth 14", color: "#C6F24E" },
  knn: { label: "K-Nearest Neighbors", desc: "k=5 · Euclidean distance", color: "#5AC8FA" },
  logistic_regression: { label: "Logistic Regression", desc: "Probabilistic baseline", color: "#FFB800" },
  decision_tree: { label: "Decision Tree", desc: "Interpretable rules · depth 12", color: "#FF8A00" },
  svm: { label: "Support Vector Machine", desc: "RBF kernel · gamma=scale", color: "#9D7FFF" },
};

export function ModelsPage() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<any>(null);
  const [retraining, setRetraining] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const load = async () => {
    try {
      const { data } = await api.get("/api/ml/metrics");
      setMetrics(data);
    } catch (err: any) { toast(formatApiError(err), "error"); }
  };
  useEffect(() => { load(); }, []);

  const retrain = async () => {
    setRetraining(true);
    setLogs([]);
    const pushLog = (l: string) => setLogs((prev) => [...prev, l]);
    pushLog("› Starting retraining pipeline…");
    pushLog("› Loading dataset (30,000 transactions)…");
    pushLog("› Applying StandardScaler…");
    pushLog("› Running SMOTE resampling…");
    pushLog("› Training Random Forest (120 estimators, depth 14)…");
    pushLog("› Training KNN (k=5, Euclidean)…");
    pushLog("› Training Logistic Regression…");
    pushLog("› Training Decision Tree (depth 12)…");
    pushLog("› Training SVM (RBF kernel)…");
    try {
      const { data } = await api.post("/api/ml/retrain");
      pushLog(`✓ Training complete. Models: ${Object.keys(data.metrics).join(", ")}`);
      toast("Models retrained successfully", "success");
      load();
    } catch (err: any) {
      pushLog(`✗ Training failed: ${formatApiError(err)}`);
      toast(formatApiError(err), "error");
    } finally { setRetraining(false); }
  };

  const comparison = metrics?.metrics ? Object.entries(metrics.metrics).map(([k, v]: any) => ({
    model: MODEL_META[k]?.label || k,
    key: k,
    accuracy: (v.accuracy * 100),
    precision: (v.precision * 100),
    recall: (v.recall * 100),
    f1: (v.f1 * 100),
    roc_auc: (v.roc_auc * 100),
    color: MODEL_META[k]?.color || "#C6F24E",
  })) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ML pipeline"
        title="Model training console"
        subtitle="Five scikit-learn models trained on 30K transactions with SMOTE-resampled class balance. Retraining recomputes every metric."
        actions={
          <Button variant="primary" onClick={retrain} disabled={retraining} testid="retrain-btn">
            <Sparkles className="w-4 h-4" strokeWidth={2.2} />
            {retraining ? "Training…" : "Retrain all models"}
          </Button>
        }
      />

      {/* Pipeline visual */}
      <Panel>
        <h3 className="font-display text-lg text-white mb-5">Training pipeline</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {[
            { step: "01", label: "Ingest", desc: "30K rows" },
            { step: "02", label: "Scale", desc: "StandardScaler" },
            { step: "03", label: "SMOTE", desc: "Class balance" },
            { step: "04", label: "Train", desc: "5 models" },
            { step: "05", label: "Evaluate", desc: "Hold-out test" },
          ].map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="p-4 rounded-2xl bg-white/[0.02] border border-white/5"
            >
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#C6F24E] font-bold mb-2">{s.step}</p>
              <p className="text-sm text-white font-semibold">{s.label}</p>
              <p className="text-xs text-[#8A8A93]">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </Panel>

      {/* Model cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {metrics?.metrics && Object.entries(metrics.metrics).map(([k, v]: any) => (
          <motion.div key={k} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Panel>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#C6F24E] font-bold mb-1">
                    {MODEL_META[k]?.label || k}
                  </p>
                  <p className="text-xs text-[#8A8A93]">{MODEL_META[k]?.desc}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-[#C6F24E]/10 flex items-center justify-center text-[#C6F24E]">
                  <Cpu className="w-4 h-4" strokeWidth={2} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  ["Accuracy", v.accuracy * 100],
                  ["Precision", v.precision * 100],
                  ["Recall", v.recall * 100],
                  ["F1 Score", v.f1 * 100],
                  ["ROC-AUC", v.roc_auc * 100],
                  ["PR-AUC", v.pr_auc * 100],
                ].map(([label, val]) => (
                  <div key={label as string} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <p className="text-[9px] uppercase tracking-[0.18em] text-[#8A8A93] font-bold">{label}</p>
                    <p className="font-mono text-base text-white mt-1 tnum font-light">
                      {(val as number).toFixed(2)}%
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                {[
                  { l: "TP", v: v.confusion_matrix.tp, c: "#C6F24E" },
                  { l: "TN", v: v.confusion_matrix.tn, c: "#5AC8FA" },
                  { l: "FP", v: v.confusion_matrix.fp, c: "#FFB800" },
                  { l: "FN", v: v.confusion_matrix.fn, c: "#FF3B30" },
                ].map((c) => (
                  <div key={c.l} className="py-2 rounded-lg" style={{ background: `${c.c}12` }}>
                    <p className="font-mono tnum text-sm font-semibold" style={{ color: c.c }}>{c.v}</p>
                    <p className="uppercase tracking-wider font-bold" style={{ color: c.c }}>{c.l}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </motion.div>
        ))}
      </div>

      {/* Comparison bar chart */}
      <Panel>
        <h3 className="font-display text-xl text-white font-medium mb-6">Model comparison (accuracy %)</h3>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparison} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" domain={[80, 100]} stroke="#5A5A63" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis dataKey="model" type="category" stroke="#8A8A93" fontSize={11} tickLine={false} axisLine={false} width={80} />
              <Tooltip />
              <Bar dataKey="accuracy" radius={[0, 10, 10, 0]}>
                {comparison.map((c, i) => (<Cell key={i} fill={c.color} />))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* Training logs */}
      {logs.length > 0 && (
        <Panel>
          <h3 className="font-display text-lg text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#C6F24E]" strokeWidth={2} /> Training logs
          </h3>
          <div className="rounded-2xl bg-black/40 border border-white/5 p-5 font-mono text-xs space-y-1.5 max-h-[240px] overflow-y-auto">
            {logs.map((l, i) => (
              <div key={i} className={l.startsWith("✓") ? "text-[#C6F24E]" : l.startsWith("✗") ? "text-[#FF3B30]" : "text-[#8A8A93]"}>
                {l}
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
