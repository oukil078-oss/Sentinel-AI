import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, AlertTriangle, CheckCircle2, Sparkles, RefreshCw, Zap } from "lucide-react";
import { api, formatApiError } from "../lib/api";
import { PageHeader, Panel, Button, StatusPill } from "../components/ui";
import { useToast } from "../components/Toast";

const PRESET_FRAUD: any = {
  time: 54820, amount: 2890.55,
  v1: -3.12, v2: 2.9, v3: -4.1, v4: 5.5, v5: -1.8, v6: -2.2, v7: -4.6, v8: 0.9,
  v9: -2.5, v10: -6.1, v11: 4.2, v12: -5.8, v13: 0.2, v14: -7.4, v15: -0.6, v16: -5.1,
  v17: -6.7, v18: -1.1, v19: 0.3, v20: 0.1, v21: 0.4, v22: -0.2, v23: 0.0, v24: 0.1,
  v25: 0.0, v26: -0.1, v27: 0.0, v28: 0.0,
};
const PRESET_LEGIT: any = {
  time: 32010, amount: 42.50,
  v1: 0.2, v2: 0.1, v3: 0.0, v4: -0.1, v5: 0.05, v6: 0.0, v7: 0.1, v8: 0.0,
  v9: 0.2, v10: 0.0, v11: 0.0, v12: 0.1, v13: 0.0, v14: 0.1, v15: 0.0, v16: 0.0,
  v17: 0.0, v18: 0.0, v19: 0.0, v20: 0.0, v21: 0.0, v22: 0.0, v23: 0.0, v24: 0.0,
  v25: 0.0, v26: 0.0, v27: 0.0, v28: 0.0,
};

export function PredictionPage() {
  const { toast } = useToast();
  const [features, setFeatures] = useState<any>(PRESET_LEGIT);
  const [model, setModel] = useState<string>("random_forest");
  const [threshold, setThreshold] = useState(0.5);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const predict = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/api/predict", { ...features, model, threshold });
      setResult(data);
    } catch (err: any) { toast(formatApiError(err), "error"); }
    finally { setLoading(false); }
  };

  const loadPreset = (p: "fraud" | "legit") => {
    setFeatures(p === "fraud" ? PRESET_FRAUD : PRESET_LEGIT);
    setResult(null);
    toast(`${p === "fraud" ? "Fraud" : "Legitimate"} preset loaded`, "info");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Prediction lab"
        title="Live fraud scoring"
        subtitle="Feed a 30-dimensional transaction vector into the model and get a scored, explainable prediction in milliseconds."
      />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Input form */}
        <Panel className="xl:col-span-3">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#8A8A93] font-bold mb-1">Input vector</p>
              <h3 className="font-display text-xl text-white font-medium">Transaction features</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => loadPreset("legit")} testid="preset-legit-btn">Legit preset</Button>
              <Button variant="secondary" size="sm" onClick={() => loadPreset("fraud")} testid="preset-fraud-btn">Fraud preset</Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {["time", "amount", ...Array.from({ length: 28 }, (_, i) => `v${i + 1}`)].map((key) => (
              <div key={key}>
                <label className="text-[10px] uppercase tracking-[0.2em] text-[#5A5A63] font-bold">{key}</label>
                <input
                  type="number"
                  step="0.01"
                  value={features[key] ?? 0}
                  onChange={(e) => setFeatures({ ...features, [key]: parseFloat(e.target.value) || 0 })}
                  data-testid={`feature-${key}`}
                  className="w-full mt-1 bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-sm font-mono tnum text-white focus:border-[#C6F24E]/50 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </Panel>

        {/* Controls + Result */}
        <div className="xl:col-span-2 space-y-5">
          <Panel>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#8A8A93] font-bold mb-4">Model settings</p>

            <label className="text-xs text-[#8A8A93] font-medium block mb-2">Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              data-testid="prediction-model-select"
              className="w-full mb-5 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-[#C6F24E]/50 focus:outline-none"
            >
              <option value="random_forest">Random Forest (recommended)</option>
              <option value="knn">K-Nearest Neighbors</option>
              <option value="logistic_regression">Logistic Regression</option>
              <option value="decision_tree">Decision Tree</option>
              <option value="svm">Support Vector Machine</option>
            </select>

            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs text-[#8A8A93] font-medium">Threshold</label>
              <span className="font-mono text-[#C6F24E] text-sm tnum">{threshold.toFixed(2)}</span>
            </div>
            <input
              type="range" min={0} max={1} step={0.01}
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              data-testid="prediction-threshold"
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-[#5A5A63] font-mono mt-1">
              <span>0 (lenient)</span>
              <span>1 (strict)</span>
            </div>

            <Button
              variant="primary"
              className="w-full mt-5"
              onClick={predict}
              disabled={loading}
              testid="predict-btn"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" strokeWidth={2.5} />}
              {loading ? "Scoring…" : "Run prediction"}
            </Button>
          </Panel>

          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Panel
                className={result.is_fraud ? "!border-[#FF3B30]/30 !bg-[#FF3B30]/5" : "!border-[#C6F24E]/30 !bg-[#C6F24E]/5"}
              >
                <div className="flex items-center gap-3 mb-4">
                  {result.is_fraud ? (
                    <div className="w-11 h-11 rounded-2xl bg-[#FF3B30]/15 flex items-center justify-center text-[#FF3B30]">
                      <AlertTriangle className="w-5 h-5" strokeWidth={2} />
                    </div>
                  ) : (
                    <div className="w-11 h-11 rounded-2xl bg-[#C6F24E]/15 flex items-center justify-center text-[#C6F24E]">
                      <CheckCircle2 className="w-5 h-5" strokeWidth={2} />
                    </div>
                  )}
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-[#8A8A93] font-bold">Verdict</p>
                    <p className="font-display text-2xl text-white font-medium">
                      {result.is_fraud ? "Fraudulent" : "Legitimate"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-[#8A8A93]">Fraud probability</span>
                      <span className="font-mono text-2xl text-white tnum font-light">{(result.probability * 100).toFixed(2)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${result.probability * 100}%`,
                          background: result.is_fraud ? "#FF3B30" : "#C6F24E",
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#8A8A93] font-bold">Risk</p>
                      <p className="text-sm text-white font-semibold capitalize mt-1">{result.risk_level}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#8A8A93] font-bold">Confidence</p>
                      <p className="text-sm text-white font-semibold mt-1 font-mono tnum">{(result.confidence * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>

                {result.explanations?.length > 0 && (
                  <div className="pt-4 border-t border-white/5">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#8A8A93] font-bold mb-3">Top driving features</p>
                    <div className="space-y-1.5">
                      {result.explanations.map((e: any) => (
                        <div key={e.feature} className="flex items-center justify-between text-xs">
                          <span className="font-mono text-[#C6F24E] tnum">{e.feature}</span>
                          <span className="text-[#8A8A93]">value: <span className="text-white font-mono tnum">{e.value}</span></span>
                          <span className="text-[#8A8A93]">importance: <span className="text-white font-mono tnum">{(e.importance * 100).toFixed(1)}%</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Panel>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
